#!/usr/bin/env node

import {
  artifactTypesThroughStage,
  PROFILES,
} from '../cli/lib/workflow-model.mjs';
import { validateWorkflowRecord } from './lib/validate-workflow-record.mjs';

const timestamp = '2026-08-12T12:00:00.000Z';
const baselineCommit = '1'.repeat(40);
const outputCommit = '2'.repeat(40);

function artifactId(type) {
  return `ART-${type}`;
}

function traceOwner(profile, kind) {
  if (profile === 'Express') return 'ART-WORKPACK';
  if (profile === 'Lite') return 'ART-IMPLEMENTATION-BRIEF';
  return artifactId(kind);
}

function buildRecord(profile, stage, {
  architecture = 'Not required',
  executionMode = 'Gated',
  gateResult = 'Passed',
} = {}) {
  const architectureDecision = stage >= 6
    ? { result: architecture, reason: 'Matrix fixture decision', recordedAt: timestamp }
    : null;
  const types = artifactTypesThroughStage(profile, stage, architectureDecision);
  const artifacts = types.map((type) => ({
    id: artifactId(type),
    type,
    path: `${type}.md`,
    status: 'Approved',
    baseline: ['SRC-REPO-001'],
  }));
  if (stage >= 9 && profile !== 'Express') {
    artifacts.push({
      id: 'ART-TASK-P01-T01',
      type: 'TASK',
      path: 'Phase-01--Task-01.md',
      status: 'Approved',
      baseline: ['SRC-REPO-001'],
    });
  }

  const snapshots = [{
    id: 'SRC-REPO-001',
    role: 'Input baseline',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: '/tmp/workflow-gate-matrix',
    commit: baselineCommit,
  }];
  const verifications = [{
    id: 'VER-001',
    snapshot: 'SRC-REPO-001',
    result: 'Unchanged',
    method: 'Fixture comparison',
    evidence: 'Baseline matches the matrix fixture',
    checkedAt: timestamp,
  }];

  const traceItems = stage >= 8 ? [
    {
      id: 'REQ-FR-001',
      owner: traceOwner(profile, 'REQUIREMENTS'),
      status: 'Active',
      required: true,
      references: [],
    },
    {
      id: 'AC-001',
      owner: traceOwner(profile, 'SPEC'),
      status: 'Active',
      required: false,
      references: ['REQ-FR-001'],
    },
    {
      id: 'PLAN-001',
      owner: traceOwner(profile, 'PLAN'),
      status: 'Active',
      required: false,
      references: ['AC-001'],
    },
  ] : [];

  const tasks = [];
  if (stage >= 9) {
    const complete = stage >= 10;
    if (complete) {
      snapshots.push({
        id: 'SRC-REPO-002',
        role: 'Implementation output',
        pinStrength: 'Immutable',
        status: 'Active',
        reference: '/tmp/workflow-gate-matrix',
        commit: outputCommit,
        parent: 'SRC-REPO-001',
        task: 'P01-T01',
      });
    }
    tasks.push({
      id: 'P01-T01',
      status: complete ? 'Complete' : 'Ready',
      baseline: 'SRC-REPO-001',
      prerequisites: [],
      references: ['PLAN-001'],
      output: complete ? 'SRC-REPO-002' : null,
      blocker: null,
      validation: complete ? [{
        name: 'Matrix test',
        kind: 'Test',
        required: true,
        status: 'Passed',
        expected: 'The matrix fixture passes',
        actual: 'The matrix fixture passed',
        command: 'node scripts/test-stage-gates.mjs',
        environment: 'Node.js 22+',
        executedAt: timestamp,
        evidence: ['Synthetic gate matrix'],
        references: ['PLAN-001'],
      }] : [],
    });
  }
  if (stage >= 11) {
    verifications.push({
      id: 'VER-002',
      snapshot: 'SRC-REPO-002',
      result: 'Expected workflow output',
      method: 'Output fixture comparison',
      evidence: 'Implementation output matches the expected fixture',
      checkedAt: timestamp,
    });
  }

  const artifactIds = artifacts.map((artifact) => artifact.id);
  const gates = [];
  for (let gateStage = 0; gateStage <= stage; gateStage += 1) {
    const current = gateStage === stage;
    gates.push({
      id: `GATE-${String(gateStage + 1).padStart(3, '0')}`,
      stage: gateStage,
      status: 'Active',
      result: current ? gateResult : 'Passed',
      baseline: ['SRC-REPO-001'],
      verifications: gateStage === 11 ? ['VER-001', 'VER-002'] : ['VER-001'],
      artifacts: artifactIds,
      evidence: current && gateResult === 'Passed with assumptions'
        ? 'Passed with a documented matrix assumption'
        : `Stage ${gateStage} matrix evidence`,
      recordedAt: timestamp,
      approvedBy: 'Matrix approver',
    });
  }

  return {
    schemaVersion: 2,
    project: {
      name: `${profile} Stage ${stage} gate matrix`,
      profile,
      executionMode,
    },
    state: {
      stage,
      status: gateResult.startsWith('Passed') ? 'Ready' : 'Blocked',
      activeInputs: ['SRC-REPO-001'],
      currentTask: null,
      latestOutput: stage >= 10 ? 'SRC-REPO-002' : null,
      latestValidationRuntime: null,
      architectureDecision,
    },
    snapshots,
    verifications,
    artifacts,
    traceItems,
    gates,
    tasks,
    profileTransitions: [],
    implementationReviews: [],
  };
}

