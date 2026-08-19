import {
  ARTIFACT_STATUSES, ARTIFACT_TYPES, ID_PATTERNS, MODES, PIN_STRENGTHS,
  PROFILES, SNAPSHOT_ROLES, SNAPSHOT_STATUSES, TASK_STATUSES,
  VALIDATION_KINDS, VALIDATION_STATUSES,
} from './workflow-model.mjs';
import {
  checkIdArray, checkShape, checkUnique, expectArray, expectEnum,
  expectPattern, expectString, expectTimestamp, isObject, push, registerId,
} from './workflow-record-validation-primitives.mjs';

export function validateProject(errors, project) {
  if (!checkShape(errors, '$.project', project, ['name', 'profile', 'executionMode'])) return;
  expectString(errors, '$.project.name', project.name);
  expectEnum(errors, '$.project.profile', project.profile, PROFILES);
  expectEnum(errors, '$.project.executionMode', project.executionMode, MODES);
}

export function validateToolkit(errors, toolkit) {
  if (!checkShape(errors, '$.toolkit', toolkit, ['repository', 'revision'])) return;
  expectString(errors, '$.toolkit.repository', toolkit.repository);
  expectString(errors, '$.toolkit.revision', toolkit.revision);
}

export function validateSnapshot(errors, snapshot, path, registry, snapshotsById, version = 2) {
  const required = ['id', 'role', 'pinStrength', 'status', 'reference'];
  const allowed = [...required, 'commit', 'parent', 'task', 'supersededBy'];
  if (!checkShape(errors, path, snapshot, required, allowed)) return;
  if (expectPattern(errors, `${path}.id`, snapshot.id, ID_PATTERNS.snapshot)) {
    registerId(errors, registry, snapshot.id, `${path}.id`);
    snapshotsById.set(snapshot.id, snapshot);
  }
  expectEnum(errors, `${path}.role`, snapshot.role, SNAPSHOT_ROLES);
  expectEnum(errors, `${path}.pinStrength`, snapshot.pinStrength, PIN_STRENGTHS);
  expectEnum(errors, `${path}.status`, snapshot.status, SNAPSHOT_STATUSES);
  expectString(errors, `${path}.reference`, snapshot.reference);
  expectPattern(errors, `${path}.commit`, snapshot.commit, ID_PATTERNS.commit, { optional: true });
  expectPattern(errors, `${path}.parent`, snapshot.parent, ID_PATTERNS.repositorySnapshot, { optional: true });
  expectPattern(errors, `${path}.task`, snapshot.task, ID_PATTERNS.task, { optional: true });
  expectPattern(errors, `${path}.supersededBy`, snapshot.supersededBy, ID_PATTERNS.snapshot, { optional: true });
  if (snapshot.role === 'Implementation output') {
    if (!snapshot.id?.startsWith('SRC-REPO-')) push(errors, `${path}.id`, 'Implementation output must be a repository snapshot');
    if (!snapshot.commit) push(errors, `${path}.commit`, 'Implementation output requires a commit SHA');
    if (!snapshot.parent) push(errors, `${path}.parent`, 'Implementation output requires a parent repository snapshot');
    if (!snapshot.task) push(errors, `${path}.task`, 'Implementation output requires a producing task');
  }
  if (snapshot.role === 'Task start') {
    if (!snapshot.id?.startsWith('SRC-REPO-')) push(errors, `${path}.id`, 'Task start must be a repository snapshot');
    if (version === 2) {
      if (snapshot.pinStrength !== 'Immutable') push(errors, `${path}.pinStrength`, 'Task start requires Immutable pin strength');
      if (!snapshot.commit) push(errors, `${path}.commit`, 'Task start requires a commit SHA');
      if (!snapshot.parent) push(errors, `${path}.parent`, 'Task start requires a parent repository snapshot');
      if (!snapshot.task) push(errors, `${path}.task`, 'Task start requires a task');
    }
  }
  if (snapshot.pinStrength === 'Immutable' && snapshot.id?.startsWith('SRC-REPO-') && !snapshot.commit) {
    push(errors, `${path}.commit`, 'Immutable repository snapshot requires a commit SHA');
  }
  if (snapshot.status === 'Superseded' && !snapshot.supersededBy) {
    push(errors, `${path}.supersededBy`, 'Superseded snapshot requires a replacement');
  }
  if (snapshot.supersededBy === snapshot.id) {
    push(errors, `${path}.supersededBy`, 'Snapshot cannot supersede itself');
  }
}

