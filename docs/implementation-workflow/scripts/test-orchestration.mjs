#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncGeneratedState } from '../cli/lib/generated-state.mjs';
import { buildOrchestrationContext, canEditImplementation, stageResources, stageTargets } from '../cli/lib/orchestration-context.mjs';
import { checkStage } from '../cli/lib/stage-check.mjs';
import { observedRuntimeToolkitPin } from '../cli/lib/toolkit-binding.mjs';
import { deriveNextAction } from '../cli/lib/workflow-actions.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function baseRecord({ stage, mode = 'Gated', status = 'Ready' }) {
  return {
    schemaVersion: 2,
    project: { name: 'Orchestration fixture', profile: 'Express', executionMode: mode },
    state: {
      stage, status, activeInputs: [], currentTask: null, latestOutput: null,
      latestValidationRuntime: null, architectureDecision: null,
    },
    snapshots: [], verifications: [], artifacts: [], traceItems: [], gates: [], tasks: [],
    profileTransitions: [], implementationReviews: [],
  };
}

const stageNine = baseRecord({ stage: 9 });
stageNine.gates.push({ stage: 9, status: 'Active', result: 'Passed' });
stageNine.tasks.push({ id: 'P01-T01', status: 'Ready', prerequisites: [] });
assert(
  deriveNextAction(stageNine).startsWith('Advance to Stage 10'),
  'Stage 9 must advance before a Ready task can start.',
);

const continuousNine = structuredClone(stageNine);
continuousNine.project.executionMode = 'Continuous documentation';
assert(
  deriveNextAction(continuousNine).includes('Switch execution mode'),
  'Continuous documentation must stop before Stage 10.',
);

const profileUpgrade = baseRecord({ stage: 8, status: 'Blocked' });
profileUpgrade.project.profile = 'Standard';
profileUpgrade.profileTransitions.push({
  id: 'PROFILE-001', from: 'Express', to: 'Standard', resumeStage: 8,
  reason: 'Broader planning scope', status: 'In progress',
  sourceArtifacts: ['ART-WORKPACK'], targetArtifacts: ['ART-PLAN'],
  startedAt: '2026-08-18T12:00:00.000Z',
});
assert(
  deriveNextAction(profileUpgrade) === 'Reconcile Standard artifacts through Stage 8, then finish profile upgrade PROFILE-001.',
  'Active profile reconciliation must take precedence over the generic Blocked next action.',
);

const stageTen = baseRecord({ stage: 10, status: 'In progress' });
stageTen.tasks.push({ id: 'P01-T01', status: 'Ready', prerequisites: [] });
assert(deriveNextAction(stageTen) === 'Start P01-T01.', 'Stage 10 should start the first Ready task.');
const cleanDiagnostics = { valid: true };
assert(!canEditImplementation(stageTen, cleanDiagnostics, null), 'Stage 10 without a started task must forbid implementation edits.');
stageTen.state.currentTask = 'P01-T01';
stageTen.tasks[0].status = 'In progress';
assert(canEditImplementation(stageTen, cleanDiagnostics, stageTen.tasks[0]), 'The current in-progress Stage 10 task should permit scoped implementation edits.');

const targetFixture = baseRecord({ stage: 3, status: 'In progress' });
assert(stageTargets(targetFixture).join(',') === 'WORKPACK', 'Express stage target must remain WORKPACK.');
targetFixture.project.profile = 'Lite';
assert(stageTargets(targetFixture).join(',') === 'IMPLEMENTATION-BRIEF', 'Lite Stage 3 must target IMPLEMENTATION-BRIEF.');
targetFixture.state.stage = 9;
assert(stageTargets(targetFixture).join(',') === 'TASK', 'Lite Stage 9 primary target must be TASK; TASKS-INDEX remains optional.');
targetFixture.project.profile = 'Standard';
targetFixture.state.stage = 3;
assert(stageTargets(targetFixture).join(',') === 'DESIGN', 'Standard Stage 3 must target DESIGN.');

const resourceFixture = baseRecord({ stage: 4, status: 'In progress' });
resourceFixture.project.profile = 'Standard';
const specResources = stageResources(resourceFixture);
assert(
  specResources.required.some((resource) => resource.path === 'prompts/04-specification.md'),
  'Stage 4 resources must include the stage prompt.',
);
assert(
  specResources.required.some((resource) => resource.path === 'guidelines/SPEC.md'),
  'Stage 4 resources must include only its stage-specific writing guideline.',
);
assert(
  specResources.onDemand.some((resource) => resource.path === 'templates/SPEC.template.md'),
  'Stage 4 resources must expose the target template on demand.',
);
assert(
  ![...specResources.required, ...specResources.onDemand].some((resource) => resource.path === 'README.md' || resource.path === 'QUICKSTART.md' || resource.path?.startsWith('workflow/')),
  'Stage resources must not force broad workflow-document reads.',
);
assert(
  specResources.conditional[0].selectOneOf.some((resource) => resource.path === 'source-adapters/FIGMA.md'),
  'Conditional resources must expose adapter choices without requiring adapter discovery.',
);

