import {
  allowedTraceOwnerTypes, ARTIFACT_STATUSES, ARTIFACT_TYPES,
  artifactTypesThroughStage, FINAL_RESULTS, GATE_RESULTS, ID_PATTERNS,
  MODES, PIN_STRENGTHS, PROFILES, PROFILE_RANK, SCHEMA_VERSION,
  SNAPSHOT_ROLES, SNAPSHOT_STATUSES, TASK_STATUSES, VALIDATION_KINDS,
  VALIDATION_STATUSES, VERIFICATION_RESULTS, WORKFLOW_STATUSES,
} from '../../cli/lib/workflow-model.mjs';

const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const EXECUTABLE_REPOSITORY_ROLES = ['Input baseline', 'Task start', 'Implementation output'];

function push(findings, path, message) {
  findings.push(`${path}: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function expectObject(errors, path, value) {
  if (isObject(value)) return true;
  push(errors, path, 'expected an object');
  return false;
}

function expectArray(errors, path, value) {
  if (Array.isArray(value)) return true;
  push(errors, path, 'expected an array');
  return false;
}

function expectString(errors, path, value, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && value.trim() !== '') return true;
  push(errors, path, 'must be a non-empty string');
  return false;
}

function expectEnum(errors, path, value, allowed, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (allowed.includes(value)) return true;
  push(errors, path, `expected one of: ${allowed.join(', ')}`);
  return false;
}

function expectPattern(errors, path, value, pattern, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && pattern.test(value)) return true;
  push(errors, path, `invalid identifier or value: ${String(value)}`);
  return false;
}

function expectTimestamp(errors, path, value, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && isoTimestamp.test(value) && !Number.isNaN(Date.parse(value))) return true;
  push(errors, path, 'must be an ISO-8601 UTC timestamp');
  return false;
}

function checkShape(errors, path, value, required, allowed = required) {
  if (!expectObject(errors, path, value)) return false;
  for (const key of required) {
    if (!Object.hasOwn(value, key)) push(errors, `${path}.${key}`, 'required property is missing');
  }
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) push(errors, `${path}.${key}`, 'unknown property');
  }
  return true;
}

function checkUnique(errors, path, values) {
  if (!Array.isArray(values)) return;
  const seen = new Map();
  values.forEach((value, index) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) push(errors, `${path}[${index}]`, `duplicate array value; first declared at ${path}[${seen.get(key)}]`);
    else seen.set(key, index);
  });
}

function checkIdArray(errors, path, value, pattern) {
  if (!expectArray(errors, path, value)) return [];
  checkUnique(errors, path, value);
  value.forEach((id, index) => expectPattern(errors, `${path}[${index}]`, id, pattern));
  return value;
}

function registerId(errors, registry, id, path) {
  if (registry.has(id)) push(errors, path, `duplicate ID; first declared at ${registry.get(id)}`);
  else registry.set(id, path);
}

function findCycles(nodes, neighbors) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(id) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    for (const neighbor of neighbors(id)) {
      if (nodes.has(neighbor)) visit(neighbor);
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of nodes) visit(id);
  return cycles;
}

function validateProject(errors, project) {
  if (!checkShape(errors, '$.project', project, ['name', 'profile', 'executionMode'])) return;
  expectString(errors, '$.project.name', project.name);
  expectEnum(errors, '$.project.profile', project.profile, PROFILES);
  expectEnum(errors, '$.project.executionMode', project.executionMode, MODES);
}

function validateToolkit(errors, toolkit) {
  if (!checkShape(errors, '$.toolkit', toolkit, ['repository', 'revision'])) return;
  expectString(errors, '$.toolkit.repository', toolkit.repository);
  expectString(errors, '$.toolkit.revision', toolkit.revision);
}

function validateSnapshot(errors, snapshot, path, registry, snapshotsById, version = 2) {
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

function validateArtifact(errors, artifact, path, registry, artifactsById, version) {
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

function validateTask(errors, task, path, registry, tasksById, version) {
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

function validateSharedReferences(errors, record, snapshotsById, artifactsById, tasksById, { version = 2 } = {}) {
  for (const id of record.state?.activeInputs ?? []) {
    const snapshot = snapshotsById.get(id);
    if (!snapshot) push(errors, '$.state.activeInputs', `references missing snapshot ${id}`);
    else if (snapshot.status !== 'Active' && snapshot.status !== 'Unverified') {
      push(errors, '$.state.activeInputs', `active input ${id} is ${snapshot.status}`);
    }
  }

  const currentTask = record.state?.currentTask ? tasksById.get(record.state.currentTask) : null;
  if (record.state?.currentTask && !currentTask) {
    push(errors, '$.state.currentTask', `references missing task ${record.state.currentTask}`);
  }
  if (version === 2) {
    const inProgressTasks = [...tasksById.values()].filter((task) => task.status === 'In progress');
    if (inProgressTasks.length > 1) {
      push(errors, '$.tasks', `multiple In progress tasks exist: ${inProgressTasks.map((task) => task.id).join(', ')}`);
    }
    if (currentTask && currentTask.status !== 'In progress') {
      push(errors, '$.state.currentTask', `current task ${currentTask.id} must be In progress`);
    }
    if (!record.state?.currentTask && inProgressTasks.length === 1) {
      push(errors, '$.state.currentTask', `In progress task ${inProgressTasks[0].id} requires state.currentTask`);
    }
  }

  if (record.state?.latestOutput) {
    const output = snapshotsById.get(record.state.latestOutput);
    if (!output) push(errors, '$.state.latestOutput', `references missing snapshot ${record.state.latestOutput}`);
    else if (output.role !== 'Implementation output') push(errors, '$.state.latestOutput', 'must reference an Implementation output snapshot');
    else if (version === 2) {
      if (output.status !== 'Active') push(errors, '$.state.latestOutput', 'must reference an Active Implementation output snapshot');
      const producingTask = output.task ? tasksById.get(output.task) : null;
      if (producingTask && producingTask.output !== output.id) {
        push(errors, '$.state.latestOutput', `snapshot ${output.id} is not the recorded output of ${producingTask.id}`);
      }
      if (producingTask && producingTask.status !== 'Complete') {
        push(errors, '$.state.latestOutput', `snapshot ${output.id} must be produced by a Complete task`);
      }
    }
  }
  if (record.state?.latestValidationRuntime) {
    const runtime = snapshotsById.get(record.state.latestValidationRuntime);
    if (!runtime) push(errors, '$.state.latestValidationRuntime', `references missing snapshot ${record.state.latestValidationRuntime}`);
    else if (runtime.role !== 'Validation runtime') push(errors, '$.state.latestValidationRuntime', 'must reference a Validation runtime snapshot');
    else if (version === 2) {
      if (runtime.status !== 'Active') push(errors, '$.state.latestValidationRuntime', 'must reference an Active Validation runtime snapshot');
      if (record.state.latestOutput && runtime.parent !== record.state.latestOutput) {
        push(errors, '$.state.latestValidationRuntime', `must parent latest output ${record.state.latestOutput}`);
      }
    }
  }

  record.artifacts?.forEach((artifact, index) => {
    for (const snapshotId of artifact.baseline ?? []) {
      if (!snapshotsById.has(snapshotId)) push(errors, `$.artifacts[${index}].baseline`, `references missing snapshot ${snapshotId}`);
    }
    if (artifact.supersededBy && !artifactsById.has(artifact.supersededBy)) {
      push(errors, `$.artifacts[${index}].supersededBy`, `references missing artifact ${artifact.supersededBy}`);
    }
  });

  record.tasks?.forEach((task, index) => {
    const baseline = snapshotsById.get(task.baseline);
    if (!baseline) push(errors, `$.tasks[${index}].baseline`, `references missing snapshot ${task.baseline}`);
    else if (version === 2) {
      if (!EXECUTABLE_REPOSITORY_ROLES.includes(baseline.role)) {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} role ${baseline.role} is not an executable repository baseline`);
      }
      if (baseline.pinStrength !== 'Immutable') {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} must use Immutable pin strength`);
      }
      if (!baseline.commit) {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} must record a commit SHA`);
      }
      if (task.status !== 'Complete' && baseline.status !== 'Active') {
        push(errors, `$.tasks[${index}].baseline`, `incomplete task ${task.id} requires an Active repository baseline`);
      }
    }
    for (const prerequisite of task.prerequisites ?? []) {
      if (!tasksById.has(prerequisite)) push(errors, `$.tasks[${index}].prerequisites`, `references missing task ${prerequisite}`);
      if (prerequisite === task.id) push(errors, `$.tasks[${index}].prerequisites`, 'task cannot depend on itself');
    }
    if (task.output) {
      const output = snapshotsById.get(task.output);
      if (!output) push(errors, `$.tasks[${index}].output`, `references missing snapshot ${task.output}`);
      else {
        if (output.role !== 'Implementation output') push(errors, `$.tasks[${index}].output`, 'must reference an Implementation output snapshot');
        if (output.task !== task.id) push(errors, `$.tasks[${index}].output`, `snapshot ${task.output} is not attributed to ${task.id}`);
        if (output.parent !== task.baseline) push(errors, `$.tasks[${index}].output`, `snapshot ${task.output} parent must equal task baseline ${task.baseline}`);
      }
    }
    if (task.status === 'Complete') {
      if ((task.validation ?? []).length === 0) push(errors, `$.tasks[${index}].validation`, 'Complete task requires at least one declared validation check');
      if (!task.output) push(errors, `$.tasks[${index}].output`, 'Complete task requires an output snapshot');
      const unresolved = (task.validation ?? []).filter((check) => (
        check.required === false
          ? !['Passed', 'Not applicable'].includes(check.status)
          : check.status !== 'Passed'
      ));
      if (unresolved.length > 0) push(errors, `$.tasks[${index}].validation`, 'Complete task cannot contain failed, blocked, or unexecuted required validation');
    }
  });

  record.snapshots?.forEach((snapshot, index) => {
    const parent = snapshot.parent ? snapshotsById.get(snapshot.parent) : null;
    const task = snapshot.task ? tasksById.get(snapshot.task) : null;
    if (snapshot.parent && !parent) push(errors, `$.snapshots[${index}].parent`, `references missing snapshot ${snapshot.parent}`);
    if (snapshot.task && !task) push(errors, `$.snapshots[${index}].task`, `references missing task ${snapshot.task}`);
    if (snapshot.supersededBy && !snapshotsById.has(snapshot.supersededBy)) push(errors, `$.snapshots[${index}].supersededBy`, `references missing snapshot ${snapshot.supersededBy}`);
    if (version === 2 && ['Task start', 'Implementation output'].includes(snapshot.role) && parent) {
      if (!parent.id?.startsWith('SRC-REPO-') || !EXECUTABLE_REPOSITORY_ROLES.includes(parent.role)) {
        push(errors, `$.snapshots[${index}].parent`, `snapshot ${snapshot.parent} is not an executable repository parent`);
      }
    }
    if (version === 2 && snapshot.role === 'Task start' && task && task.baseline !== snapshot.id) {
      push(errors, `$.snapshots[${index}].task`, `Task start snapshot ${snapshot.id} must equal task ${task.id} baseline`);
    }
    if (version === 2 && snapshot.role === 'Implementation output' && task && task.output !== snapshot.id) {
      push(errors, `$.snapshots[${index}].task`, `Implementation output ${snapshot.id} must equal task ${task.id} output`);
    }
  });

  for (const cycle of findCycles(new Set(tasksById.keys()), (id) => tasksById.get(id)?.prerequisites ?? [])) {
    push(errors, '$.tasks', `dependency cycle detected: ${cycle.join(' -> ')}`);
  }
}

