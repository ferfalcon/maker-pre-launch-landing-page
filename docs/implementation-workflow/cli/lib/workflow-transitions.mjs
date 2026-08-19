import { relative, resolve } from 'node:path';
import { renderArtifactFile } from './artifact-renderer.mjs';
import { commitRecordCandidate, prepareRecordMutation } from './record-store.mjs';
import {
  allowedTraceOwnerTypes, artifactTypesThroughStage, PROFILE_RANK, PROFILES, STAGES,
} from './workflow-model.mjs';
import {
  artifactId, fail, nextId, normalizeChoice, relativeDisplay, resolveRecordPath, write,
} from './utils.mjs';

function now() {
  return new Date().toISOString();
}

function date() {
  return new Date().toISOString().slice(0, 10);
}

function optionString(options, name, { required = false } = {}) {
  const value = options[name];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (required) throw new Error(`--${name} is required.`);
  return null;
}

function relativeArtifactPath(cwd, path) {
  const value = relative(cwd, path).split('\\').join('/');
  return value || path;
}

function renderForRecord(cwd, record, type, options = {}) {
  return renderArtifactFile(cwd, type, {
    control: 'cli-managed',
    project: record.project.name,
    profile: record.project.profile,
    mode: record.project.executionMode,
    date: date(),
    ...options,
  });
}

function nextArtifactId(record, type, suffix = '') {
  return artifactId(record, type, suffix);
}

function addArtifactCandidate(cwd, record, type, fileChanges, options = {}) {
  const desiredId = options.id ?? nextArtifactId(record, type, options.taskId ?? '');
  const rendered = renderForRecord(cwd, record, type, options);
  const destinationPath = relativeArtifactPath(cwd, rendered.path);
  const existing = record.artifacts.find((item) => (
    item.status !== 'Superseded'
    && (
      type === 'TASK'
        ? item.id === desiredId || item.path === destinationPath
        : item.type === type
    )
  ));
  if (existing) return existing;

  const placeholder = record.artifacts.find((item) => (
    item.type === type
    && item.status === 'Superseded'
    && item.path === destinationPath
    && !item.supersededBy
  ));
  if (placeholder) {
    placeholder.id = desiredId;
    placeholder.status = 'Draft';
    placeholder.baseline = [...new Set(options.baseline ?? record.state.activeInputs)];
    fileChanges.set(rendered.path, { content: rendered.content, overwrite: false });
    return placeholder;
  }

  const artifact = {
    id: desiredId,
    type,
    path: destinationPath,
    status: 'Draft',
    baseline: [...new Set(options.baseline ?? record.state.activeInputs)],
  };
  record.artifacts.push(artifact);
  fileChanges.set(rendered.path, { content: rendered.content, overwrite: false });
  return artifact;
}

function latestVerificationIds(record) {
  const ids = [];
  const snapshotIds = [
    ...record.state.activeInputs,
    record.state.latestOutput,
    record.state.latestValidationRuntime,
  ].filter(Boolean);
  for (const snapshotId of [...new Set(snapshotIds)]) {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === snapshotId);
    if (verification) ids.push(verification.id);
  }
  return ids;
}

function resetValidationForReplanning(task, reason) {
  for (const check of task.validation ?? []) {
    check.status = 'Not executed';
    check.evidence = [];
    check.reason = reason;
    delete check.actual;
    delete check.executedAt;
  }
}

function resetCurrentTaskForReplanning(record, reason) {
  const taskId = record.state.currentTask;
  if (!taskId) return null;
  const task = record.tasks.find((item) => item.id === taskId);
  if (!task || task.status !== 'In progress') {
    throw new Error(`Current task ${taskId} must be In progress before replanning.`);
  }

  const previousBaseline = task.baseline;
  task.status = 'Ready';
  task.blocker = null;
  resetValidationForReplanning(task, reason);
  record.state.currentTask = null;

  return { id: task.id, previousBaseline };
}