export function validateArtifact(errors, artifact, path, registry, artifactsById, version) {
  const required = version === 2
    ? ['id', 'type', 'path', 'status', 'baseline']
    : ['id', 'type', 'status', 'baseline'];
  const allowed = version === 2
    ? [...required, 'statusChangedAt', 'statusEvidence', 'statusBy', 'approvedRevision', 'supersededBy']
    : [...required, 'references'];
  if (!checkShape(errors, path, artifact, required, allowed)) return;
  if (expectPattern(errors, `${path}.id`, artifact.id, ID_PATTERNS.artifact)) {
    registerId(errors, registry, artifact.id, `${path}.id`);
    artifactsById.set(artifact.id, artifact);
  }
  expectEnum(errors, `${path}.type`, artifact.type, ARTIFACT_TYPES);
  if (version === 2) expectString(errors, `${path}.path`, artifact.path);
  expectEnum(errors, `${path}.status`, artifact.status, ARTIFACT_STATUSES);
  checkIdArray(errors, `${path}.baseline`, artifact.baseline, ID_PATTERNS.snapshot);
  if (version === 1 && artifact.references !== undefined) {
    checkIdArray(errors, `${path}.references`, artifact.references, ID_PATTERNS.domain);
  }
  expectTimestamp(errors, `${path}.statusChangedAt`, artifact.statusChangedAt, { optional: true });
  expectString(errors, `${path}.statusEvidence`, artifact.statusEvidence, { optional: true });
  expectString(errors, `${path}.statusBy`, artifact.statusBy, { optional: true });
  expectPattern(errors, `${path}.supersededBy`, artifact.supersededBy, ID_PATTERNS.artifact, { optional: true });
  if (artifact.status === 'Superseded' && !artifact.supersededBy) {
    push(errors, `${path}.supersededBy`, 'Superseded artifact requires a replacement');
  }
  if (artifact.supersededBy === artifact.id) {
    push(errors, `${path}.supersededBy`, 'Artifact cannot supersede itself');
  }
}

function validateLegacyCheck(errors, check, path) {
  if (!checkShape(errors, path, check, ['name', 'status'], ['name', 'status', 'evidence', 'reason'])) return;
  expectString(errors, `${path}.name`, check.name);
  expectEnum(errors, `${path}.status`, check.status, VALIDATION_STATUSES);
  if (check.status === 'Passed' && (typeof check.evidence !== 'string' || check.evidence.trim() === '')) {
    push(errors, `${path}.evidence`, 'Passed validation requires evidence');
  }
  if (['Failed', 'Blocked', 'Not executed', 'Not applicable'].includes(check.status)) {
    if (typeof check.reason !== 'string' || check.reason.trim() === '') {
      push(errors, `${path}.reason`, `${check.status} validation requires a reason`);
    }
  }
}