function validateProfileRules(errors, record, artifactsById, { legacy = false } = {}) {
  const profile = record.project?.profile;
  const stage = record.state?.stage;
  const activeArtifacts = [...artifactsById.values()].filter((artifact) => artifact.status !== 'Superseded');
  const activeTypes = new Set(activeArtifacts.map((artifact) => artifact.type));
  const requiredTypes = legacy
    ? artifactTypesThroughStage(profile, 11, profile === 'Full' ? { result: 'Required' } : record.state?.architectureDecision)
    : artifactTypesThroughStage(profile, Number.isInteger(stage) ? stage : 0, record.state?.architectureDecision);
  for (const type of requiredTypes) {
    if (!activeTypes.has(type)) push(errors, '$.artifacts', `${profile} profile requires ${type}`);
  }
  if (profile === 'Express') {
    for (const artifact of activeArtifacts) {
      if (artifact.type !== 'WORKPACK') push(errors, '$.artifacts', `Express profile must consolidate ${artifact.type} responsibility in WORKPACK`);
    }
    if ((record.tasks?.length ?? 0) > 1) push(errors, '$.tasks', 'Express profile permits at most one implementation task');
    record.tasks?.forEach((task, index) => {
      if ((task.prerequisites ?? []).length > 0) push(errors, `$.tasks[${index}].prerequisites`, 'Express task cannot have task prerequisites');
    });
    const stageNineClosed = stage > 9 || record.gates?.some((gate) => gate.stage === 9 && gate.status === 'Active' && ['Passed', 'Passed with assumptions'].includes(gate.result));
    if (stageNineClosed && record.tasks?.length !== 1) push(errors, '$.tasks', 'Express profile requires exactly one task by the Stage 9 exit');
  }
  if (profile === 'Lite' && ['REQUIREMENTS', 'DESIGN', 'SPEC', 'PLAN'].some((type) => activeTypes.has(type))) {
    push(errors, '$.artifacts', 'Lite profile should consolidate requirements, design, specification, and planning in IMPLEMENTATION-BRIEF');
  }
  const activeTransition = record.profileTransitions?.some((transition) => transition.status === 'In progress');
  if (!activeTransition && profile === 'Lite' && activeTypes.has('WORKPACK')) {
    push(errors, '$.artifacts', 'Lite profile must supersede the Express WORKPACK after upgrade reconciliation');
  }
  if (!activeTransition && ['Standard', 'Full'].includes(profile)) {
    for (const type of ['WORKPACK', 'IMPLEMENTATION-BRIEF']) {
      if (activeTypes.has(type)) push(errors, '$.artifacts', `${profile} profile must supersede consolidated ${type} after upgrade reconciliation`);
    }
  }
  if (record.project?.executionMode === 'Task-by-task' && Number.isInteger(stage) && stage < 9) {
    push(errors, '$.state.stage', 'Task-by-task mode requires task decomposition to be reached');
  }
  if (!legacy && record.project?.executionMode === 'Continuous documentation' && Number.isInteger(stage) && stage >= 10) {
    push(errors, '$.state.stage', 'Continuous-documentation mode cannot enter Stage 10');
  }
}

