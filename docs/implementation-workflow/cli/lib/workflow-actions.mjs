import { STAGES } from './workflow-model.mjs';

export function activePassingGate(record, stage = record.state?.stage) {
  return [...(record.gates ?? [])].reverse().find((gate) => (
    gate.stage === stage
    && gate.status === 'Active'
    && ['Passed', 'Passed with assumptions'].includes(gate.result)
  ));
}

export function readyTask(record) {
  return (record.tasks ?? []).find((task) => (
    task.status === 'Ready'
    && (task.prerequisites ?? []).every((id) => (
      record.tasks.find((candidate) => candidate.id === id)?.status === 'Complete'
    ))
  ));
}

export function stageAdvanceFindings(record) {
  const findings = [];
  if (record.schemaVersion !== 2) findings.push('Schema-v2 is required before stage advancement.');
  const stage = record.state?.stage;
  if (!Number.isInteger(stage) || stage < 0 || stage > 11) {
    findings.push('The current stage is invalid.');
    return findings;
  }
  if (stage >= 11) findings.push('Stage 11 is final; completion uses the final implementation-review result.');
  const gate = activePassingGate(record, stage);
  if (!gate && stage < 11) findings.push(`Stage ${stage} requires an active passing gate.`);
  if ((record.profileTransitions ?? []).some((item) => item.status === 'In progress')) {
    findings.push('The active profile upgrade must finish before stage advancement.');
  }
  if (record.project?.executionMode === 'Continuous documentation' && stage + 1 >= 10) {
    findings.push('Continuous-documentation mode cannot enter Stage 10.');
  }
  return findings;
}

export function taskStartFindings(record, task) {
  const findings = [];
  if (record.schemaVersion !== 2) findings.push('Schema-v2 is required before task execution.');
  if (record.state?.stage !== 10) findings.push('Task execution requires Stage 10.');
  if (record.project?.executionMode === 'Continuous documentation') {
    findings.push('Continuous-documentation mode cannot execute tasks.');
  }
  if (!task) {
    findings.push('The selected task does not exist.');
    return findings;
  }
  if (task.status !== 'Ready') findings.push(`${task.id} must be Ready before start.`);
  const incomplete = (task.prerequisites ?? []).filter((dependency) => (
    record.tasks.find((candidate) => candidate.id === dependency)?.status !== 'Complete'
  ));
  if (incomplete.length > 0) findings.push(`Incomplete prerequisites: ${incomplete.join(', ')}.`);
  if (record.state?.currentTask && record.state.currentTask !== task.id) {
    findings.push(`${record.state.currentTask} is already in progress.`);
  }
  return findings;
}

export function deriveNextAction(record) {
  if (record.schemaVersion === 1) return 'Migrate the schema-v1 workflow record before mutation.';

  const transition = (record.profileTransitions ?? []).find((item) => item.status === 'In progress');
  if (transition) {
    return `Reconcile ${transition.to} artifacts through Stage ${transition.resumeStage}, then finish profile upgrade ${transition.id}.`;
  }

  if (record.state?.status === 'Blocked') return 'Resolve the recorded blocker before advancing.';

  if (record.state?.currentTask) {
    return `Continue ${record.state.currentTask} and record its required validation before completion.`;
  }

  const stage = record.state?.stage;
  if (stage === 10) {
    const task = readyTask(record);
    if (task) return `Start ${task.id}.`;
    const incomplete = (record.tasks ?? []).filter((item) => item.status !== 'Complete');
    if (incomplete.length > 0) return `Resolve incomplete Stage 10 task state: ${incomplete.map((item) => item.id).join(', ')}.`;
  }

  if (record.schemaVersion === 2 && Number.isInteger(stage) && stage < 11) {
    if (activePassingGate(record, stage)) {
      const findings = stageAdvanceFindings(record);
      if (findings.length === 0) return `Advance to Stage ${stage + 1} — ${STAGES[stage + 1]}.`;
      if (record.project?.executionMode === 'Continuous documentation' && stage === 9) {
        return 'Documentation is complete through Stage 9. Switch execution mode before entering implementation.';
      }
      return `Cannot advance: ${findings[0]}`;
    }
    return `Review Stage ${stage} — ${STAGES[stage]} — then advance when its gate is approved.`;
  }

  if (stage === 11) {
    if (record.state?.status === 'Complete') return 'Workflow complete. No next action is recorded.';
    if (activePassingGate(record, 11)) return 'Record the final implementation-review result.';
    return 'Review Stage 11 — Complete final implementation review — before recording the final result.';
  }

  return 'Repair the workflow state before continuing.';
}
