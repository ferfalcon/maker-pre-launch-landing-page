import { validateWorkflowRecord } from './canonical-validation.mjs';
import { STAGES } from './workflow-model.mjs';
import { activePassingGate, stageAdvanceFindings } from './workflow-actions.mjs';
import { workflowDiagnostics } from './workflow-diagnostics.mjs';
import { nextId } from './utils.mjs';

function latestVerificationIds(record) {
  const snapshotIds = [
    ...(record.state?.activeInputs ?? []),
    record.state?.latestOutput,
    record.state?.latestValidationRuntime,
  ].filter(Boolean);
  const ids = [];
  for (const snapshotId of [...new Set(snapshotIds)]) {
    const verification = [...(record.verifications ?? [])].reverse().find((item) => item.snapshot === snapshotId);
    if (verification) ids.push(verification.id);
  }
  return ids;
}

export function stageDecisionCandidate(record, result) {
  const candidate = structuredClone(record);
  for (const gate of candidate.gates ?? []) {
    if (gate.stage === candidate.state.stage && gate.status === 'Active') gate.status = 'Superseded';
  }
  const gate = {
    id: nextId(candidate.gates ?? [], 'GATE-'),
    stage: candidate.state.stage,
    status: 'Active',
    result,
    baseline: [...candidate.state.activeInputs],
    verifications: latestVerificationIds(candidate),
    artifacts: candidate.artifacts.filter((item) => item.status !== 'Superseded').map((item) => item.id),
    evidence: 'Non-mutating stage preflight',
    recordedAt: new Date().toISOString(),
    ...(candidate.project.executionMode === 'Gated' ? { approvedBy: 'Preflight placeholder' } : {}),
  };
  candidate.gates.push(gate);
  candidate.state.status = result.startsWith('Passed') ? 'Ready' : 'Blocked';
  return { candidate, gate };
}

function attempt(record, result) {
  const { candidate } = stageDecisionCandidate(record, result);
  return validateWorkflowRecord(candidate);
}

export function checkStage(recordPath, record) {
  const diagnostics = workflowDiagnostics(recordPath, record);
  const stage = record.state?.stage;
  const currentGate = [...(record.gates ?? [])].reverse().find((gate) => (
    gate.stage === stage && gate.status === 'Active'
  )) ?? null;

  if (record.schemaVersion !== 2) {
    return {
      protocolVersion: 1,
      stage: { number: stage, name: STAGES[stage] ?? 'Unknown stage', status: record.state?.status ?? null },
      workflow: diagnostics,
      decision: {
        current: currentGate,
        recordable: false,
        passing: false,
        recommendedResult: null,
        findings: ['Schema-v1 is read-only; migrate before recording a stage decision.'],
      },
      advance: { allowedNow: false, requiresHumanApproval: record.project?.executionMode === 'Gated', findings: ['Migration is required.'] },
    };
  }

  if (!diagnostics.valid) {
    return {
      protocolVersion: 1,
      stage: { number: stage, name: STAGES[stage] ?? 'Unknown stage', status: record.state.status },
      workflow: diagnostics,
      decision: {
        current: currentGate,
        recordable: false,
        passing: false,
        recommendedResult: null,
        findings: diagnostics.findings,
        attempts: { Passed: diagnostics.findings, 'Must upgrade': diagnostics.findings },
      },
      advance: {
        allowedNow: false,
        requiresHumanApproval: record.project.executionMode === 'Gated',
        findings: diagnostics.findings,
        finalStage: stage === 11,
      },
    };
  }

  const passedFindings = attempt(record, 'Passed');
  const mustUpgradeFindings = passedFindings.length > 0 ? attempt(record, 'Must upgrade') : [];
  let recommendedResult = null;
  let decisionFindings = passedFindings;
  if (passedFindings.length === 0) {
    recommendedResult = 'Passed';
    decisionFindings = [];
  } else if (mustUpgradeFindings.length === 0) {
    recommendedResult = 'Must upgrade';
    decisionFindings = [];
  }

  const passingGate = activePassingGate(record, stage);
  const advanceFindings = [
    ...diagnostics.findings,
    ...stageAdvanceFindings(record),
  ];

  return {
    protocolVersion: 1,
    stage: { number: stage, name: STAGES[stage] ?? 'Unknown stage', status: record.state.status },
    workflow: diagnostics,
    decision: {
      current: currentGate,
      recordable: recommendedResult !== null,
      passing: recommendedResult?.startsWith('Passed') ?? false,
      recommendedResult,
      findings: decisionFindings,
      attempts: {
        Passed: passedFindings,
        'Must upgrade': mustUpgradeFindings,
      },
    },
    advance: {
      allowedNow: Boolean(passingGate) && advanceFindings.length === 0,
      requiresHumanApproval: record.project.executionMode === 'Gated',
      findings: advanceFindings,
      finalStage: stage === 11,
    },
  };
}