function validateV1(record, errors, warnings) {
  checkShape(errors, '$', record, ['schemaVersion', 'project', 'state', 'snapshots', 'artifacts', 'tasks']);
  if (record.schemaVersion !== 1) push(errors, '$.schemaVersion', 'expected schema version 1');
  validateProject(errors, record.project);
  if (checkShape(errors, '$.state', record.state, ['stage', 'status', 'activeInputs', 'currentTask', 'latestOutput'])) {
    if (!Number.isInteger(record.state.stage) || record.state.stage < 0 || record.state.stage > 11) push(errors, '$.state.stage', 'must be an integer from 0 through 11');
    expectEnum(errors, '$.state.status', record.state.status, WORKFLOW_STATUSES);
    checkIdArray(errors, '$.state.activeInputs', record.state.activeInputs, ID_PATTERNS.snapshot);
    if (record.state.currentTask !== null) expectPattern(errors, '$.state.currentTask', record.state.currentTask, ID_PATTERNS.task);
    if (record.state.latestOutput !== null) expectPattern(errors, '$.state.latestOutput', record.state.latestOutput, ID_PATTERNS.repositorySnapshot);
  }
  const snapshots = expectArray(errors, '$.snapshots', record.snapshots) ? record.snapshots : [];
  const artifacts = expectArray(errors, '$.artifacts', record.artifacts) ? record.artifacts : [];
  const tasks = expectArray(errors, '$.tasks', record.tasks) ? record.tasks : [];
  const registry = new Map();
  const snapshotsById = new Map();
  const artifactsById = new Map();
  const tasksById = new Map();
  snapshots.forEach((item, index) => validateSnapshot(errors, item, `$.snapshots[${index}]`, registry, snapshotsById, 1));
  artifacts.forEach((item, index) => validateArtifact(errors, item, `$.artifacts[${index}]`, registry, artifactsById, 1));
  tasks.forEach((item, index) => validateTask(errors, item, `$.tasks[${index}]`, registry, tasksById, 1));
  validateSharedReferences(errors, record, snapshotsById, artifactsById, tasksById, { version: 1 });
  validateProfileRules(errors, record, artifactsById, { legacy: true });
  if (record.state?.status === 'Complete') {
    if (record.state.stage !== 11) push(errors, '$.state.stage', 'Complete workflow must be at Stage 11');
    if (tasks.some((task) => task.status !== 'Complete')) push(errors, '$.tasks', 'Complete workflow cannot contain incomplete tasks');
  }
  warnings.push('Schema-v1 record is readable but read-only; run "design-workflow migrate" before mutation.');
}

function latestActive(items, predicate) {
  return [...items].reverse().find((item) => item.status === 'Active' && predicate(item));
}