function expectValid(label, record) {
  const errors = validateWorkflowRecord(record);
  if (errors.length > 0) {
    throw new Error(`${label} should be valid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}

function expectInvalid(label, record, fragment) {
  const errors = validateWorkflowRecord(record);
  if (!errors.some((error) => error.includes(fragment))) {
    throw new Error(`${label} should report "${fragment}":\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}

for (const profile of PROFILES) {
  for (let stage = 0; stage <= 11; stage += 1) {
    expectValid(`${profile} Stage ${stage}`, buildRecord(profile, stage));
  }
}

expectValid(
  'Passed with assumptions',
  buildRecord('Standard', 8, { gateResult: 'Passed with assumptions' }),
);
for (const profile of ['Express', 'Lite']) {
  expectValid(
    `${profile} architecture upgrade gate`,
    buildRecord(profile, 6, { architecture: 'Required', gateResult: 'Must upgrade' }),
  );
}
expectValid(
  'Standard conditional architecture',
  buildRecord('Standard', 6, { architecture: 'Required' }),
);

const missingApprover = buildRecord('Lite', 0);
delete missingApprover.gates[0].approvedBy;
expectInvalid('Gated decision without approver', missingApprover, 'requires an approver');
const missingUpgradeApprover = buildRecord('Lite', 6, { architecture: 'Required', gateResult: 'Must upgrade' });
delete missingUpgradeApprover.gates.find((gate) => gate.stage === 6).approvedBy;
expectInvalid('Must-upgrade decision without approver', missingUpgradeApprover, 'requires an approver');
expectInvalid(
  'Continuous documentation at Stage 10',
  buildRecord('Express', 10, { executionMode: 'Continuous documentation' }),
  'cannot enter Stage 10',
);
expectInvalid(
  'Task-by-task before decomposition',
  buildRecord('Express', 8, { executionMode: 'Task-by-task' }),
  'requires task decomposition',
);

const continuousStageNine = buildRecord('Express', 9, {
  executionMode: 'Continuous documentation',
  gateResult: 'Passed with assumptions',
});
expectValid('Continuous documentation can close Stage 9 without entering execution', continuousStageNine);
expectValid(
  'Task-by-task may begin at Stage 9',
  buildRecord('Express', 9, { executionMode: 'Task-by-task' }),
);
const accepted = buildRecord('Standard', 11);
accepted.implementationReviews.push({
  id: 'REVIEW-001',
  status: 'Active',
  result: 'accepted',
  artifact: 'ART-IMPLEMENTATION-REVIEW',
  output: 'SRC-REPO-002',
  evidence: 'Final matrix acceptance',
  recordedAt: timestamp,
  approvedBy: 'Matrix approver',
  deviations: [],
});
accepted.state.status = 'Complete';
expectValid('Final acceptance with Stage 11 gate', accepted);

const noFinalGate = structuredClone(accepted);
noFinalGate.gates.find((gate) => gate.stage === 11).status = 'Superseded';
expectInvalid(noFinalGate.project.name, noFinalGate, 'requires an active passing Stage 11 gate');

console.log('All 48 profile/stage gate combinations, conditional gates, and execution-mode boundaries passed.');
