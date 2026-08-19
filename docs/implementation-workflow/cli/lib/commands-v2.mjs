import { execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import {
  allowedTraceOwnerTypes, GATE_RESULTS, ID_PATTERNS, MODES, PROFILE_RANK,
  PROFILES, SNAPSHOT_KINDS, STAGES, VALIDATION_KINDS, VALIDATION_STATUSES,
  VERIFICATION_RESULTS, artifactTypesForStage, artifactTypesThroughStage,
} from './workflow-model.mjs';
import { renderArtifactFile } from './artifact-renderer.mjs';
import { deriveNextAction, generatedStateFindings, syncGeneratedState } from './generated-state.mjs';
import { migrateRecordV1, migrationSummary } from './migrate-record.mjs';
import {
  commitRecordCandidate, mutateRecord, prepareRecordMutation, readStoredRecord,
  requireMutableRecord,
} from './record-store.mjs';
import { validateWorkflowRecord } from '../../scripts/lib/validate-workflow-record.mjs';
import {
  artifactId, artifactType, commaList, fail, gitCommit, nextId, nextTaskId,
  normalizeChoice, parseArgs, printFindings, relativeDisplay, resolveRecordPath,
  values, write,
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

function booleanOption(value, fallback = false) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true' || value === 'yes') return true;
  if (value === false || value === 'false' || value === 'no') return false;
  throw new Error('Boolean values must be true or false.');
}

function recordPathFor(cwd, options) {
  return resolveRecordPath(cwd, options.record);
}

function loadRecord(cwd, options, mutable = false) {
  const path = recordPathFor(cwd, options);
  const stored = readStoredRecord(path);
  if (mutable) requireMutableRecord(stored.record);
  return { path, record: stored.record };
}

function commandFailure(stderr, error) {
  return fail(stderr, error instanceof Error ? error.message : String(error));
}

function nextArtifactId(record, type, suffix = '') {
  return artifactId(record, type, suffix);
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
  const placeholder = record.artifacts.find((item) => item.type === type && item.status === 'Superseded' && item.path === destinationPath && !item.supersededBy);
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

function writeNewNarratives(fileChanges) {
  const staged = [];
  const committed = [];
  try {
    let index = 0;
    for (const [path, content] of fileChanges) {
      if (existsSync(path)) throw new Error(`Refusing to overwrite existing narrative file ${path}.`);
      mkdirSync(dirname(path), { recursive: true });
      const temp = `${path}.scaffold-${process.pid}-${Date.now()}-${index}.tmp`;
      index += 1;
      writeFileSync(temp, content, { flag: 'wx' });
      staged.push([temp, path]);
    }
    for (const [temp, path] of staged) {
      renameSync(temp, path);
      committed.push(path);
    }
  } catch (error) {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
    committed.forEach((path) => rmSync(path, { force: true }));
    throw error;
  } finally {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
  }
  return committed;
}

function snapshotForRepository(record, id) {
  return record.snapshots.find((item) => item.id === id && item.id.startsWith('SRC-REPO-'));
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

function requireCleanCurrent(recordPath, record, action) {
  const findings = [
    ...validateWorkflowRecord(record),
    ...generatedStateFindings(recordPath, record),
  ];
  if (findings.length > 0) {
    throw new Error(`Current workflow state must be clean before ${action}:\n${findings.map((item) => `- ${item}`).join('\n')}\nRun "design-workflow sync" after resolving record findings.`);
  }
}

function invalidateCurrentGate(record, nextStatus = 'In progress') {
  let invalidated = false;
  for (const gate of record.gates) {
    if (gate.stage === record.state.stage && gate.status === 'Active') {
      gate.status = 'Superseded';
      invalidated = true;
    }
  }
  if (invalidated) record.state.status = nextStatus;
  return invalidated;
}

function artifactBySelector(record, selector) {
  const exact = record.artifacts.find((item) => item.id === selector);
  if (exact) return exact;
  const type = artifactType(selector);
  if (type) return [...record.artifacts].reverse().find((item) => item.type === type && item.status !== 'Superseded');
  return null;
}

function taskById(record, id) {
  const task = record.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Task ${id} does not exist.`);
  return task;
}

function parseValidationStatus(value) {
  return normalizeChoice(value, VALIDATION_STATUSES);
}

function git(repository, args) {
  try {
    return execFileSync('git', ['-C', repository, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}
function gitSucceeds(repository, args) {
  try {
    execFileSync('git', ['-C', repository, ...args], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}


function verifyCommitLineage(record, task, commit) {
  const baseline = snapshotForRepository(record, task.baseline);
  if (!baseline?.commit) throw new Error(`Task baseline ${task.baseline} does not record a Git commit.`);
  const repository = baseline.reference;
  if (!repository || !git(repository, ['rev-parse', '--is-inside-work-tree'])) {
    throw new Error(`Task baseline ${task.baseline} does not reference an accessible Git repository.`);
  }
  if (!gitSucceeds(repository, ['cat-file', '-e', `${commit}^{commit}`])) throw new Error(`Commit ${commit} does not exist in the current Git repository.`);
  const head = git(repository, ['rev-parse', 'HEAD']);
  if (head !== commit) throw new Error(`Commit ${commit} is not HEAD (${head ?? 'unavailable'}).`);
  if (!gitSucceeds(repository, ['merge-base', '--is-ancestor', baseline.commit, commit]) && baseline.commit !== commit) {
    throw new Error(`Commit ${commit} does not descend from task baseline ${baseline.commit}.`);
  }
  return repository;
}

export function commandHelp(stdout) {
  write(stdout, `Design Workflow CLI

Usage:
  design-workflow init --name <name> [--profile Express|Lite|Standard|Full] [--control cli-managed|markdown-only]
  design-workflow migrate [--check]
  design-workflow status [--json]
  design-workflow next
  design-workflow stage review --result <result> --evidence <text> [--approved-by <actor>]
  design-workflow stage advance
  design-workflow stage rewind <stage> --reason <text>
  design-workflow architecture decide <required|not-required> --reason <text>
  design-workflow profile upgrade start <profile> --resume-stage <stage> --reason <text>
  design-workflow profile upgrade finish --evidence <text> [--approved-by <actor>]
  design-workflow snapshot add|verify|supersede ...
  design-workflow artifact adopt|scaffold|review|approve|reopen|supersede|baseline ...
  design-workflow trace define|update|supersede|show ...
  design-workflow task create|ready|start|block|unblock|complete ...
  design-workflow task validation set <task-id> ...
  design-workflow review set-result <result> --artifact <id> --output <snapshot> --evidence <text> --approved-by <actor>
  design-workflow mode set <mode>
  design-workflow sync [--check]
  design-workflow validate

Schema-v1 records remain readable, but mutation requires an explicit migration.`);
}

export function commandInit(cwd, stdout, stderr, options) {
  try {
    const profile = normalizeChoice(options.profile ?? 'Lite', PROFILES);
    if (!profile) throw new Error(`Unknown profile. Choose: ${PROFILES.join(', ')}`);
    const executionMode = normalizeChoice(options.mode ?? 'Gated', MODES);
    if (!executionMode) throw new Error(`Unknown execution mode. Choose: ${MODES.join(', ')}`);
    if (executionMode === 'Task-by-task') throw new Error('Task-by-task mode cannot begin before Stage 9.');
    const control = normalizeChoice(options.control ?? 'cli-managed', ['cli-managed', 'markdown-only']);
    if (!control) throw new Error('Unknown control mode. Choose: cli-managed, markdown-only');
    const name = optionString(options, 'name') ?? cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? 'Design implementation project';
    const types = artifactTypesForStage(profile, 0);

    if (control === 'markdown-only') {
      const changes = new Map();
      for (const type of types) {
        const rendered = renderArtifactFile(cwd, type, {
          control, project: name, profile, mode: executionMode, date: date(),
        });
        changes.set(rendered.path, rendered.content);
      }
      const files = writeNewNarratives(changes);
      write(stdout, `Initialized Markdown-only ${profile} workflow: ${name}`);
      files.forEach((path) => write(stdout, `- ${relativeDisplay(cwd, path)}`));
      write(stdout, 'Markdown-only control is scaffolded but not executable; use "artifact scaffold --control markdown-only" for later stages.');
      return 0;
    }

    const recordPath = recordPathFor(cwd, options);
    if (existsSync(recordPath)) throw new Error(`Workflow record already exists at ${recordPath}.`);
    const record = {
      schemaVersion: 2,
      project: { name, profile, executionMode },
      state: {
        stage: 0, status: 'In progress', activeInputs: [], currentTask: null,
        latestOutput: null, latestValidationRuntime: null, architectureDecision: null,
      },
      snapshots: [], verifications: [], artifacts: [], traceItems: [], gates: [],
      tasks: [], profileTransitions: [], implementationReviews: [],
    };
    if (optionString(options, 'design')) {
      record.snapshots.push({
        id: 'SRC-DS-001', role: 'Input baseline', pinStrength: 'Time-bound',
        status: 'Unverified', reference: optionString(options, 'design'),
      });
      record.state.activeInputs.push('SRC-DS-001');
    }
    if (optionString(options, 'repository')) {
      const repository = isAbsolute(options.repository) ? options.repository : resolve(cwd, options.repository);
      const commit = gitCommit(repository);
      if (!commit) throw new Error(`Could not resolve a Git commit from ${repository}`);
      record.snapshots.push({
        id: 'SRC-REPO-001', role: 'Input baseline', pinStrength: 'Immutable',
        status: 'Unverified', reference: repository, commit,
      });
      record.state.activeInputs.push('SRC-REPO-001');
    }
    const fileChanges = new Map();
    for (const type of types) addArtifactCandidate(cwd, record, type, fileChanges);
    const committed = commitRecordCandidate({
      recordPath, candidate: record, fileChanges, allowCreate: true,
    });
    write(stdout, `Initialized ${profile} workflow: ${name}`);
    write(stdout, `Record: ${relativeDisplay(cwd, recordPath)}`);
    write(stdout, `Scaffolded Stage 0 artifact(s): ${types.join(', ')}`);
    write(stdout, `Updated ${committed.files.length} transactional file(s).`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandMigrate(cwd, stdout, stderr, options) {
  try {
    const path = recordPathFor(cwd, options);
    const { record } = readStoredRecord(path);
    if (record.schemaVersion === 2) {
      write(stdout, 'Record already uses schema v2; no changes required.');
      return 0;
    }
    const legacyFindings = validateWorkflowRecord(record);
    if (legacyFindings.length > 0) throw new Error(`Schema-v1 record is invalid:\n${legacyFindings.map((item) => `- ${item}`).join('\n')}`);
    const candidate = migrateRecordV1(record);
    const summary = migrationSummary(record, candidate);
    const candidateFindings = validateWorkflowRecord(candidate);
    if (candidateFindings.length > 0) throw new Error(`Migrated candidate is invalid:\n${candidateFindings.map((item) => `- ${item}`).join('\n')}`);
    if (options.check) {
      write(stdout, 'Migration check: changes required');
      summary.forEach((item) => write(stdout, `- ${item}`));
      return 1;
    }
    commitRecordCandidate({ recordPath: path, currentRecord: record, candidate });
    write(stdout, 'Migration complete.');
    summary.forEach((item) => write(stdout, `- ${item}`));
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandStatus(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const findings = [...validateWorkflowRecord(record), ...generatedStateFindings(path, record)];
    if (options.json) {
      write(stdout, JSON.stringify({
        record: relativeDisplay(cwd, path), project: record.project, state: record.state,
        schemaVersion: record.schemaVersion,
        readOnly: record.schemaVersion === 1,
        counts: {
          snapshots: record.snapshots.length,
          verifications: record.verifications?.length ?? 0,
          artifacts: record.artifacts.length,
          traceItems: record.traceItems?.length ?? 0,
          gates: record.gates?.length ?? 0,
          tasks: record.tasks.length,
          completeTasks: record.tasks.filter((task) => task.status === 'Complete').length,
        },
        generatedViewsCurrent: !findings.some((item) => item.startsWith('Generated workflow view')),
        valid: findings.length === 0,
        findings,
      }, null, 2));
      return findings.length === 0 ? 0 : 1;
    }
    write(stdout, record.project.name);
    write(stdout, `Schema: v${record.schemaVersion}${record.schemaVersion === 1 ? ' (read-only)' : ''}`);
    write(stdout, `Profile: ${record.project.profile}`);
    write(stdout, `Mode: ${record.project.executionMode}`);
    write(stdout, `Stage: ${record.state.stage} — ${STAGES[record.state.stage]}`);
    write(stdout, `Status: ${record.state.status}`);
    write(stdout, `Next action: ${deriveNextAction(record)}`);
    printFindings(stdout, findings);
    return findings.length === 0 ? 0 : 1;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandNext(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const findings = [...validateWorkflowRecord(record), ...generatedStateFindings(path, record)];
    if (findings.length > 0) throw new Error(`Resolve workflow findings before advancing:\n${findings.map((item) => `- ${item}`).join('\n')}`);
    write(stdout, `Next action: ${deriveNextAction(record)}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandStage(cwd, stdout, stderr, positionals, options) {
  const action = positionals[1];
  if (action === 'set') return fail(stderr, '"stage set" is non-mutating compatibility syntax. Use "stage review", "stage advance", or "stage rewind".');
  try {
    const path = recordPathFor(cwd, options);
    if (action === 'review') {
      const result = normalizeChoice(optionString(options, 'result', { required: true }), GATE_RESULTS);
      if (!result) throw new Error(`Unknown gate result. Choose: ${GATE_RESULTS.join(', ')}`);
      const evidence = optionString(options, 'evidence', { required: true });
      const approvedBy = optionString(options, 'approved-by');
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.project.executionMode === 'Gated' && !approvedBy) throw new Error('--approved-by is required for every Gated stage decision.');
      for (const gate of record.gates) if (gate.stage === record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
      const gate = {
        id: nextId(record.gates, 'GATE-'),
        stage: record.state.stage,
        status: 'Active', result,
        baseline: [...record.state.activeInputs],
        verifications: latestVerificationIds(record),
        artifacts: record.artifacts.filter((item) => item.status !== 'Superseded').map((item) => item.id),
        evidence, recordedAt: now(),
        ...(approvedBy ? { approvedBy } : {}),
      };
      record.gates.push(gate);
      record.state.status = result.startsWith('Passed') ? 'Ready' : 'Blocked';
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Recorded ${gate.id}: Stage ${gate.stage} — ${result}`);
      return 0;
    }
    if (action === 'advance') {
      const prepared = prepareRecordMutation(path);
      requireCleanCurrent(path, prepared.record, 'stage advancement');
      const record = prepared.candidate;
      const stage = record.state.stage;
      if (stage >= 11) throw new Error('Stage 11 is the final stage; completion is recorded with "review set-result".');
      const gate = [...record.gates].reverse().find((item) => item.stage === stage && item.status === 'Active');
      if (!gate || !['Passed', 'Passed with assumptions'].includes(gate.result)) throw new Error(`Stage ${stage} requires an active passing gate.`);
      if (record.profileTransitions.some((item) => item.status === 'In progress')) throw new Error('Profile upgrade must finish before stage advancement.');
      if (record.project.executionMode === 'Continuous documentation' && stage + 1 >= 10) throw new Error('Continuous-documentation mode cannot enter Stage 10.');
      const nextStage = stage + 1;
      record.state.stage = nextStage;
      record.state.status = 'In progress';
      const fileChanges = new Map();
      const scaffolded = [];
      for (const type of artifactTypesForStage(record.project.profile, nextStage, record.state.architectureDecision)) {
        if (!record.artifacts.some((item) => item.type === type && item.status !== 'Superseded')) {
          addArtifactCandidate(cwd, record, type, fileChanges);
          scaffolded.push(type);
        }
      }
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record, fileChanges });
      write(stdout, `Advanced to Stage ${nextStage} — ${STAGES[nextStage]}`);
      if (scaffolded.length) write(stdout, `Scaffolded: ${scaffolded.join(', ')}`);
      return 0;
    }
    if (action === 'rewind') {
      const target = Number(positionals[2]);
      if (!Number.isInteger(target) || target < 0 || target > 11) throw new Error('Rewind stage must be an integer from 0 through 11.');
      const reason = optionString(options, 'reason', { required: true });
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (target >= record.state.stage) throw new Error(`Rewind target must be lower than current Stage ${record.state.stage}.`);
      const fromStage = record.state.stage;
      for (const gate of record.gates) if (gate.stage >= target && gate.status === 'Active') gate.status = 'Superseded';
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
      record.state.currentTask = null;
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Rewound to Stage ${target} — ${STAGES[target]}`);
      write(stdout, `Reason: ${reason}`);
      write(stdout, 'Artifact baselines were preserved; rebaseline explicitly if required.');
      return 0;
    }
    throw new Error('Usage: design-workflow stage <review|advance|rewind>');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandArchitecture(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'decide' || !positionals[2]) throw new Error('Usage: design-workflow architecture decide <required|not-required> --reason <text>');
    const normalized = positionals[2].toLowerCase();
    const result = normalized === 'required' ? 'Required' : normalized === 'not-required' ? 'Not required' : null;
    if (!result) throw new Error('Architecture decision must be required or not-required.');
    const reason = optionString(options, 'reason', { required: true });
    const path = recordPathFor(cwd, options);
    const prepared = prepareRecordMutation(path);
    const record = prepared.candidate;
    invalidateCurrentGate(record);
    record.state.architectureDecision = { result, reason, recordedAt: now() };
    const fileChanges = new Map();
    if (
      result === 'Required'
      && record.project.profile === 'Standard'
      && record.state.stage >= 6
      && !record.artifacts.some((artifact) => artifact.type === 'ARCHITECTURE' && artifact.status !== 'Superseded')
    ) {
      addArtifactCandidate(cwd, record, 'ARCHITECTURE', fileChanges);
    }
    if (result === 'Required' && ['Express', 'Lite'].includes(record.project.profile)) {
      record.state.status = 'Blocked';
    }
    commitRecordCandidate({
      recordPath: path,
      currentRecord: prepared.record,
      candidate: record,
      fileChanges,
    });
    write(stdout, `Architecture decision recorded: ${result}`);
    if (fileChanges.size > 0) write(stdout, 'Scaffolded: ARCHITECTURE');
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandMode(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'set' || !positionals[2]) throw new Error('Usage: design-workflow mode set <mode>');
    const mode = normalizeChoice(positionals.slice(2).join(' '), MODES);
    if (!mode) throw new Error(`Unknown execution mode. Choose: ${MODES.join(', ')}`);
    const path = recordPathFor(cwd, options);
    mutateRecord(path, (record) => {
      if (mode === 'Task-by-task' && record.state.stage < 9) throw new Error('Task-by-task mode requires Stage 9 or later.');
      if (mode === 'Continuous documentation' && record.state.stage >= 10) throw new Error('Continuous-documentation mode cannot be selected at Stage 10 or later.');
      invalidateCurrentGate(record);
      record.project.executionMode = mode;
    });
    write(stdout, `Execution mode set to ${mode}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandProfile(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'upgrade') throw new Error('Usage: design-workflow profile upgrade <start|finish> ...');
    const action = positionals[2];
    const path = recordPathFor(cwd, options);
    if (action === 'start') {
      const target = normalizeChoice(positionals[3], PROFILES);
      if (!target) throw new Error(`Unknown target profile. Choose: ${PROFILES.join(', ')}`);
      const resumeStage = Number(options['resume-stage']);
      if (!Number.isInteger(resumeStage) || resumeStage < 0 || resumeStage > 11) throw new Error('--resume-stage must be an integer from 0 through 11.');
      const reason = optionString(options, 'reason', { required: true });
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      const from = record.project.profile;
      if ((PROFILE_RANK.get(target) ?? -1) <= (PROFILE_RANK.get(from) ?? -1)) throw new Error('Profile changes are upgrade-only; downgrades and lateral changes are unsupported.');
      if (record.profileTransitions.some((item) => item.status === 'In progress')) throw new Error('A profile upgrade is already in progress.');
      if (resumeStage > record.state.stage) throw new Error('Resume stage cannot be later than the current stage.');
      const sourceArtifacts = record.artifacts.filter((item) => item.status !== 'Superseded').map((item) => item.id);
      record.project.profile = target;
      record.state.stage = resumeStage;
      record.state.status = 'Blocked';
      record.state.currentTask = null;
      for (const gate of record.gates) if (gate.stage >= resumeStage && gate.status === 'Active') gate.status = 'Superseded';
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
        id: nextId(record.profileTransitions, 'PROFILE-'), from, to: target,
        resumeStage, reason, status: 'In progress', sourceArtifacts,
        targetArtifacts, startedAt: now(),
      };
      record.profileTransitions.push(transition);
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record, fileChanges });
      write(stdout, `Started ${transition.id}: ${from} → ${target}, resume at Stage ${resumeStage}`);
      return 0;
    }
    if (action === 'finish') {
      const evidence = optionString(options, 'evidence', { required: true });
      const approvedBy = optionString(options, 'approved-by');
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      const transition = record.profileTransitions.find((item) => item.status === 'In progress');
      if (!transition) throw new Error('No profile upgrade is in progress.');
      if (record.project.executionMode === 'Gated' && !approvedBy) throw new Error('--approved-by is required to finish a Gated profile upgrade.');
      const unreconciled = transition.targetArtifacts.filter((id) => {
        const artifact = record.artifacts.find((item) => item.id === id);
        return !artifact || !['Reviewed', 'Approved'].includes(artifact.status);
      });
      if (unreconciled.length > 0) throw new Error(`Target artifacts are not reconciled: ${unreconciled.join(', ')}`);
      const obsoleteOwnerIds = new Set(transition.sourceArtifacts.filter((id) => {
        const artifact = record.artifacts.find((candidate) => candidate.id === id);
        return artifact && ['WORKPACK', 'IMPLEMENTATION-BRIEF'].includes(artifact.type);
      }));
      const unreconciledTrace = record.traceItems.filter((item) => (
        item.status === 'Active' && obsoleteOwnerIds.has(item.owner)
      ));
      if (unreconciledTrace.length > 0) {
        throw new Error(`Trace owners must be reconciled before profile finish: ${unreconciledTrace.map((item) => item.id).join(', ')}. Use "trace update --owner".`);
      }
      transition.status = 'Complete';
      transition.completedAt = now();
      transition.evidence = evidence;
      if (approvedBy) transition.approvedBy = approvedBy;
      const replacement = transition.targetArtifacts[0];
      for (const id of transition.sourceArtifacts) {
        const artifact = record.artifacts.find((item) => item.id === id);
        if (artifact && ['WORKPACK', 'IMPLEMENTATION-BRIEF'].includes(artifact.type) && replacement) {
          artifact.status = 'Superseded';
          artifact.supersededBy = replacement;
        }
      }
      record.state.status = 'In progress';
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Finished ${transition.id}: profile is now ${transition.to}`);
      return 0;
    }
    throw new Error('Usage: design-workflow profile upgrade <start|finish> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandSnapshot(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const path = recordPathFor(cwd, options);
    if (action === 'add') {
      const kind = typeof options.kind === 'string' ? SNAPSHOT_KINDS[options.kind.toLowerCase()] : null;
      if (!kind) throw new Error(`Unknown snapshot kind. Choose: ${Object.keys(SNAPSHOT_KINDS).join(', ')}`);
      const reference = optionString(options, 'reference', { required: true });
      let createdId;
      mutateRecord(path, (record) => {
        const id = optionString(options, 'id') ?? nextId(record.snapshots, `SRC-${kind}-`);
        const commit = optionString(options, 'commit')?.toLowerCase();
        const role = optionString(options, 'role') ?? 'Input baseline';
        const snapshot = {
          id, role,
          pinStrength: optionString(options, 'pin') ?? (kind === 'REPO' && commit ? 'Immutable' : 'Time-bound'),
          status: optionString(options, 'status') ?? 'Unverified', reference,
          ...(commit ? { commit } : {}),
          ...(optionString(options, 'parent') ? { parent: optionString(options, 'parent') } : {}),
          ...(optionString(options, 'task') ? { task: optionString(options, 'task') } : {}),
        };
        record.snapshots.push(snapshot);
        if (options.activate || role === 'Input baseline') record.state.activeInputs = [...new Set([...record.state.activeInputs, id])];
        invalidateCurrentGate(record);
        createdId = id;
      });
      write(stdout, `Added snapshot ${createdId}`);
      return 0;
    }
    if (action === 'verify') {
      const id = positionals[2];
      if (!id) throw new Error('Usage: design-workflow snapshot verify <id> --result <result> --method <text> --evidence <text>');
      const result = normalizeChoice(optionString(options, 'result', { required: true }), VERIFICATION_RESULTS);
      if (!result) throw new Error(`Unknown verification result. Choose: ${VERIFICATION_RESULTS.join(', ')}`);
      const method = optionString(options, 'method', { required: true });
      const evidence = optionString(options, 'evidence', { required: true });
      let verificationId;
      mutateRecord(path, (record) => {
        const snapshot = record.snapshots.find((item) => item.id === id);
        if (!snapshot) throw new Error(`Snapshot ${id} does not exist.`);
        verificationId = nextId(record.verifications, 'VER-');
        record.verifications.push({ id: verificationId, snapshot: id, result, method, evidence, checkedAt: now() });
        invalidateCurrentGate(record);
        if (['Unexpected upstream or concurrent change', 'Unavailable'].includes(result) && record.state.activeInputs.includes(id)) { record.state.status = 'Blocked'; for (const gate of record.gates) if (gate.stage >= record.state.stage && gate.status === 'Active') gate.status = 'Superseded'; }
        else if (snapshot.status === 'Unverified') snapshot.status = 'Active';
      });
      write(stdout, `Recorded ${verificationId}: ${id} — ${result}`);
      return 0;
    }
    if (action === 'supersede') {
      const id = positionals[2];
      const replacementId = optionString(options, 'by', { required: true });
      const reason = optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        const snapshot = record.snapshots.find((item) => item.id === id);
        const replacement = record.snapshots.find((item) => item.id === replacementId);
        if (!snapshot || !replacement) throw new Error('Both the superseded snapshot and replacement must exist.');
        if (id === replacementId) throw new Error('A snapshot cannot supersede itself.');
        if (snapshot.status === 'Superseded') throw new Error(`Snapshot ${id} is already superseded.`);
        snapshot.status = 'Superseded';
        snapshot.supersededBy = replacementId;
        if (replacement.status === 'Superseded') throw new Error(`Replacement snapshot ${replacementId} is superseded.`);
        record.state.activeInputs = record.state.activeInputs.map((item) => item === id ? replacementId : item);
        record.state.activeInputs = [...new Set(record.state.activeInputs)];
        record.verifications.push({
          id: nextId(record.verifications, 'VER-'), snapshot: id,
          result: 'Unexpected upstream or concurrent change', method: 'Snapshot supersession',
          evidence: reason, checkedAt: now(), replacement: replacementId,
        });
        for (const gate of record.gates) if (gate.stage >= record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
        record.state.status = 'Blocked';
      });
      write(stdout, `Superseded ${id} by ${replacementId}; artifact baselines were not rewritten.`);
      return 0;
    }
    throw new Error('Usage: design-workflow snapshot <add|verify|supersede> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandArtifact(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const selector = positionals[2];
    if (action === 'scaffold' || action === 'create') {
      const type = artifactType(selector);
      if (!type) throw new Error(`Unknown artifact type: ${selector ?? ''}`);
      const control = normalizeChoice(options.control ?? (action === 'create' ? 'cli-managed' : null), ['cli-managed', 'markdown-only']);
      if (!control) throw new Error('--control must be cli-managed or markdown-only.');
      if (control === 'markdown-only') {
        const rendered = renderArtifactFile(cwd, type, {
          control,
          project: optionString(options, 'project') ?? cwd.split(/[\\/]/).filter(Boolean).at(-1),
          profile: optionString(options, 'profile') ?? 'Standard',
          mode: optionString(options, 'mode') ?? 'Gated',
          date: date(), taskId: optionString(options, 'task-id'), taskTitle: optionString(options, 'title'),
          path: optionString(options, 'path'),
        });
        writeNewNarratives(new Map([[rendered.path, rendered.content]]));
        write(stdout, `Scaffolded Markdown-only ${type}: ${relativeDisplay(cwd, rendered.path)}`);
        return 0;
      }
      const path = recordPathFor(cwd, options);
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.project.profile === 'Express' && type !== 'WORKPACK') throw new Error('Express consolidates artifact ownership in WORKPACK; upgrade the profile first.');
      const fileChanges = new Map();
      const artifact = addArtifactCandidate(cwd, record, type, fileChanges, {
        path: optionString(options, 'path'), id: optionString(options, 'id'),
        taskId: optionString(options, 'task-id'), taskTitle: optionString(options, 'title'),
        baseline: options.baseline ? commaList(options.baseline) : undefined,
      });
      if (fileChanges.size === 0) throw new Error(`An active ${type} artifact already exists as ${artifact.id}.`);
      invalidateCurrentGate(record);
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record, fileChanges });
      write(stdout, `Scaffolded ${artifact.id}: ${artifact.path}`);
      return 0;
    }
    if (action === 'adopt') {
      const type = artifactType(selector);
      if (!type) throw new Error(`Unknown artifact type: ${selector ?? ''}`);
      const narrative = optionString(options, 'path', { required: true });
      const absolute = isAbsolute(narrative) ? narrative : resolve(cwd, narrative);
      if (!existsSync(absolute)) throw new Error(`Narrative file does not exist: ${absolute}`);
      const path = recordPathFor(cwd, options);
      let id;
      mutateRecord(path, (record) => {
        const taskId = optionString(options, 'task-id');
        id = optionString(options, 'id') ?? nextArtifactId(record, type, taskId ?? '');
        const artifactPath = relativeArtifactPath(cwd, absolute);
        const conflict = record.artifacts.find((item) => (
          item.status !== 'Superseded'
          && (
            item.id === id
            || item.path === artifactPath
            || (type !== 'TASK' && item.type === type)
          )
        ));
        if (conflict) throw new Error(`Narrative conflicts with active artifact ${conflict.id}.`);
        record.artifacts.push({
          id, type, path: artifactPath, status: 'Draft',
          baseline: options.baseline ? commaList(options.baseline) : [...record.state.activeInputs],
        });
        invalidateCurrentGate(record);
      });
      write(stdout, `Adopted ${narrative} as ${id}`);
      return 0;
    }
    const path = recordPathFor(cwd, options);
    if (['review', 'approve', 'reopen'].includes(action)) {
      if (!selector) throw new Error(`Usage: design-workflow artifact ${action} <artifact-id|type> --evidence <text>`);
      const evidence = optionString(options, 'evidence', { required: true });
      const actor = optionString(options, 'approved-by') ?? optionString(options, 'by');
      let id;
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        if (!artifact) throw new Error(`Artifact ${selector} does not exist.`);
        const expected = action === 'review' ? 'Draft' : action === 'approve' ? 'Reviewed' : null;
        const next = action === 'review' ? 'Reviewed' : action === 'approve' ? 'Approved' : 'Draft';
        if (expected && artifact.status !== expected) throw new Error(`${artifact.id} must be ${expected} before ${action}.`);
        if (action === 'reopen' && !['Reviewed', 'Approved'].includes(artifact.status)) throw new Error(`${artifact.id} must be Reviewed or Approved before reopen.`);
        if (action === 'approve' && record.project.executionMode === 'Gated' && !actor) throw new Error('--approved-by is required to approve an artifact in Gated mode.');
        artifact.status = next;
        artifact.statusChangedAt = now();
        artifact.statusEvidence = evidence;
        if (actor) artifact.statusBy = actor;
        invalidateCurrentGate(record);
        if (action === 'reopen') {
          for (const gate of record.gates) if (gate.stage >= record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
          record.state.status = 'In progress';
        }
        id = artifact.id;
      });
      write(stdout, `${id} is now ${action === 'review' ? 'Reviewed' : action === 'approve' ? 'Approved' : 'Draft'}`);
      return 0;
    }
    if (action === 'supersede') {
      const replacement = optionString(options, 'by', { required: true });
      optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        const by = artifactBySelector(record, replacement);
        if (!artifact || !by) throw new Error('Both artifacts must exist.');
        if (artifact.id === by.id) throw new Error('An artifact cannot supersede itself.');
        invalidateCurrentGate(record);
        artifact.status = 'Superseded';
        artifact.supersededBy = by.id;
        artifact.statusChangedAt = now();
        artifact.statusEvidence = options.reason;
      });
      write(stdout, `Superseded ${selector} by ${replacement}`);
      return 0;
    }
    if (action === 'baseline') {
      const baseline = commaList(options.baseline ?? options.snapshot);
      if (baseline.length === 0) throw new Error('--baseline or --snapshot is required.');
      let reopened = false;
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        if (!artifact) throw new Error(`Artifact ${selector} does not exist.`);
        const changed = JSON.stringify(artifact.baseline) !== JSON.stringify(baseline);
        artifact.baseline = baseline;
        if (changed) {
          invalidateCurrentGate(record);
          record.state.status = 'In progress';
        }
        if (changed && artifact.status === 'Approved') {
          artifact.status = 'Draft';
          artifact.statusChangedAt = now();
          artifact.statusEvidence = 'Approved baseline changed; artifact reopened.';
          for (const gate of record.gates) if (gate.stage >= record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
          record.state.status = 'In progress';
          reopened = true;
        }
      });
      write(stdout, `Updated ${selector} baseline.${reopened ? ' Approved artifact reopened to Draft.' : ''}`);
      return 0;
    }
    throw new Error('Usage: design-workflow artifact <adopt|scaffold|review|approve|reopen|supersede|baseline> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandTrace(cwd, stdout, stderr, positionals, options) {
  try {
    let action = positionals[1];
    let id = positionals[2];
    if (action && !['define', 'update', 'supersede', 'show'].includes(action)) {
      id = action;
      action = 'show';
    }
    if (!action || !id) throw new Error('Usage: design-workflow trace <define|update|supersede|show> <domain-id> ...');
    const path = recordPathFor(cwd, options);
    if (action === 'show') {
      const { record } = loadRecord(cwd, options);
      const item = record.traceItems?.find((candidate) => candidate.id === id);
      const matches = [];
      if (item) matches.push(`Definition: owner ${item.owner}, ${item.required ? 'required' : 'optional'}, ${item.status}; upstream: ${item.references.join(', ') || 'none'}`);
      for (const task of record.tasks) {
        if (task.references.includes(id)) matches.push(`Task ${task.id} (${task.status})`);
        for (const check of task.validation) if (check.references?.includes(id)) matches.push(`Validation ${task.id}/${check.name} (${check.status})`);
      }
      if (matches.length === 0) throw new Error(`No traceability references found for ${id}.`);
      write(stdout, `Traceability for ${id}:`);
      matches.forEach((match) => write(stdout, `- ${match}`));
      return 0;
    }
    if (!ID_PATTERNS.domain.test(id)) throw new Error(`Invalid canonical domain ID: ${id}`);
    if (action === 'define') {
      const owner = optionString(options, 'owner', { required: true });
      mutateRecord(path, (record) => {
        if (record.traceItems.some((item) => item.id === id)) throw new Error(`Trace item ${id} already exists.`);
        record.traceItems.push({
          id, owner, status: 'Active', required: booleanOption(options.required, false),
          references: commaList(options.references),
        });
        invalidateCurrentGate(record);
      });
      write(stdout, `Defined ${id}`);
      return 0;
    }
    if (action === 'update') {
      mutateRecord(path, (record) => {
        const item = record.traceItems.find((candidate) => candidate.id === id);
        if (!item) throw new Error(`Trace item ${id} does not exist.`);
        if (options.owner !== undefined) item.owner = optionString(options, 'owner', { required: true });
        if (options.required !== undefined) item.required = booleanOption(options.required);
        if (options.references !== undefined) item.references = commaList(options.references);
        invalidateCurrentGate(record);
      });
      write(stdout, `Updated ${id}`);
      return 0;
    }
    if (action === 'supersede') {
      const replacement = optionString(options, 'by', { required: true });
      mutateRecord(path, (record) => {
        const item = record.traceItems.find((candidate) => candidate.id === id);
        const by = record.traceItems.find((candidate) => candidate.id === replacement);
        if (!item || !by) throw new Error('Both trace definitions must exist.');
        if (id === replacement) throw new Error('A trace item cannot supersede itself.');
        invalidateCurrentGate(record);
        for (const candidate of record.traceItems) {
          if (candidate.status === 'Active') {
            candidate.references = candidate.references.map((reference) => reference === id ? replacement : reference);
            candidate.references = [...new Set(candidate.references)];
          }
        }
        for (const task of record.tasks) {
          task.references = task.references.map((reference) => reference === id ? replacement : reference);
          task.references = [...new Set(task.references)];
          for (const check of task.validation) {
            check.references = check.references.map((reference) => reference === id ? replacement : reference);
            check.references = [...new Set(check.references)];
          }
        }
        item.status = 'Superseded';
        item.supersededBy = replacement;
      });
      write(stdout, `Superseded ${id} by ${replacement}`);
      return 0;
    }
    throw new Error('Unknown trace action.');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandTask(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const path = recordPathFor(cwd, options);
    if (action === 'create') {
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.state.stage !== 9) throw new Error('Tasks may be created only during Stage 9 decomposition.');
      if (record.project.profile === 'Express' && record.tasks.length >= 1) throw new Error('Express permits exactly one implementation task.');
      const baseline = optionString(options, 'baseline')
        ?? record.state.latestOutput
        ?? [...record.state.activeInputs].reverse().find((id) => id.startsWith('SRC-REPO-'));
      if (!baseline) throw new Error('No repository baseline is available.');
      const id = optionString(options, 'id') ?? nextTaskId(record.tasks);
      if (record.tasks.some((item) => item.id === id)) throw new Error(`Task ${id} already exists.`);
      const prerequisites = commaList(options.prerequisites);
      if (record.project.profile === 'Express' && prerequisites.length) throw new Error('Express tasks cannot have prerequisites.');
      const references = commaList(options.references);
      record.tasks.push({
        id, status: 'Not started', baseline, prerequisites, references,
        output: null, blocker: null, validation: [],
      });
      const fileChanges = new Map();
      if (record.project.profile !== 'Express') {
        addArtifactCandidate(cwd, record, 'TASK', fileChanges, {
          id: nextArtifactId(record, 'TASK', id),
          taskId: id,
          taskTitle: optionString(options, 'title') ?? 'Implementation task',
          path: optionString(options, 'path'),
          baseline: [...new Set([...record.state.activeInputs, baseline])],
        });
      }
      invalidateCurrentGate(record);
      commitRecordCandidate({
        recordPath: path,
        currentRecord: prepared.record,
        candidate: record,
        fileChanges,
      });
      write(stdout, `Created task ${id}`);
      return 0;
    }
    if (action === 'validation' && positionals[2] === 'set') {
      const id = positionals[3];
      if (!id) throw new Error('Usage: design-workflow task validation set <task-id> ...');
      const name = optionString(options, 'name', { required: true });
      const kind = normalizeChoice(optionString(options, 'kind', { required: true }), VALIDATION_KINDS);
      if (!kind) throw new Error(`Unknown validation kind. Choose: ${VALIDATION_KINDS.join(', ')}`);
      const status = parseValidationStatus(optionString(options, 'status', { required: true }));
      if (!status) throw new Error(`Unknown validation status. Choose: ${VALIDATION_STATUSES.join(', ')}`);
      const required = booleanOption(options.required, true);
      const expected = optionString(options, 'expected', { required: true });
      const evidence = values(options.evidence).map(String).map((item) => item.trim()).filter(Boolean);
      const check = {
        name, kind, required, status, expected,
        ...(optionString(options, 'actual') ? { actual: optionString(options, 'actual') } : {}),
        ...(optionString(options, 'command') ? { command: optionString(options, 'command') } : {}),
        ...(optionString(options, 'environment') ? { environment: optionString(options, 'environment') } : {}),
        ...(optionString(options, 'executed-at') ? { executedAt: optionString(options, 'executed-at') } : {}),
        evidence,
        ...(optionString(options, 'reason') ? { reason: optionString(options, 'reason') } : {}),
        references: commaList(options.references),
      };
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) {
          throw new Error('Task validation may be recorded only during Stages 9 and 10.');
        }
        const task = taskById(record, id);
        const index = task.validation.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
        if (index >= 0) task.validation[index] = check;
        else task.validation.push(check);
        invalidateCurrentGate(record);
      });
      write(stdout, `Set validation ${id}/${name}: ${status}`);
      return 0;
    }
    const id = positionals[2];
    if (!id) throw new Error('Task ID is required.');
    if (action === 'ready') {
      mutateRecord(path, (record) => {
        if (record.state.stage !== 9) throw new Error('Tasks become Ready only during the Stage 9 exit.');
        const task = taskById(record, id);
        if (task.status !== 'Not started') throw new Error(`${id} must be Not started before Ready.`);
        task.status = 'Ready';
        invalidateCurrentGate(record);
      });
      write(stdout, `${id} is Ready`);
      return 0;
    }
    if (action === 'start') {
      const prepared = prepareRecordMutation(path);
      requireCleanCurrent(path, prepared.record, 'task execution');
      const record = prepared.candidate;
      if (record.state.stage !== 10) {
        throw new Error('Task execution requires an approved Stage 9 gate and entry into Stage 10.');
      }
      if (record.project.executionMode === 'Continuous documentation') {
        throw new Error('Continuous-documentation mode cannot execute tasks.');
      }
      const task = taskById(record, id);
      if (task.status !== 'Ready') throw new Error(`${id} must be Ready before start.`);
      const incomplete = task.prerequisites.filter((dependency) => taskById(record, dependency).status !== 'Complete');
      if (incomplete.length) throw new Error(`Incomplete prerequisites: ${incomplete.join(', ')}`);
      if (record.state.currentTask && record.state.currentTask !== id) {
        throw new Error(`${record.state.currentTask} is already in progress.`);
      }
      task.status = 'In progress';
      record.state.currentTask = id;
      record.state.status = 'In progress';
      invalidateCurrentGate(record);
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Started ${id}`);
      return 0;
    }
    if (action === 'block') {
      const reason = optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) throw new Error('Tasks may be blocked only during Stages 9 and 10.');
        const task = taskById(record, id);
        if (task.status === 'Blocked' || task.status === 'Complete') {
          throw new Error(`${id} cannot be blocked from ${task.status}.`);
        }
        task.blocker = { reason, previousStatus: task.status, recordedAt: now() };
        task.status = 'Blocked';
        if (record.state.currentTask === id) record.state.currentTask = null;
        for (const gate of record.gates) {
          if (gate.stage >= record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
        }
        record.state.status = 'Blocked';
        invalidateCurrentGate(record, 'Blocked');
      });
      write(stdout, `Blocked ${id}`);
      return 0;
    }
    if (action === 'unblock') {
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) throw new Error('Tasks may be unblocked only during Stages 9 and 10.');
        const task = taskById(record, id);
        if (task.status !== 'Blocked' || !task.blocker) throw new Error(`${id} is not blocked.`);
        const previousStatus = task.blocker.previousStatus;
        if (previousStatus === 'In progress') {
          if (record.state.currentTask && record.state.currentTask !== id) {
            throw new Error(`${record.state.currentTask} is already in progress.`);
          }
          record.state.currentTask = id;
        }
        task.status = previousStatus;
        task.blocker = null;
        record.state.status = 'In progress';
        invalidateCurrentGate(record);
      });
      write(stdout, `Unblocked ${id}`);
      return 0;
    }
    if (action === 'complete') {
      const commit = optionString(options, 'commit', { required: true }).toLowerCase();
      if (!ID_PATTERNS.commit.test(commit)) throw new Error('--commit must be a full 40-character Git SHA.');
      const prepared = prepareRecordMutation(path);
      requireCleanCurrent(path, prepared.record, 'task completion');
      const record = prepared.candidate;
      if (record.state.stage !== 10) throw new Error('Task completion is allowed only during Stage 10.');
      const task = taskById(record, id);
      if (task.status !== 'In progress' || record.state.currentTask !== id) {
        throw new Error(`${id} must be the current In progress task before completion.`);
      }
      for (const pair of values(options.check)) {
        const separator = String(pair).indexOf('=');
        if (separator <= 0 || separator === String(pair).length - 1) {
          throw new Error(`Invalid --check value: ${pair}. Use name=evidence.`);
        }
        const name = String(pair).slice(0, separator).trim();
        const evidence = String(pair).slice(separator + 1).trim();
        const check = task.validation.find((item) => item.name.toLowerCase() === name.toLowerCase());
        if (!check) {
          throw new Error(`--check cannot create undeclared validation "${name}". Use "task validation set" first.`);
        }
        check.status = 'Passed';
        check.actual = evidence;
        check.executedAt = now();
        check.evidence = [...new Set([...check.evidence, evidence])];
        delete check.reason;
      }
      if (task.validation.length === 0) throw new Error('Task completion requires declared validation checks.');
      const unresolved = task.validation.filter((check) => (
        check.required ? check.status !== 'Passed' : !['Passed', 'Not applicable'].includes(check.status)
      ));
      if (unresolved.length) {
        throw new Error(`Validation remains unresolved: ${unresolved.map((check) => check.name).join(', ')}`);
      }
      const repository = verifyCommitLineage(record, task, commit);
      const outputId = optionString(options, 'output') ?? nextId(record.snapshots, 'SRC-REPO-');
      if (record.snapshots.some((snapshot) => snapshot.id === outputId)) {
        throw new Error(`Snapshot ${outputId} already exists.`);
      }
      record.snapshots.push({
        id: outputId,
        role: 'Implementation output',
        pinStrength: 'Immutable',
        status: 'Active',
        reference: repository,
        commit,
        parent: task.baseline,
        task: id,
      });
      task.output = outputId;
      task.status = 'Complete';
      task.blocker = null;
      record.state.currentTask = null;
      record.state.latestOutput = outputId;
      record.state.status = 'Ready';
      invalidateCurrentGate(record);
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Completed ${id}; output ${outputId} at HEAD ${commit}`);
      return 0;
    }
    throw new Error('Usage: design-workflow task <create|ready|start|block|unblock|complete|validation set> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandReview(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'set-result' || !positionals[2]) throw new Error('Usage: design-workflow review set-result <result> --artifact <id> --output <snapshot> --evidence <text> --approved-by <actor>');
    const result = normalizeChoice(positionals[2], ['accepted', 'accepted-with-deviations', 'requires-corrections']);
    if (!result) throw new Error('Result must be accepted, accepted-with-deviations, or requires-corrections.');
    const artifactIdValue = optionString(options, 'artifact', { required: true });
    const output = optionString(options, 'output', { required: true });
    const evidence = optionString(options, 'evidence', { required: true });
    const approvedBy = optionString(options, 'approved-by', { required: true });
    const runtime = optionString(options, 'runtime');
    const path = recordPathFor(cwd, options);
    const prepared = prepareRecordMutation(path);
    requireCleanCurrent(path, prepared.record, 'final acceptance');
    const record = prepared.candidate;
    if (record.state.stage !== 11) throw new Error('Final review result can only be recorded at Stage 11.');
    const finalGate = [...record.gates].reverse().find((item) => item.stage === 11 && item.status === 'Active');
    if (result !== 'requires-corrections' && (!finalGate || !['Passed', 'Passed with assumptions'].includes(finalGate.result))) {
      throw new Error('Final acceptance requires an active passing Stage 11 gate.');
    }
    const expectedArtifactType = record.project.profile === 'Express' ? 'WORKPACK' : 'IMPLEMENTATION-REVIEW';
    const artifact = record.artifacts.find((item) => item.id === artifactIdValue);
    if (!artifact || artifact.type !== expectedArtifactType || artifact.status !== 'Approved') {
      throw new Error(`Final review for ${record.project.profile} must reference an Approved ${expectedArtifactType} artifact.`);
    }
    if (record.state.latestOutput !== output) throw new Error('Final review output must equal the Stage 10 latest implementation output.');
    const snapshot = record.snapshots.find((item) => item.id === output && item.role === 'Implementation output');
    if (!snapshot) throw new Error('Output must reference an Implementation output snapshot.');
    if (runtime && !record.snapshots.some((item) => item.id === runtime && item.role === 'Validation runtime')) {
      throw new Error('Runtime must reference a Validation runtime snapshot.');
    }
    for (const review of record.implementationReviews) if (review.status === 'Active') review.status = 'Superseded';
    const reviewId = nextId(record.implementationReviews, 'REVIEW-');
    record.implementationReviews.push({
      id: reviewId, status: 'Active', result, artifact: artifactIdValue, output,
      ...(runtime ? { runtime } : {}), evidence, recordedAt: now(), approvedBy,
      deviations: result === 'accepted-with-deviations' ? [evidence] : [],
    });
    record.state.latestOutput = output;
    if (runtime) record.state.latestValidationRuntime = runtime;
    record.state.status = result === 'requires-corrections' ? 'Blocked' : 'Complete';
    if (result === 'requires-corrections') invalidateCurrentGate(record, 'Blocked');
    commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
    write(stdout, `Recorded ${reviewId}: ${result}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandSync(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const result = syncGeneratedState(path, record, { check: Boolean(options.check) });
    if (options.check && !result.current) {
      write(stderr, 'Generated workflow views are missing or stale:');
      result.stale.forEach((item) => write(stderr, `- ${relativeDisplay(cwd, item)}`));
      return 1;
    }
    if (options.check) write(stdout, 'Generated workflow views are current.');
    else write(stdout, result.updated.length ? `Updated ${result.updated.length} generated workflow view(s).` : 'Generated workflow views were already current.');
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandValidate(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const findings = [...validateWorkflowRecord(record), ...generatedStateFindings(path, record)];
    printFindings(stdout, findings);
    return findings.length === 0 ? 0 : 1;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export async function runWorkflowCli(args, environment) {
  const { cwd, stdout, stderr } = environment;
  const { positionals, options } = parseArgs(args);
  const command = positionals[0];
  if (!command || command === 'help' || options.help) { commandHelp(stdout); return 0; }
  if (command === 'init') return commandInit(cwd, stdout, stderr, options);
  if (command === 'migrate') return commandMigrate(cwd, stdout, stderr, options);
  if (command === 'status') return commandStatus(cwd, stdout, stderr, options);
  if (command === 'next') return commandNext(cwd, stdout, stderr, options);
  if (command === 'stage') return commandStage(cwd, stdout, stderr, positionals, options);
  if (command === 'architecture') return commandArchitecture(cwd, stdout, stderr, positionals, options);
  if (command === 'profile') return commandProfile(cwd, stdout, stderr, positionals, options);
  if (command === 'mode') return commandMode(cwd, stdout, stderr, positionals, options);
  if (command === 'snapshot') return commandSnapshot(cwd, stdout, stderr, positionals, options);
  if (command === 'artifact') return commandArtifact(cwd, stdout, stderr, positionals, options);
  if (command === 'trace') return commandTrace(cwd, stdout, stderr, positionals, options);
  if (command === 'task') return commandTask(cwd, stdout, stderr, positionals, options);
  if (command === 'review') return commandReview(cwd, stdout, stderr, positionals, options);
  if (command === 'sync') return commandSync(cwd, stdout, stderr, options);
  if (command === 'validate') return commandValidate(cwd, stdout, stderr, options);
  return fail(stderr, `Unknown command: ${command}. Run "design-workflow help".`);
}
