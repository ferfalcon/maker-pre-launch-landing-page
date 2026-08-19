import {
  FINAL_RESULTS, GATE_RESULTS, ID_PATTERNS, PROFILES, PROFILE_RANK,
  SCHEMA_VERSION, VERIFICATION_RESULTS, WORKFLOW_STATUSES,
} from './workflow-model.mjs';
import {
  validateArtifact, validateProject, validateSnapshot, validateTask, validateToolkit,
} from './workflow-record-validation-domains.mjs';
import {
  validateProfileRules, validateSharedReferences, validateV2CrossRecord,
} from './workflow-record-validation-invariants.mjs';
import {
  checkIdArray, checkShape, checkUnique, expectArray, expectEnum, expectObject,
  expectPattern, expectString, expectTimestamp, push, registerId,
} from './workflow-record-validation-primitives.mjs';

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

  validateV2CrossRecord(errors, record, {
    snapshotsById,
    artifactsById,
    tasksById,
    traceById,
    activeGateByStage,
  });
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