function traceAncestors(traceById, id, seen = new Set()) {
  if (seen.has(id)) return seen;
  seen.add(id);
  const item = traceById.get(id);
  for (const reference of item?.references ?? []) {
    if (traceById.has(reference)) traceAncestors(traceById, reference, seen);
  }
  return seen;
}

function validateStageExit(errors, record, stage, gate, maps) {
  const activeArtifacts = [...maps.artifactsById.values()].filter((item) => item.status !== 'Superseded');
  const artifactsOfType = (type, status = 'Approved') => activeArtifacts.some((item) => item.type === type && item.status === status);
  const approved = (...types) => types.some((type) => artifactsOfType(type));
  const reviewed = (...types) => types.some((type) => activeArtifacts.some((item) => item.type === type && ['Reviewed', 'Approved'].includes(item.status)));
  const profile = record.project.profile;
  const consolidated = profile === 'Express' ? 'WORKPACK' : profile === 'Lite' ? 'IMPLEMENTATION-BRIEF' : null;
  const gatePath = `$.gates[${record.gates.indexOf(gate)}]`;
  const requireCondition = (condition, message) => { if (!condition) push(errors, gatePath, message); };
  const blockedInput = record.state.activeInputs.find((id) => {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
    return verification && ['Unexpected upstream or concurrent change', 'Unavailable'].includes(verification.result);
  });
  requireCondition(!blockedInput, blockedInput ? `Snapshot ${blockedInput} has a blocking verification result` : 'Source verification is clear');
  if (gate.result.startsWith('Passed')) {
    const unverifiedInput = record.state.activeInputs.find((id) => {
      const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
      return !verification || !['Unchanged', 'Expected workflow output'].includes(verification.result);
    });
    requireCondition(!unverifiedInput, unverifiedInput ? `Snapshot ${unverifiedInput} requires a passing verification` : 'Active inputs are verified');
  }
  const unrecordedInput = record.state.activeInputs.find((id) => !gate.baseline.includes(id));
  requireCondition(!unrecordedInput, unrecordedInput ? `Gate baseline omits active input ${unrecordedInput}` : 'Gate baseline records active inputs');
  const missingVerification = record.state.activeInputs.find((id) => {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
    return verification && !gate.verifications.includes(verification.id);
  });
  requireCondition(!missingVerification, missingVerification ? `Gate omits the latest verification for ${missingVerification}` : 'Gate records current source verifications');
  const omittedArtifact = activeArtifacts.find((artifact) => !gate.artifacts.includes(artifact.id));
  requireCondition(!omittedArtifact, omittedArtifact ? `Gate omits active artifact ${omittedArtifact.id}` : 'Gate records active artifacts');

  if (stage === 0) {
    const verifiedInputs = record.state.activeInputs.every((id) => {
      const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
      return verification && ['Unchanged', 'Expected workflow output'].includes(verification.result);
    });
    requireCondition(record.state.activeInputs.length > 0 && verifiedInputs, 'Stage 0 requires every active input to have a passing verification');
    const controlRegistered = profile === 'Express'
      ? activeArtifacts.some((item) => item.type === 'WORKPACK')
      : artifactsOfType('SOURCE-BASELINE') && artifactsOfType('PROJECT-CONTEXT') && activeArtifacts.some((item) => item.type === 'WORKFLOW-STATE');
    requireCondition(controlRegistered, 'Stage 0 requires the profile control artifacts to be registered and source/context approvals where separate');
  }
  if (stage === 1 && profile !== 'Express') requireCondition(approved('DESIGN-AUDIT'), 'Stage 1 requires an approved DESIGN-AUDIT');
  if (stage === 2 && !consolidated) requireCondition(approved('REQUIREMENTS'), 'Stage 2 requires approved REQUIREMENTS');
  if (stage === 3 && !consolidated) requireCondition(approved('DESIGN'), 'Stage 3 requires approved DESIGN');
  if (stage === 4 && !consolidated) requireCondition(approved('SPEC'), 'Stage 4 requires approved SPEC');
  if (stage === 5) requireCondition(consolidated ? reviewed(consolidated) : approved('DOCUMENT-REVIEW'), 'Stage 5 requires reviewed consolidated documentation or approved DOCUMENT-REVIEW');
  if (stage === 6) {
    requireCondition(record.state.architectureDecision !== null, 'Stage 6 requires an architecture decision');
    const required = record.state.architectureDecision?.result === 'Required';
    if (required && ['Express', 'Lite'].includes(profile)) requireCondition(gate.result === 'Must upgrade', 'Architecture-required Express or Lite work must upgrade');
    if (profile === 'Full' || (required && profile === 'Standard')) requireCondition(approved('ARCHITECTURE'), 'Stage 6 requires an approved ARCHITECTURE artifact');
  }
  if (stage === 7) requireCondition(consolidated ? gate.result.startsWith('Passed') : reviewed('PLAN'), 'Stage 7 requires a reviewed plan or consolidated planning gate');
  if (stage === 8) requireCondition(profile === 'Express' ? reviewed('WORKPACK') : profile === 'Lite' ? approved('IMPLEMENTATION-BRIEF') : approved('PLAN') && approved('PLAN-REVIEW'), 'Stage 8 plan artifacts must be approved');
  if (stage === 9) {
    if (!consolidated) requireCondition(approved('TASKS-INDEX'), 'Stage 9 requires an approved TASKS-INDEX');
    if (profile !== 'Express') {
      const unapprovedTask = record.tasks.find((task) => !activeArtifacts.some((artifact) => (
        artifact.type === 'TASK' && artifact.status === 'Approved' && artifact.id.includes(task.id)
      )));
      requireCondition(!unapprovedTask, unapprovedTask ? `Stage 9 requires an approved TASK artifact for ${unapprovedTask.id}` : 'Task artifacts are approved');
    }
    requireCondition(record.tasks.length > 0 && record.tasks.every((task) => task.status === 'Ready'), 'Stage 9 requires every task to be Ready');
  }
  if (stage === 10) {
    requireCondition(record.tasks.length > 0 && record.tasks.every((task) => task.status === 'Complete'), 'Stage 10 requires every task to be Complete');
    requireCondition(Boolean(record.state.latestOutput), 'Stage 10 requires the latest implementation output');
  }
  if (stage === 11) {
    const latestOutput = record.state.latestOutput;
    const outputVerification = latestOutput && [...record.verifications].reverse().find((verification) => verification.snapshot === latestOutput);
    const verifiedOutput = outputVerification && ['Unchanged', 'Expected workflow output'].includes(outputVerification.result);
    requireCondition(verifiedOutput, 'Stage 11 requires the latest output to be reverified');
    if (outputVerification) {
      requireCondition(
        gate.verifications.includes(outputVerification.id),
        'Stage 11 gate must record the latest output verification',
      );
    }
    requireCondition(approved(profile === 'Express' ? 'WORKPACK' : 'IMPLEMENTATION-REVIEW'), 'Stage 11 requires an approved final review artifact');
  }
}

