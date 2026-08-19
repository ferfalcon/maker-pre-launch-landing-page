export function executionKind(record, { workflowValid = true } = {}) {
  if (record.schemaVersion === 1) return 'migration';
  if (!workflowValid) return 'repair';
  if ((record.profileTransitions ?? []).some((item) => item.status === 'In progress')) return 'profile-upgrade';
  if (record.state.status === 'Blocked') return 'blocker';
  if (record.state.stage === 9) return 'task-decomposition';
  if (record.state.stage === 10) return 'implementation-task';
  if (record.state.stage === 11) return 'final-review';
  return 'stage';
}

export function latestVerification(record, snapshotId) {
  return [...(record.verifications ?? [])].reverse().find((item) => item.snapshot === snapshotId) ?? null;
}

export function taskSummary(task) {
  return {
    id: task.id,
    status: task.status,
    baseline: task.baseline,
    prerequisites: task.prerequisites,
    references: task.references,
    output: task.output,
    validation: (task.validation ?? []).map((check) => ({
      name: check.name,
      kind: check.kind,
      required: check.required,
      status: check.status,
      subject: check.subject ?? null,
      references: check.references,
    })),
  };
}

export function currentTaskForRecord(record) {
  if (!record.state.currentTask) return null;
  return record.tasks.find((task) => task.id === record.state.currentTask) ?? null;
}

export function implementationAllowed(record, {
  workflowValid = true,
  currentTask = currentTaskForRecord(record),
} = {}) {
  return (
    workflowValid
    && record.schemaVersion === 2
    && record.state.stage === 10
    && record.project.executionMode !== 'Continuous documentation'
    && currentTask?.status === 'In progress'
    && record.state.currentTask === currentTask.id
  );
}
