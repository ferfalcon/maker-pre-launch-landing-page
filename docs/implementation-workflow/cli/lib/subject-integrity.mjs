import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { resolveRepositoryWorkspace } from './repository-binding.mjs';
import { runtimeToolkitPin, toolkitBindingFromRecord } from './toolkit-binding.mjs';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const EXECUTED_VALIDATION_STATUSES = new Set(['Passed', 'Failed']);

function projectRootForRecord(recordPath) {
  return resolve(dirname(recordPath), '..');
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function artifactAbsolutePath(recordPath, artifact) {
  const projectRoot = projectRootForRecord(recordPath);
  return isAbsolute(artifact.path) ? artifact.path : resolve(projectRoot, artifact.path);
}

function stagedContent(fileChanges, absolutePath) {
  const change = fileChanges?.get(resolve(absolutePath));
  return change?.content ?? null;
}

function artifactDigest(recordPath, artifact, fileChanges = null) {
  const absolutePath = artifactAbsolutePath(recordPath, artifact);
  const staged = stagedContent(fileChanges, absolutePath);
  if (staged !== null) return sha256(staged);
  if (!existsSync(absolutePath)) return null;
  return sha256(readFileSync(absolutePath));
}

function repositoryHead(recordPath, record, task) {
  const baseline = record.snapshots.find((snapshot) => snapshot.id === task.baseline);
  if (!baseline) return null;
  let repository;
  try {
    repository = resolveRepositoryWorkspace(projectRootForRecord(recordPath), baseline);
  } catch {
    return null;
  }
  try {
    return execFileSync('git', ['-C', repository, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().toLowerCase();
  } catch {
    return null;
  }
}

function currentOutputCommit(record, task) {
  if (!task.output) return null;
  return record.snapshots.find((snapshot) => snapshot.id === task.output)?.commit ?? null;
}

function sameCheck(before, after) {
  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
}

function validationSubject(recordPath, record, task) {
  const commit = currentOutputCommit(record, task) ?? repositoryHead(recordPath, record, task);
  if (!commit) return null;
  return {
    commit,
    ...(record.state.latestValidationRuntime ? { runtime: record.state.latestValidationRuntime } : {}),
  };
}

function approvedRevision(recordPath, artifact, fileChanges) {
  const digest = artifactDigest(recordPath, artifact, fileChanges);
  if (!digest) return null;
  return { algorithm: 'sha256', digest };
}

function artifactRevisionEntry(artifact) {
  if (!artifact?.approvedRevision) return null;
  return { artifact: artifact.id, revision: { ...artifact.approvedRevision } };
}

export function enrichIntegrityCandidate(recordPath, currentRecord, candidate, fileChanges = null) {
  const previousArtifacts = new Map((currentRecord?.artifacts ?? []).map((artifact) => [artifact.id, artifact]));
  for (const artifact of candidate.artifacts ?? []) {
    const before = previousArtifacts.get(artifact.id);
    if (artifact.status === 'Approved' && before?.status !== 'Approved') {
      const revision = approvedRevision(recordPath, artifact, fileChanges);
      if (revision) artifact.approvedRevision = revision;
    }
  }

  const previousGateIds = new Set((currentRecord?.gates ?? []).map((gate) => gate.id));
  for (const gate of candidate.gates ?? []) {
    if (previousGateIds.has(gate.id)) continue;
    gate.artifactRevisions = gate.artifacts
      .map((id) => artifactRevisionEntry(candidate.artifacts.find((artifact) => artifact.id === id)))
      .filter(Boolean);
  }

  const previousTasks = new Map((currentRecord?.tasks ?? []).map((task) => [task.id, task]));
  for (const task of candidate.tasks ?? []) {
    const previousTask = previousTasks.get(task.id);
    const previousChecks = new Map((previousTask?.validation ?? []).map((check) => [check.name.toLowerCase(), check]));
    for (const check of task.validation ?? []) {
      const before = previousChecks.get(check.name.toLowerCase());
      if (!EXECUTED_VALIDATION_STATUSES.has(check.status)) {
        delete check.subject;
        continue;
      }
      if (!sameCheck(before, check)) {
        const subject = validationSubject(recordPath, candidate, task);
        if (subject) check.subject = subject;
        if (!check.executedAt) check.executedAt = new Date().toISOString();
      }
    }
  }

  const previousReviewIds = new Set((currentRecord?.implementationReviews ?? []).map((review) => review.id));
  for (const review of candidate.implementationReviews ?? []) {
    if (previousReviewIds.has(review.id)) continue;
    const artifact = candidate.artifacts.find((item) => item.id === review.artifact);
    if (artifact?.approvedRevision) review.artifactRevision = { ...artifact.approvedRevision };
  }
}

function sameToolkitBinding(left, right) {
  return left?.repository === right?.repository && left?.revision === right?.revision;
}

function toolkitFindings(record, { verifyRuntimeToolkit = true } = {}) {
  if (record.schemaVersion !== 2) return [];
  const toolkit = toolkitBindingFromRecord(record);
  if (toolkit.invalid) return ['$.toolkit: toolkit dependency must use owner/name plus an exact 40-character Git SHA'];
  if (toolkit.ambiguous) return ['$.toolkit: multiple legacy toolkit pins are active; migrate or reconcile them before execution'];
  if (!toolkit.pinned) return ['$.toolkit: toolkit dependency is not pinned to an immutable repository revision'];
  if (!verifyRuntimeToolkit) return [];

  let runtime;
  try {
    runtime = runtimeToolkitPin();
  } catch (error) {
    return [`$.toolkit: executing toolkit identity is invalid: ${error instanceof Error ? error.message : String(error)}`];
  }
  if (!runtime) {
    return ['$.toolkit: executing toolkit identity cannot be resolved; use a source checkout rooted at its own Git worktree, an installed package with embedded provenance, or explicit toolkit provenance environment variables'];
  }
  if (!sameToolkitBinding(toolkit, runtime)) {
    return [
      `$.toolkit: recorded dependency ${toolkit.repository}#${toolkit.revision} does not match executing toolkit ${runtime.repository}#${runtime.revision}`,
    ];
  }
  return [];
}

function artifactFindings(recordPath, record, fileChanges) {
  const findings = [];
  for (const artifact of record.artifacts ?? []) {
    if (artifact.status === 'Superseded') continue;
    const digest = artifactDigest(recordPath, artifact, fileChanges);
    if (!digest) {
      findings.push(`$.artifacts: active artifact ${artifact.id} is missing its narrative file ${artifact.path}`);
      continue;
    }
    if (artifact.status !== 'Approved') continue;
    if (artifact.approvedRevision?.algorithm !== 'sha256' || !SHA256_PATTERN.test(artifact.approvedRevision?.digest ?? '')) {
      findings.push(`$.artifacts: approved artifact ${artifact.id} is missing an immutable sha256 approvedRevision`);
      continue;
    }
    if (artifact.approvedRevision.digest !== digest) {
      findings.push(`$.artifacts: approved artifact ${artifact.id} content no longer matches approvedRevision ${artifact.approvedRevision.digest}`);
    }
  }
  return findings;
}

function gateFindings(record) {
  const findings = [];
  const artifacts = new Map((record.artifacts ?? []).map((artifact) => [artifact.id, artifact]));
  for (const gate of record.gates ?? []) {
    if (gate.status !== 'Active' || !['Passed', 'Passed with assumptions'].includes(gate.result)) continue;
    const revisions = new Map((gate.artifactRevisions ?? []).map((entry) => [entry.artifact, entry.revision]));

    for (const entry of gate.artifactRevisions ?? []) {
      if (!(gate.artifacts ?? []).includes(entry.artifact)) {
        findings.push(`$.gates: active passing gate ${gate.id} pins revision for unreferenced artifact ${entry.artifact}`);
      }
    }

    // Historical gates preserve the subjects that existed at their decision point.
    // Only the current stage gate must match artifacts that are authoritative now;
    // later Draft -> Approved transitions must not retroactively invalidate older gates.
    if (gate.stage !== record.state.stage) continue;
    for (const artifactId of gate.artifacts ?? []) {
      const artifact = artifacts.get(artifactId);
      if (artifact?.status !== 'Approved') continue;
      const recorded = revisions.get(artifactId);
      if (!recorded || recorded.algorithm !== artifact.approvedRevision?.algorithm || recorded.digest !== artifact.approvedRevision?.digest) {
        findings.push(`$.gates: current passing gate ${gate.id} does not pin the approved revision of ${artifactId}`);
      }
    }
  }
  return findings;
}

function validationFindings(record) {
  const findings = [];
  const snapshots = new Map((record.snapshots ?? []).map((snapshot) => [snapshot.id, snapshot]));
  for (const task of record.tasks ?? []) {
    const outputCommit = task.output ? snapshots.get(task.output)?.commit ?? null : null;
    for (const check of task.validation ?? []) {
      if (!EXECUTED_VALIDATION_STATUSES.has(check.status)) continue;
      if (record.state.stage === 9) {
        findings.push(`$.tasks: validation ${task.id}/${check.name} may be defined at Stage 9 but cannot be executed until Stage 10`);
      }
      if (!check.subject?.commit || !/^[0-9a-f]{40}$/.test(check.subject.commit)) {
        findings.push(`$.tasks: executed validation ${task.id}/${check.name} is not bound to an exact implementation commit`);
        continue;
      }
      if (check.subject.runtime) {
        const runtime = snapshots.get(check.subject.runtime);
        if (!runtime || runtime.role !== 'Validation runtime') {
          findings.push(`$.tasks: validation ${task.id}/${check.name} references invalid runtime ${check.subject.runtime}`);
        }
      }
      if (task.status === 'Complete' && outputCommit && check.status === 'Passed' && check.subject.commit !== outputCommit) {
        findings.push(`$.tasks: passed validation ${task.id}/${check.name} targets ${check.subject.commit}, not completed output ${outputCommit}`);
      }
    }
  }
  return findings;
}

function reviewFindings(record) {
  const findings = [];
  const artifacts = new Map((record.artifacts ?? []).map((artifact) => [artifact.id, artifact]));
  for (const review of record.implementationReviews ?? []) {
    if (review.status !== 'Active' || review.result === 'requires-corrections') continue;
    const artifact = artifacts.get(review.artifact);
    if (!artifact?.approvedRevision) {
      findings.push(`$.implementationReviews: active accepted review ${review.id} references an artifact without approved revision identity`);
      continue;
    }
    if (!review.artifactRevision || review.artifactRevision.algorithm !== artifact.approvedRevision.algorithm || review.artifactRevision.digest !== artifact.approvedRevision.digest) {
      findings.push(`$.implementationReviews: active accepted review ${review.id} is not bound to the approved revision of ${review.artifact}`);
    }
  }
  return findings;
}

export function subjectIntegrityFindings(recordPath, record, options = {}) {
  if (record.schemaVersion !== 2) return [];
  const fileChanges = options.fileChanges ?? null;
  return [
    ...(options.requireToolkit === false ? [] : toolkitFindings(record, options)),
    ...artifactFindings(recordPath, record, fileChanges),
    ...gateFindings(record),
    ...validationFindings(record),
    ...reviewFindings(record),
  ];
}