export function rewindStageForReplanning(cwd, stdout, stderr, positionals, options) {
  try {
    const target = Number(positionals[2]);
    if (!Number.isInteger(target) || target < 0 || target > 11) {
      throw new Error('Rewind stage must be an integer from 0 through 11.');
    }
    const reason = optionString(options, 'reason', { required: true });
    const recordPath = resolveRecordPath(cwd, options.record);
    const prepared = prepareRecordMutation(recordPath);
    const record = prepared.candidate;
    if (target >= record.state.stage) {
      throw new Error(`Rewind target must be lower than current Stage ${record.state.stage}.`);
    }

    const fromStage = record.state.stage;
    const resetTask = resetCurrentTaskForReplanning(
      record,
      `Stage rewind from ${fromStage} to ${target} requires validation to be rerun.`,
    );

    for (const gate of record.gates) {
      if (gate.stage >= target && gate.status === 'Active') gate.status = 'Superseded';
    }
    record.gates.push({
      id: nextId(record.gates, 'GATE-'),
      stage: fromStage,
      status: 'Superseded',
      result: 'Blocked',
      baseline: [...record.state.activeInputs],
      verifications: latestVerificationIds(record),
      artifacts: record.artifacts.filter((item) => item.status !== 'Superseded').map((item) => item.id),
      evidence: `Rewind to Stage ${target}: ${reason}`,
      recordedAt: now(),
    });
    record.state.stage = target;
    record.state.status = 'In progress';

    commitRecordCandidate({
      recordPath,
      currentRecord: prepared.record,
      candidate: record,
    });

    write(stdout, `Rewound to Stage ${target} — ${STAGES[target]}`);
    write(stdout, `Reason: ${reason}`);
    if (resetTask) write(stdout, `Reset ${resetTask.id} to Ready; task validation must be rerun after replanning.`);
    write(stdout, 'Artifact baselines were preserved; rebaseline explicitly if required.');
    return 0;
  } catch (error) {
    return fail(stderr, error instanceof Error ? error.message : String(error));
  }
}

export function startProfileUpgradeForReplanning(cwd, stdout, stderr, positionals, options) {
  try {
    const target = normalizeChoice(positionals[3], PROFILES);
    if (!target) throw new Error(`Unknown target profile. Choose: ${PROFILES.join(', ')}`);
    const resumeStage = Number(options['resume-stage']);
    if (!Number.isInteger(resumeStage) || resumeStage < 0 || resumeStage > 11) {
      throw new Error('--resume-stage must be an integer from 0 through 11.');
    }
    const reason = optionString(options, 'reason', { required: true });
    const recordPath = resolveRecordPath(cwd, options.record);
    const prepared = prepareRecordMutation(recordPath);
    const record = prepared.candidate;
    const from = record.project.profile;
    if ((PROFILE_RANK.get(target) ?? -1) <= (PROFILE_RANK.get(from) ?? -1)) {
      throw new Error('Profile changes are upgrade-only; downgrades and lateral changes are unsupported.');
    }
    if (record.profileTransitions.some((item) => item.status === 'In progress')) {
      throw new Error('A profile upgrade is already in progress.');
    }
    if (resumeStage > record.state.stage) throw new Error('Resume stage cannot be later than the current stage.');

    const resetTask = resetCurrentTaskForReplanning(
      record,
      `Profile upgrade from ${from} to ${target} requires validation to be rerun.`,
    );
    const sourceArtifacts = record.artifacts
      .filter((item) => item.status !== 'Superseded')
      .map((item) => item.id);

    record.project.profile = target;
    record.state.stage = resumeStage;
    record.state.status = 'Blocked';
    for (const gate of record.gates) {
      if (gate.stage >= resumeStage && gate.status === 'Active') gate.status = 'Superseded';
    }

    const fileChanges = new Map();
    const targetTypes = artifactTypesThroughStage(target, resumeStage, record.state.architectureDecision);
    const targetProfileTypes = new Set(artifactTypesThroughStage(target, 11, record.state.architectureDecision));
    const obsoleteOwnerIds = new Set(record.artifacts.filter((artifact) => (
      sourceArtifacts.includes(artifact.id)
      && ['WORKPACK', 'IMPLEMENTATION-BRIEF'].includes(artifact.type)
    )).map((artifact) => artifact.id));

    for (const item of record.traceItems.filter((candidate) => (
      candidate.status === 'Active' && obsoleteOwnerIds.has(candidate.owner)
    ))) {
      const ownerType = allowedTraceOwnerTypes(item.id).find((type) => targetProfileTypes.has(type));
      if (!ownerType) throw new Error(`Target profile ${target} has no compatible owner artifact for ${item.id}.`);
      if (!targetTypes.includes(ownerType)) targetTypes.push(ownerType);
    }

    const targetArtifacts = [];
    for (const type of targetTypes) {
      const artifact = addArtifactCandidate(cwd, record, type, fileChanges);
      if (!targetArtifacts.includes(artifact.id)) targetArtifacts.push(artifact.id);
    }

    const transition = {
      id: nextId(record.profileTransitions, 'PROFILE-'),
      from,
      to: target,
      resumeStage,
      reason,
      status: 'In progress',
      sourceArtifacts,
      targetArtifacts,
      startedAt: now(),
    };
    record.profileTransitions.push(transition);

    commitRecordCandidate({
      recordPath,
      currentRecord: prepared.record,
      candidate: record,
      fileChanges,
    });

    write(stdout, `Started ${transition.id}: ${from} → ${target}, resume at Stage ${resumeStage}`);
    if (resetTask) write(stdout, `Reset ${resetTask.id} to Ready; task validation must be rerun after profile reconciliation.`);
    return 0;
  } catch (error) {
    return fail(stderr, error instanceof Error ? error.message : String(error));
  }
}