function validateStructuredCheck(errors, check, path) {
  const required = ['name', 'kind', 'required', 'status', 'expected', 'evidence', 'references'];
  const allowed = [...required, 'actual', 'command', 'environment', 'executedAt', 'subject', 'reason'];
  if (!checkShape(errors, path, check, required, allowed)) return;
  expectString(errors, `${path}.name`, check.name);
  expectEnum(errors, `${path}.kind`, check.kind, VALIDATION_KINDS);
  if (typeof check.required !== 'boolean') push(errors, `${path}.required`, 'must be a boolean');
  expectEnum(errors, `${path}.status`, check.status, VALIDATION_STATUSES);
  expectString(errors, `${path}.expected`, check.expected);
  checkIdArray(errors, `${path}.references`, check.references, ID_PATTERNS.domain);
  if (!expectArray(errors, `${path}.evidence`, check.evidence)) return;
  checkUnique(errors, `${path}.evidence`, check.evidence);
  check.evidence.forEach((item, index) => expectString(errors, `${path}.evidence[${index}]`, item));
  expectString(errors, `${path}.actual`, check.actual, { optional: true });
  expectString(errors, `${path}.command`, check.command, { optional: true });
  expectString(errors, `${path}.environment`, check.environment, { optional: true });
  expectTimestamp(errors, `${path}.executedAt`, check.executedAt, { optional: true });
  expectString(errors, `${path}.reason`, check.reason, { optional: true });
  if (check.status === 'Passed') {
    if (!check.actual) push(errors, `${path}.actual`, 'Passed validation requires the actual result');
    if (!check.executedAt) push(errors, `${path}.executedAt`, 'Passed validation requires an execution timestamp');
    if (check.evidence.length === 0) push(errors, `${path}.evidence`, 'Passed validation requires evidence');
  } else if (!check.reason) {
    push(errors, `${path}.reason`, `${check.status} validation requires a reason`);
  }
  if (check.required && check.status === 'Not applicable') {
    push(errors, `${path}.status`, 'Required validation cannot be Not applicable');
  }
}

export function validateTask(errors, task, path, registry, tasksById, version) {
  const required = version === 2
    ? ['id', 'status', 'baseline', 'prerequisites', 'references', 'output', 'blocker', 'validation']
    : ['id', 'status', 'baseline', 'prerequisites', 'references', 'output', 'validation'];
  if (!checkShape(errors, path, task, required)) return;
  if (expectPattern(errors, `${path}.id`, task.id, ID_PATTERNS.task)) {
    registerId(errors, registry, task.id, `${path}.id`);
    tasksById.set(task.id, task);
  }
  expectEnum(errors, `${path}.status`, task.status, TASK_STATUSES);
  expectPattern(errors, `${path}.baseline`, task.baseline, ID_PATTERNS.repositorySnapshot);
  checkIdArray(errors, `${path}.prerequisites`, task.prerequisites, ID_PATTERNS.task);
  checkIdArray(errors, `${path}.references`, task.references, ID_PATTERNS.domain);
  if (task.output !== null) expectPattern(errors, `${path}.output`, task.output, ID_PATTERNS.repositorySnapshot);
  if (version === 2 && task.blocker !== null) {
    if (checkShape(errors, `${path}.blocker`, task.blocker, ['reason', 'previousStatus', 'recordedAt'])) {
      expectString(errors, `${path}.blocker.reason`, task.blocker.reason);
      expectEnum(errors, `${path}.blocker.previousStatus`, task.blocker.previousStatus, ['Not started', 'Ready', 'In progress']);
      expectTimestamp(errors, `${path}.blocker.recordedAt`, task.blocker.recordedAt);
    }
  }
  if (version === 2 && task.status === 'Blocked' && task.blocker === null) {
    push(errors, `${path}.blocker`, 'Blocked task requires blocker state');
  }
  if (version === 2 && task.status !== 'Blocked' && task.blocker !== null) {
    push(errors, `${path}.blocker`, 'Only a Blocked task may retain blocker state');
  }
  if (expectArray(errors, `${path}.validation`, task.validation)) {
    const names = [];
    task.validation.forEach((check, index) => {
      (version === 2 ? validateStructuredCheck : validateLegacyCheck)(errors, check, `${path}.validation[${index}]`);
      if (isObject(check) && typeof check.name === 'string') names.push(check.name.toLowerCase());
    });
    const seenNames = new Map();
    names.forEach((name, index) => {
      if (seenNames.has(name)) push(errors, `${path}.validation[${index}].name`, `duplicate validation name; first declared at ${path}.validation[${seenNames.get(name)}].name`);
      else seenNames.set(name, index);
    });
  }
}
