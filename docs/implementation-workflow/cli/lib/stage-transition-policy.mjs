const STAGE_PREFLIGHT_EXECUTOR = 'design-workflow stage check';
const STAGE_TRANSITION_EXECUTOR = 'design-workflow stage review/advance';

function stageTransitionBlocker(record, workflowValid) {
  if (record.schemaVersion === 1) return 'migration-required';
  if (!workflowValid) return 'repair-required';
  return null;
}

export function blockedStageTransitionPolicy(blocker) {
  return {
    decisionAuthority: 'not-applicable',
    preflight: {
      required: false,
      executor: STAGE_PREFLIGHT_EXECUTOR,
      availableHere: false,
      blocker,
    },
    execution: {
      executor: STAGE_TRANSITION_EXECUTOR,
      availableHere: false,
      blocker,
    },
  };
}

export function stageTransitionPolicy(record, { workflowValid, cliAvailable }) {
  const blocker = stageTransitionBlocker(record, workflowValid);
  if (blocker) return blockedStageTransitionPolicy(blocker);

  const capabilityBlocker = cliAvailable ? null : 'cli-unavailable-in-current-environment';

  return {
    decisionAuthority: record.project.executionMode === 'Gated' ? 'human-required' : 'agent-permitted',
    preflight: {
      required: true,
      executor: STAGE_PREFLIGHT_EXECUTOR,
      availableHere: cliAvailable,
      blocker: capabilityBlocker,
    },
    execution: {
      executor: STAGE_TRANSITION_EXECUTOR,
      availableHere: cliAvailable,
      blocker: capabilityBlocker,
    },
  };
}