const pinnedResourceFixture = structuredClone(resourceFixture);
pinnedResourceFixture.toolkit = {
  repository: 'ferfalcon/figma-to-implementation-workflow',
  revision: 'a'.repeat(40),
};
const pinnedResources = stageResources(pinnedResourceFixture);
const pinnedPrompt = pinnedResources.required.find((resource) => resource.kind === 'prompt');
assert(
  pinnedPrompt?.location?.scope === 'toolkit'
    && pinnedPrompt.location.revision === 'a'.repeat(40)
    && pinnedPrompt.location.path === 'prompts/04-specification.md',
  'Pinned stage resources must resolve to the exact toolkit revision and path.',
);
assert(
  pinnedResources.conditional[0].selectOneOf.every((resource) => resource.location?.revision === 'a'.repeat(40)),
  'Conditional adapter choices must resolve against the same pinned toolkit revision.',
);

const liteResourceFixture = baseRecord({ stage: 7, status: 'In progress' });
liteResourceFixture.project.profile = 'Lite';
const liteResources = stageResources(liteResourceFixture);
assert(
  liteResources.required.some((resource) => resource.path === 'guidelines/PLAN.md'),
  'Lite Stage 7 still needs plan guidance.',
);
assert(
  liteResources.onDemand.length === 1 && liteResources.onDemand[0].path === 'templates/IMPLEMENTATION-BRIEF.template.md',
  'Lite Stage 7 must return the consolidated brief template instead of unrelated plan templates.',
);

const directory = mkdtempSync(join(tmpdir(), 'design-workflow-orchestration-'));
const recordPath = join(directory, '.workflow', 'workflow-record.json');
try {
  const timestamp = '2026-08-12T12:00:00.000Z';
  const toolkitRevision = observedRuntimeToolkitPin()?.revision;
  assert(toolkitRevision, 'Orchestration fixture must resolve the executing toolkit revision.');
  const workpackContent = '# Workflow fixture\n';
  writeFileSync(join(directory, 'WORKPACK.md'), workpackContent, 'utf8');
  const workpackRevision = {
    algorithm: 'sha256',
    digest: createHash('sha256').update(workpackContent).digest('hex'),
  };
  const record = {
    schemaVersion: 2,
    project: { name: 'Express architecture fixture', profile: 'Express', executionMode: 'Gated' },
    toolkit: {
      repository: 'ferfalcon/figma-to-implementation-workflow',
      revision: toolkitRevision,
    },
    state: {
      stage: 6, status: 'Blocked', activeInputs: ['SRC-REPO-001'], currentTask: null,
      latestOutput: null, latestValidationRuntime: null,
      architectureDecision: { result: 'Required', reason: 'Architecture discovered', recordedAt: timestamp },
    },
    snapshots: [{
      id: 'SRC-REPO-001', role: 'Input baseline', pinStrength: 'Immutable', status: 'Active',
      reference: directory, commit: '1'.repeat(40),
    }],
    verifications: [{
      id: 'VER-001', snapshot: 'SRC-REPO-001', result: 'Unchanged', method: 'Fixture',
      evidence: 'Fixture source verified', checkedAt: timestamp,
    }],
    artifacts: [{
      id: 'ART-WORKPACK', type: 'WORKPACK', path: 'WORKPACK.md', status: 'Approved', baseline: ['SRC-REPO-001'],
      approvedRevision: workpackRevision,
    }],
    traceItems: [],
    gates: [],
    tasks: [], profileTransitions: [], implementationReviews: [],
  };
  for (let stage = 0; stage < 6; stage += 1) {
    record.gates.push({
      id: `GATE-${String(stage + 1).padStart(3, '0')}`,
      stage, status: 'Active', result: 'Passed', baseline: ['SRC-REPO-001'],
      verifications: ['VER-001'], artifacts: ['ART-WORKPACK'],
      artifactRevisions: [{ artifact: 'ART-WORKPACK', revision: workpackRevision }],
      evidence: `Stage ${stage} fixture`, recordedAt: timestamp, approvedBy: 'Fixture owner',
    });
  }
  syncGeneratedState(recordPath, record);
  const context = buildOrchestrationContext(recordPath, record, { cwd: directory });
  assert(context.protocolVersion === 2, 'Initialized context must advertise protocol version 2.');
  assert(context.project.root === '.', 'Initialized context must resolve the implementation project root separately.');
  assert(
    context.execution.resources.required.some((resource) => resource.path === 'prompts/06-architecture.md'),
    'Context payload must expose the stage-local required-resource manifest.',
  );
  assert(
    context.execution.resources.required.every((resource) => resource.location?.revision === toolkitRevision),
    'Required resources must resolve against the observed toolkit revision.',
  );
  assert(
    context.policy.workflowReads === 'context-resource-manifest-only',
    'Context payload must declare the minimal-read workflow policy.',
  );
  const result = checkStage(recordPath, record);
  assert(result.decision.recommendedResult === 'Must upgrade', 'Express architecture-required Stage 6 must recommend Must upgrade.');
  assert(result.decision.recordable, 'Must-upgrade decision should be structurally recordable.');
  assert(!result.advance.allowedNow, 'Must-upgrade Stage 6 must not permit advancement.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log('Agent orchestration context, profile-upgrade routing, minimal-read resources, toolkit resolution, action eligibility, and stage preflight tests passed.');
