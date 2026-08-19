import { ARTIFACT_FILES, allowedTraceOwnerTypes, ID_PATTERNS } from './workflow-model.mjs';

function artifactPath(artifact, index) {
  if (typeof artifact.path === 'string' && artifact.path.trim()) return artifact.path;
  const defaultName = ARTIFACT_FILES[artifact.type]?.[0];
  if (!defaultName) return `${artifact.type}-${index + 1}.md`;
  if (artifact.type === 'TASK') {
    const taskId = /P\d{2}-T\d{2}/.exec(artifact.id)?.[0];
    if (taskId) return `Phase-${taskId.slice(1, 3)}--Task-${taskId.slice(-2)}.md`;
  }
  return defaultName;
}

function collectDomainIds(record) {
  const ids = [];
  const seen = new Set();
  const add = (id) => {
    if (!ID_PATTERNS.domain.test(id) || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const artifact of record.artifacts ?? []) for (const id of artifact.references ?? []) add(id);
  for (const task of record.tasks ?? []) {
    for (const id of task.references ?? []) add(id);
    for (const check of task.validation ?? []) for (const id of check.references ?? []) add(id);
  }
  return ids;
}

function inferOwner(record, id) {
  const permitted = allowedTraceOwnerTypes(id);
  const explicit = record.artifacts.find((artifact) => (
    artifact.status !== 'Superseded'
    && permitted.includes(artifact.type)
    && artifact.references?.includes(id)
  ));
  if (explicit) return explicit.id;
  return record.artifacts.find((artifact) => (
    artifact.status !== 'Superseded' && permitted.includes(artifact.type)
  ))?.id ?? null;
}

function migrateValidation(check) {
  const legacyStatus = check.status ?? 'Not executed';
  const migratedStatus = legacyStatus === 'Passed' ? 'Not executed' : legacyStatus;
  const evidence = typeof check.evidence === 'string' && check.evidence.trim()
    ? [check.evidence.trim()]
    : [];
  const structured = {
    name: check.name,
    kind: 'Other',
    required: legacyStatus !== 'Not applicable',
    status: migratedStatus,
    expected: `Legacy validation requirement: ${check.name}`,
    ...(legacyStatus === 'Passed' ? { actual: check.evidence || 'Recorded as passed in schema v1' } : {}),
    evidence,
    ...(legacyStatus === 'Passed'
      ? { reason: 'Legacy Passed result lacked a v2 execution timestamp; rerun before completion.' }
      : { reason: check.reason || `Legacy validation status: ${legacyStatus}` }),
    references: [...(check.references ?? [])],
  };
  if (check.command) structured.command = check.command;
  if (check.environment) structured.environment = check.environment;
  return structured;
}

function migrateSnapshot(snapshot) {
  const migrated = structuredClone(snapshot);
  if (
    migrated.role === 'Task start'
    && (!migrated.parent || !migrated.task)
  ) {
    migrated.role = 'Input baseline';
    delete migrated.parent;
    delete migrated.task;
  }
  return migrated;
}

function migratedCurrentTask(tasks) {
  const inProgress = tasks.filter((task) => task.status === 'In progress');
  if (inProgress.length > 1) {
    throw new Error(`Cannot migrate multiple In progress tasks: ${inProgress.map((task) => task.id).join(', ')}.`);
  }
  return inProgress[0]?.id ?? null;
}

export function migrateRecordV1(record) {
  if (record.schemaVersion === 2) return structuredClone(record);
  if (record.schemaVersion !== 1) throw new Error(`Cannot migrate schema version ${String(record.schemaVersion)}.`);
  const artifacts = record.artifacts.map((artifact, index) => ({
    id: artifact.id,
    type: artifact.type,
    path: artifactPath(artifact, index),
    // Schema v1 can prove that an approval was recorded, but not which bytes were approved.
    // Preserve that evidence conservatively as Reviewed and require an explicit v2 re-approval.
    status: artifact.status === 'Approved' ? 'Reviewed' : artifact.status,
    baseline: [...artifact.baseline],
    ...(artifact.statusChangedAt ? { statusChangedAt: artifact.statusChangedAt } : {}),
    ...(artifact.statusEvidence ? { statusEvidence: artifact.statusEvidence } : {}),
    ...(artifact.statusBy ? { statusBy: artifact.statusBy } : {}),
    ...(artifact.supersededBy ? { supersededBy: artifact.supersededBy } : {}),
  }));
  const traceItems = collectDomainIds(record).map((id) => ({
    id,
    owner: inferOwner(record, id),
    status: 'Active',
    required: false,
    references: [],
  }));
  const tasks = record.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    baseline: task.baseline,
    prerequisites: [...task.prerequisites],
    references: [...task.references],
    output: task.output ?? null,
    blocker: null,
    validation: task.validation.map(migrateValidation),
  }));
  const migrated = {
    schemaVersion: 2,
    project: structuredClone(record.project),
    state: {
      stage: record.state.stage,
      status: record.state.status,
      activeInputs: [...record.state.activeInputs],
      currentTask: migratedCurrentTask(tasks),
      latestOutput: record.state.latestOutput ?? null,
      latestValidationRuntime: null,
      architectureDecision: null,
    },
    snapshots: record.snapshots.map(migrateSnapshot),
    verifications: [],
    artifacts,
    traceItems,
    gates: [],
    tasks,
    profileTransitions: [],
    implementationReviews: [],
    legacyBoundary: {
      migratedFrom: 1,
      gatesRequiredFromStage: record.state.stage,
      traceRequiredFromStage: record.state.stage,
    },
  };
  const missingOwner = migrated.traceItems.find((item) => item.owner === null);
  if (missingOwner) {
    throw new Error(`Cannot infer an active owner artifact for ${missingOwner.id}. Add the owning artifact before migration.`);
  }
  return migrated;
}

export function migrationSummary(before, after) {
  if (before.schemaVersion === 2) return ['Record already uses schema v2; no changes required.'];
  const normalizedTaskStarts = before.snapshots.filter((snapshot) => (
    snapshot.role === 'Task start' && (!snapshot.parent || !snapshot.task)
  )).length;
  const currentTaskNormalized = (before.state.currentTask ?? null) !== after.state.currentTask;
  const approvalsRequiringReapproval = before.artifacts.filter((artifact) => artifact.status === 'Approved').length;
  return [
    'Schema version: 1 → 2',
    `Artifacts assigned narrative paths: ${after.artifacts.length}`,
    ...(approvalsRequiringReapproval > 0
      ? [`Legacy approvals downgraded to Reviewed pending immutable v2 re-approval: ${approvalsRequiringReapproval}`]
      : []),
    `Unclassified trace definitions inferred: ${after.traceItems.length}`,
    `Legacy validation entries converted: ${after.tasks.reduce((count, task) => count + task.validation.length, 0)}`,
    ...(normalizedTaskStarts > 0 ? [`Unlineaged legacy Task start snapshots normalized to Input baseline: ${normalizedTaskStarts}`] : []),
    ...(currentTaskNormalized ? ['Legacy current-task pointer normalized from task status'] : []),
    `Gate and trace enforcement begins at Stage ${after.legacyBoundary.gatesRequiredFromStage}`,
  ];
}
