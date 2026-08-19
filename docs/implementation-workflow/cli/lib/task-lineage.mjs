import { execFileSync } from 'node:child_process';
import { taskStartCheckpointFindings, taskStartGitFindings } from './git-worktree-policy.mjs';
import { commitRecordCandidate, prepareRecordMutation } from './record-store.mjs';
import { resolveRepositoryWorkspace } from './repository-binding.mjs';
import { nextId } from './utils.mjs';
import { taskStartFindings } from './workflow-actions.mjs';
import { workflowDiagnostics } from './workflow-diagnostics.mjs';
import { projectRootForRecord } from './workspace.mjs';

function git(repository, args) {
  try {
    return execFileSync('git', ['-C', repository, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function repositorySnapshot(record, id) {
  return record.snapshots.find((snapshot) => (
    snapshot.id === id && snapshot.id.startsWith('SRC-REPO-')
  ));
}

function invalidateCurrentGate(record) {
  let invalidated = false;
  for (const gate of record.gates) {
    if (gate.stage === record.state.stage && gate.status === 'Active') {
      gate.status = 'Superseded';
      invalidated = true;
    }
  }
  if (invalidated) record.state.status = 'In progress';
}

function latestOutputAnchor(record, projectRoot, repository, head) {
  const latest = record.state.latestOutput
    ? repositorySnapshot(record, record.state.latestOutput)
    : null;
  if (!latest || latest.role !== 'Implementation output' || latest.status === 'Superseded' || !latest.commit) return null;

  let latestRepository;
  try {
    latestRepository = resolveRepositoryWorkspace(projectRoot, latest);
  } catch {
    return null;
  }
  if (latestRepository !== repository) return null;
  if (git(repository, ['cat-file', '-e', `${latest.commit}^{commit}`]) === null) return null;
  if (latest.commit !== head && git(repository, ['merge-base', '--is-ancestor', latest.commit, head]) === null) return null;
  return latest;
}

function replacementParent(record, plannedBaseline, anchor, task) {
  if (
    plannedBaseline.role === 'Task start'
    && plannedBaseline.task === task.id
    && plannedBaseline.status === 'Active'
    && anchor.id === plannedBaseline.id
    && plannedBaseline.parent
  ) {
    return repositorySnapshot(record, plannedBaseline.parent) ?? anchor;
  }
  return anchor;
}

export function resolveTaskStartBaseline(recordPath, record, task) {
  const plannedBaseline = repositorySnapshot(record, task.baseline);
  if (!plannedBaseline?.commit) {
    throw new Error(`Task baseline ${task.baseline} does not record a Git commit.`);
  }

  const projectRoot = projectRootForRecord(recordPath);
  let repository;
  try {
    repository = resolveRepositoryWorkspace(projectRoot, plannedBaseline);
  } catch {
    throw new Error(`Task baseline ${task.baseline} does not reference an accessible Git repository.`);
  }

  const head = git(repository, ['rev-parse', 'HEAD']);
  if (!head) throw new Error(`Could not resolve HEAD for task ${task.id}.`);

  const latestOutput = latestOutputAnchor(record, projectRoot, repository, head);
  const anchor = latestOutput ?? plannedBaseline;
  if (anchor.commit !== head && git(repository, ['merge-base', '--is-ancestor', anchor.commit, head]) === null) {
    throw new Error(
      `Repository HEAD ${head} does not descend from ${anchor.id} (${anchor.commit}). `
      + `Record and assess the unexpected repository change before starting ${task.id}.`,
    );
  }

  if (head === anchor.commit) {
    const previousBaseline = task.baseline;
    task.baseline = anchor.id;
    return {
      repository,
      commit: head,
      baseline: anchor.id,
      previousBaseline,
      source: anchor.role === 'Implementation output' ? 'latest-output' : 'planned-baseline',
      createdSnapshot: false,
    };
  }

  const checkpointFindings = taskStartCheckpointFindings(
    recordPath, record, repository, anchor.commit, head,
  );
  if (checkpointFindings.length > 0) throw new Error(checkpointFindings.join('\n'));

  const startId = nextId(record.snapshots, 'SRC-REPO-');
  const parent = replacementParent(record, plannedBaseline, anchor, task);
  record.snapshots.push({
    id: startId,
    role: 'Task start',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: repository,
    commit: head,
    parent: parent.id,
    task: task.id,
  });
  if (
    plannedBaseline.role === 'Task start'
    && plannedBaseline.task === task.id
    && plannedBaseline.status === 'Active'
  ) {
    plannedBaseline.role = 'Historical reference';
    plannedBaseline.status = 'Superseded';
    plannedBaseline.supersededBy = startId;
  }
  const previousBaseline = task.baseline;
  task.baseline = startId;
  return {
    repository,
    commit: head,
    baseline: startId,
    previousBaseline,
    source: 'task-start-checkpoint',
    createdSnapshot: true,
  };
}

export function startTaskAtCurrentHead(recordPath, taskId) {
  const prepared = prepareRecordMutation(recordPath);
  const diagnostics = workflowDiagnostics(recordPath, prepared.record);
  const currentTask = prepared.record.tasks.find((task) => task.id === taskId);
  const findings = [
    ...diagnostics.findings,
    ...taskStartFindings(prepared.record, currentTask),
    ...(currentTask ? taskStartGitFindings(recordPath, prepared.record, currentTask) : []),
  ];
  if (findings.length > 0) throw new Error(findings.join('\n'));

  const record = prepared.candidate;
  const task = record.tasks.find((candidate) => candidate.id === taskId);
  const start = resolveTaskStartBaseline(recordPath, record, task);

  task.status = 'In progress';
  record.state.currentTask = taskId;
  record.state.status = 'In progress';
  invalidateCurrentGate(record);

  commitRecordCandidate({
    recordPath,
    currentRecord: prepared.record,
    candidate: record,
  });

  return start;
}