function validateV2(record, errors) {
  const rootRequired = ['schemaVersion', 'project', 'state', 'snapshots', 'verifications', 'artifacts', 'traceItems', 'gates', 'tasks', 'profileTransitions', 'implementationReviews'];
  checkShape(errors, '$', record, rootRequired, [...rootRequired, 'toolkit', 'legacyBoundary']);
  if (record.schemaVersion !== SCHEMA_VERSION) push(errors, '$.schemaVersion', `expected schema version ${SCHEMA_VERSION}`);
  validateProject(errors, record.project);
  if (record.toolkit !== undefined) validateToolkit(errors, record.toolkit);
  if (checkShape(errors, '$.state', record.state, ['stage', 'status', 'activeInputs', 'currentTask', 'latestOutput', 'latestValidationRuntime', 'architectureDecision'])) {
    if (!Number.isInteger(record.state.stage) || record.state.stage < 0 || record.state.stage > 11) push(errors, '$.state.stage', 'must be an integer from 0 through 11');
    expectEnum(errors, '$.state.status', record.state.status, WORKFLOW_STATUSES);
    checkIdArray(errors, '$.state.activeInputs', record.state.activeInputs, ID_PATTERNS.snapshot);
    if (record.state.currentTask !== null) expectPattern(errors, '$.state.currentTask', record.state.currentTask, ID_PATTERNS.task);
    if (record.state.latestOutput !== null) expectPattern(errors, '$.state.latestOutput', record.state.latestOutput, ID_PATTERNS.repositorySnapshot);
    if (record.state.latestValidationRuntime !== null) expectPattern(errors, '$.state.latestValidationRuntime', record.state.latestValidationRuntime, /^SRC-RUN-\d{3,}$/);
    if (record.state.architectureDecision !== null && checkShape(errors, '$.state.architectureDecision', record.state.architectureDecision, ['result', 'reason', 'recordedAt'])) {
      expectEnum(errors, '$.state.architectureDecision.result', record.state.architectureDecision.result, ['Required', 'Not required']);
      expectString(errors, '$.state.architectureDecision.reason', record.state.architectureDecision.reason);
      expectTimestamp(errors, '$.state.architectureDecision.recordedAt', record.state.architectureDecision.recordedAt);
    }
  }
  const arrayNames = ['snapshots', 'verifications', 'artifacts', 'traceItems', 'gates', 'tasks', 'profileTransitions', 'implementationReviews'];
  for (const name of arrayNames) expectArray(errors, `$.${name}`, record[name]);
  const registry = new Map();
  const snapshotsById = new Map();
  const artifactsById = new Map();
  const tasksById = new Map();
  const verificationsById = new Map();
  const traceById = new Map();
  const gatesById = new Map();
  (record.snapshots ?? []).forEach((item, index) => validateSnapshot(errors, item, `$.snapshots[${index}]`, registry, snapshotsById, 2));
  (record.artifacts ?? []).forEach((item, index) => validateArtifact(errors, item, `$.artifacts[${index}]`, registry, artifactsById, 2));
  (record.tasks ?? []).forEach((item, index) => validateTask(errors, item, `$.tasks[${index}]`, registry, tasksById, 2));

  (record.verifications ?? []).forEach((item, index) => {
    const path = `$.verifications[${index}]`;
    const required = ['id', 'snapshot', 'result', 'method', 'evidence', 'checkedAt'];
    if (!checkShape(errors, path, item, required, [...required, 'replacement'])) return;
    if (expectPattern(errors, `${path}.id`, item.id, ID_PATTERNS.verification)) {
      registerId(errors, registry, item.id, `${path}.id`);
      verificationsById.set(item.id, item);
    }
    expectPattern(errors, `${path}.snapshot`, item.snapshot, ID_PATTERNS.snapshot);
    expectEnum(errors, `${path}.result`, item.result, VERIFICATION_RESULTS);
    expectString(errors, `${path}.method`, item.method);
    expectString(errors, `${path}.evidence`, item.evidence);
    expectTimestamp(errors, `${path}.checkedAt`, item.checkedAt);
    expectPattern(errors, `${path}.replacement`, item.replacement, ID_PATTERNS.snapshot, { optional: true });
    if (!snapshotsById.has(item.snapshot)) push(errors, `${path}.snapshot`, `references missing snapshot ${item.snapshot}`);
    if (item.replacement && !snapshotsById.has(item.replacement)) push(errors, `${path}.replacement`, `references missing snapshot ${item.replacement}`);
  });

  (record.traceItems ?? []).forEach((item, index) => {
    const path = `$.traceItems[${index}]`;
    const required = ['id', 'owner', 'status', 'required', 'references'];
    if (!checkShape(errors, path, item, required, [...required, 'supersededBy'])) return;
    if (expectPattern(errors, `${path}.id`, item.id, ID_PATTERNS.domain)) {
      registerId(errors, registry, item.id, `${path}.id`);
      traceById.set(item.id, item);
    }
    expectPattern(errors, `${path}.owner`, item.owner, ID_PATTERNS.artifact);
    expectEnum(errors, `${path}.status`, item.status, ['Active', 'Superseded']);
    if (typeof item.required !== 'boolean') push(errors, `${path}.required`, 'must be a boolean');
    checkIdArray(errors, `${path}.references`, item.references, ID_PATTERNS.domain);
    expectPattern(errors, `${path}.supersededBy`, item.supersededBy, ID_PATTERNS.domain, { optional: true });
    if (item.status === 'Superseded' && !item.supersededBy) push(errors, `${path}.supersededBy`, 'Superseded trace item requires a replacement');
    if (item.supersededBy === item.id) push(errors, `${path}.supersededBy`, 'Trace item cannot supersede itself');
  });

  (record.gates ?? []).forEach((item, index) => {
    const path = `$.gates[${index}]`;
    const required = ['id', 'stage', 'status', 'result', 'baseline', 'verifications', 'artifacts', 'evidence', 'recordedAt'];
    if (!checkShape(errors, path, item, required, [...required, 'approvedBy', 'artifactRevisions'])) return;
    if (expectPattern(errors, `${path}.id`, item.id, ID_PATTERNS.gate)) {
      registerId(errors, registry, item.id, `${path}.id`);
      gatesById.set(item.id, item);
    }
    if (!Number.isInteger(item.stage) || item.stage < 0 || item.stage > 11) push(errors, `${path}.stage`, 'must be an integer from 0 through 11');
    expectEnum(errors, `${path}.status`, item.status, ['Active', 'Superseded']);
    expectEnum(errors, `${path}.result`, item.result, GATE_RESULTS);
    checkIdArray(errors, `${path}.baseline`, item.baseline, ID_PATTERNS.snapshot);
    checkIdArray(errors, `${path}.verifications`, item.verifications, ID_PATTERNS.verification);
    checkIdArray(errors, `${path}.artifacts`, item.artifacts, ID_PATTERNS.artifact);
    expectString(errors, `${path}.evidence`, item.evidence);
    expectTimestamp(errors, `${path}.recordedAt`, item.recordedAt);
    expectString(errors, `${path}.approvedBy`, item.approvedBy, { optional: true });
    if (item.status === 'Active' && record.project?.executionMode === 'Gated' && !item.approvedBy) push(errors, `${path}.approvedBy`, 'Gated stage decision requires an approver');
    item.baseline?.forEach((id) => { if (!snapshotsById.has(id)) push(errors, `${path}.baseline`, `references missing snapshot ${id}`); });
    item.verifications?.forEach((id) => { if (!verificationsById.has(id)) push(errors, `${path}.verifications`, `references missing verification ${id}`); });
    item.artifacts?.forEach((id) => { if (!artifactsById.has(id)) push(errors, `${path}.artifacts`, `references missing artifact ${id}`); });
  });

  const activeGateByStage = new Map();
  for (const gate of record.gates ?? []) {
    if (gate.status !== 'Active') continue;
    if (activeGateByStage.has(gate.stage)) push(errors, '$.gates', `multiple active gates exist for Stage ${gate.stage}`);
    activeGateByStage.set(gate.stage, gate);
  }

  (record.profileTransitions ?? []).forEach((item, index) => {
    const path = `$.profileTransitions[${index}]`;
    const required = ['id', 'from', 'to', 'resumeStage', 'reason', 'status', 'sourceArtifacts', 'targetArtifacts', 'startedAt'];
    const allowed = [...required, 'completedAt', 'evidence', 'approvedBy'];
    if (!checkShape(errors, path, item, required, allowed)) return;
    if (expectPattern(errors, `${path}.id`, item.id, ID_PATTERNS.profileTransition)) registerId(errors, registry, item.id, `${path}.id`);
    expectEnum(errors, `${path}.from`, item.from, PROFILES);
    expectEnum(errors, `${path}.to`, item.to, PROFILES);
    if ((PROFILE_RANK.get(item.to) ?? -1) <= (PROFILE_RANK.get(item.from) ?? -1)) push(errors, `${path}.to`, 'profile transitions must upgrade to a higher profile');
    if (!Number.isInteger(item.resumeStage) || item.resumeStage < 0 || item.resumeStage > 11) push(errors, `${path}.resumeStage`, 'must be an integer from 0 through 11');
    expectString(errors, `${path}.reason`, item.reason);
    expectEnum(errors, `${path}.status`, item.status, ['In progress', 'Complete']);
    checkIdArray(errors, `${path}.sourceArtifacts`, item.sourceArtifacts, ID_PATTERNS.artifact);
    checkIdArray(errors, `${path}.targetArtifacts`, item.targetArtifacts, ID_PATTERNS.artifact);
    expectTimestamp(errors, `${path}.startedAt`, item.startedAt);
    for (const id of item.sourceArtifacts ?? []) {
      if (!artifactsById.has(id)) push(errors, `${path}.sourceArtifacts`, `references missing artifact ${id}`);
    }
    for (const id of item.targetArtifacts ?? []) {
      if (!artifactsById.has(id)) push(errors, `${path}.targetArtifacts`, `references missing artifact ${id}`);
    }
    if (item.status === 'In progress') {
      if (record.project.profile !== item.to) push(errors, '$.project.profile', `in-progress transition ${item.id} requires target profile ${item.to}`);
      if (record.state.stage !== item.resumeStage) push(errors, '$.state.stage', `in-progress transition ${item.id} must remain at resume Stage ${item.resumeStage}`);
      if (record.state.status !== 'Blocked') push(errors, '$.state.status', `in-progress transition ${item.id} must block the workflow`);
    }
    if (item.status === 'Complete') {
      expectTimestamp(errors, `${path}.completedAt`, item.completedAt);
      expectString(errors, `${path}.evidence`, item.evidence);
      if (record.project.executionMode === 'Gated') expectString(errors, `${path}.approvedBy`, item.approvedBy);
    }
  });
  if ((record.profileTransitions ?? []).filter((item) => item.status === 'In progress').length > 1) push(errors, '$.profileTransitions', 'only one profile upgrade may be in progress');

  (record.implementationReviews ?? []).forEach((item, index) => {
    const path = `$.implementationReviews[${index}]`;
    const required = ['id', 'status', 'result', 'artifact', 'output', 'evidence', 'recordedAt', 'approvedBy', 'deviations'];
    if (!checkShape(errors, path, item, required, [...required, 'runtime', 'artifactRevision'])) return;
    if (expectPattern(errors, `${path}.id`, item.id, ID_PATTERNS.review)) registerId(errors, registry, item.id, `${path}.id`);
    expectEnum(errors, `${path}.status`, item.status, ['Active', 'Superseded']);
    expectEnum(errors, `${path}.result`, item.result, FINAL_RESULTS);
    expectPattern(errors, `${path}.artifact`, item.artifact, ID_PATTERNS.artifact);
    expectPattern(errors, `${path}.output`, item.output, ID_PATTERNS.repositorySnapshot);
    expectPattern(errors, `${path}.runtime`, item.runtime, /^SRC-RUN-\d{3,}$/, { optional: true });
    expectString(errors, `${path}.evidence`, item.evidence);
    expectTimestamp(errors, `${path}.recordedAt`, item.recordedAt);
    expectString(errors, `${path}.approvedBy`, item.approvedBy);
    if (!expectArray(errors, `${path}.deviations`, item.deviations)) return;
    checkUnique(errors, `${path}.deviations`, item.deviations);
    item.deviations.forEach((deviation, deviationIndex) => expectString(errors, `${path}.deviations[${deviationIndex}]`, deviation));
    if (item.result === 'accepted-with-deviations' && item.deviations.length === 0) push(errors, `${path}.deviations`, 'accepted-with-deviations requires explicit deviation evidence');
    const reviewArtifact = artifactsById.get(item.artifact);
    if (!reviewArtifact) push(errors, `${path}.artifact`, `references missing artifact ${item.artifact}`);
    else {
      const expectedType = record.project.profile === 'Express' ? 'WORKPACK' : 'IMPLEMENTATION-REVIEW';
      if (reviewArtifact.type !== expectedType) push(errors, `${path}.artifact`, `final review for ${record.project.profile} must use ${expectedType}`);
      if (item.status === 'Active' && reviewArtifact.status === 'Superseded') push(errors, `${path}.artifact`, 'active final review must use an active artifact');
    }
    const outputSnapshot = snapshotsById.get(item.output);
    if (!outputSnapshot) push(errors, `${path}.output`, `references missing snapshot ${item.output}`);
    else if (outputSnapshot.role !== 'Implementation output') push(errors, `${path}.output`, 'must reference an Implementation output snapshot');
    if (item.runtime) {
      const runtimeSnapshot = snapshotsById.get(item.runtime);
      if (!runtimeSnapshot) push(errors, `${path}.runtime`, `references missing snapshot ${item.runtime}`);
      else if (runtimeSnapshot.role !== 'Validation runtime') push(errors, `${path}.runtime`, 'must reference a Validation runtime snapshot');
      else {
        if (runtimeSnapshot.parent !== item.output) push(errors, `${path}.runtime`, `Validation runtime ${item.runtime} must parent reviewed output ${item.output}`);
        if (item.status === 'Active' && runtimeSnapshot.status !== 'Active') push(errors, `${path}.runtime`, 'active final review must use an Active Validation runtime snapshot');
      }
    }
  });
  if ((record.implementationReviews ?? []).filter((item) => item.status === 'Active').length > 1) push(errors, '$.implementationReviews', 'only one final-review result may be active');

  if (record.legacyBoundary !== undefined && checkShape(errors, '$.legacyBoundary', record.legacyBoundary, ['migratedFrom', 'gatesRequiredFromStage', 'traceRequiredFromStage'])) {
    if (record.legacyBoundary.migratedFrom !== 1) push(errors, '$.legacyBoundary.migratedFrom', 'must equal 1');
    for (const key of ['gatesRequiredFromStage', 'traceRequiredFromStage']) {
      if (!Number.isInteger(record.legacyBoundary[key]) || record.legacyBoundary[key] < 0 || record.legacyBoundary[key] > 11) push(errors, `$.legacyBoundary.${key}`, 'must be an integer from 0 through 11');
    }
  }

  validateSharedReferences(errors, record, snapshotsById, artifactsById, tasksById, { version: 2 });
  validateProfileRules(errors, record, artifactsById);

  for (const [id, item] of traceById) {
    const index = record.traceItems.indexOf(item);
    const owner = artifactsById.get(item.owner);
    if (!owner) push(errors, `$.traceItems[${index}].owner`, `references missing artifact ${item.owner}`);
    else {
      if (owner.status === 'Superseded' && item.status === 'Active') push(errors, `$.traceItems[${index}].owner`, 'active trace item owner must be active');
      if (!allowedTraceOwnerTypes(id).includes(owner.type)) push(errors, `$.traceItems[${index}].owner`, `${id} cannot be owned by ${owner.type}`);
    }
    for (const reference of item.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, `$.traceItems[${index}].references`, `unresolved trace reference ${reference}`);
      else if (item.status === 'Active' && referenced.status !== 'Active') push(errors, `$.traceItems[${index}].references`, `active trace item references superseded item ${reference}`);
    }
    if (item.supersededBy && !traceById.has(item.supersededBy)) push(errors, `$.traceItems[${index}].supersededBy`, `references missing trace item ${item.supersededBy}`);
  }
  for (const cycle of findCycles(new Set(traceById.keys()), (id) => traceById.get(id)?.references ?? [])) push(errors, '$.traceItems', `trace cycle detected: ${cycle.join(' -> ')}`);
  for (const task of record.tasks ?? []) {
    for (const reference of task.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, '$.tasks', `task ${task.id} has unresolved trace reference ${reference}`);
      else if (referenced.status !== 'Active') push(errors, '$.tasks', `task ${task.id} references superseded trace item ${reference}`);
    }
    for (const check of task.validation ?? []) for (const reference of check.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, '$.tasks', `validation ${task.id}/${check.name} has unresolved trace reference ${reference}`);
      else if (referenced.status !== 'Active') push(errors, '$.tasks', `validation ${task.id}/${check.name} references superseded trace item ${reference}`);
    }
  }

  const gateBoundary = record.legacyBoundary?.gatesRequiredFromStage ?? 0;
  const currentStage = Number.isInteger(record.state?.stage) ? record.state.stage : 0;
  for (let stage = gateBoundary; stage < currentStage; stage += 1) {
    const gate = activeGateByStage.get(stage);
    if (!gate || !['Passed', 'Passed with assumptions'].includes(gate.result)) push(errors, '$.gates', `Stage ${stage} requires an active passing gate before Stage ${currentStage}`);
  }
  for (const gate of activeGateByStage.values()) {
    if (gate.stage === currentStage && ['Passed', 'Passed with assumptions', 'Must upgrade'].includes(gate.result)) validateStageExit(errors, record, gate.stage, gate, { snapshotsById, artifactsById, tasksById });
  }
  if ((record.profileTransitions ?? []).some((item) => item.status === 'In progress') && currentStage > record.profileTransitions.find((item) => item.status === 'In progress').resumeStage) push(errors, '$.state.stage', 'profile upgrade blocks advancement until finish');

  const enforcePlanCoverage = currentStage > 8 || ['Passed', 'Passed with assumptions'].includes(activeGateByStage.get(8)?.result);
  const enforceTaskCoverage = currentStage > 9 || ['Passed', 'Passed with assumptions'].includes(activeGateByStage.get(9)?.result);
  const requiredItems = [...traceById.values()].filter((item) => item.status === 'Active' && item.required);
  const activeTrace = [...traceById.values()].filter((item) => item.status === 'Active');
  for (const required of requiredItems) {
    const downstreamTrace = activeTrace.filter((candidate) => traceAncestors(traceById, candidate.id).has(required.id));
    if (enforcePlanCoverage && !downstreamTrace.some((item) => item.id.startsWith('PLAN-') || item.id.startsWith('AC-'))) push(errors, '$.traceItems', `required item ${required.id} does not reach an active plan or acceptance criterion`);
    const downstreamIds = new Set(downstreamTrace.map((item) => item.id));
    if (enforceTaskCoverage && !(record.tasks ?? []).some((task) => ['Ready', 'In progress', 'Blocked', 'Complete'].includes(task.status) && task.references.some((id) => downstreamIds.has(id)))) push(errors, '$.traceItems', `required item ${required.id} does not reach a Ready task`);
    const acceptedReview = latestActive(record.implementationReviews ?? [], (item) => ['accepted', 'accepted-with-deviations'].includes(item.result));
    if (acceptedReview && !(record.tasks ?? []).some((task) => task.validation.some((check) => check.required && check.status === 'Passed' && check.references.some((id) => downstreamIds.has(id))))) push(errors, '$.traceItems', `required item ${required.id} does not reach a Passed required validation check`);
  }

  const activeReview = latestActive(record.implementationReviews ?? [], () => true);
  if (record.state?.status === 'Complete') {
    if (currentStage !== 11) push(errors, '$.state.stage', 'Complete workflow must be at Stage 11');
    if (!activeReview || !['accepted', 'accepted-with-deviations'].includes(activeReview.result)) push(errors, '$.implementationReviews', 'Complete workflow requires an accepted active final-review event');
    const finalGate = activeGateByStage.get(11);
    if (!finalGate || !['Passed', 'Passed with assumptions'].includes(finalGate.result)) push(errors, '$.gates', 'Final acceptance requires an active passing Stage 11 gate');
    if (activeReview) {
      if (activeReview.output !== record.state.latestOutput) push(errors, '$.implementationReviews', 'Active final-review output must equal the latest implementation output');
      if (activeReview.runtime && activeReview.runtime !== record.state.latestValidationRuntime) push(errors, '$.implementationReviews', 'Active final-review runtime must equal the latest validation runtime');
      const outputVerification = [...record.verifications].reverse().find((item) => item.snapshot === activeReview.output);
      if (!outputVerification || !['Unchanged', 'Expected workflow output'].includes(outputVerification.result)) push(errors, '$.verifications', 'Final acceptance requires the reviewed output to be reverified');
      const reviewArtifact = artifactsById.get(activeReview.artifact);
      if (!reviewArtifact || reviewArtifact.status !== 'Approved') push(errors, '$.implementationReviews', 'Final acceptance requires an approved review artifact');
    }
    if ((record.tasks ?? []).some((task) => task.status !== 'Complete')) push(errors, '$.tasks', 'Complete workflow cannot contain incomplete tasks');
  }
  if (activeReview?.result === 'requires-corrections' && record.state?.status !== 'Blocked') push(errors, '$.state.status', 'requires-corrections final result must leave Stage 11 Blocked');
}

export function inspectWorkflowRecord(record) {
  const errors = [];
  const warnings = [];
  if (!expectObject(errors, '$', record)) return { errors, warnings };
  if (record.schemaVersion === 1) validateV1(record, errors, warnings);
  else if (record.schemaVersion === SCHEMA_VERSION) validateV2(record, errors);
  else push(errors, '$.schemaVersion', `expected schema version 1 or ${SCHEMA_VERSION}`);
  return { errors, warnings };
}

export function validateWorkflowRecord(record) {
  return inspectWorkflowRecord(record).errors;
}
