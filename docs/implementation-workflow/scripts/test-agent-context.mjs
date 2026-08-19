#!/usr/bin/env node

import {
  AGENT_PROTOCOL_VERSION,
  agentResourcesForContext,
  buildAgentContextWhenMissing,
  composeAgentContext,
} from '../cli/lib/agent-context.mjs';
import { runCli as runAgentCli } from '../cli/lib/agent-cli.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fixtureContext() {
  return {
    protocolVersion: 2,
    control: {
      mode: 'cli-managed', schemaVersion: 2, readOnly: false,
      record: '.workflow/workflow-record.json',
    },
    project: { name: 'Agent packet fixture', profile: 'Standard', executionMode: 'Gated', root: '.' },
    toolkit: {
      pinned: false, repository: null, revision: null,
      legacy: false, snapshot: null, ambiguous: false,
    },
    workflow: { valid: true, findings: [] },
    stage: {
      number: 4, name: 'Define testable behavior', status: 'In progress',
      architectureDecision: null,
    },
    execution: {
      kind: 'stage',
      prompt: 'prompts/04-specification.md',
      primaryArtifactTypes: ['SPEC'],
      artifacts: [{
        id: 'ART-SPEC', type: 'SPEC', path: 'SPEC.md', status: 'Draft', baseline: ['SRC-DS-001'],
      }],
      resources: {
        required: [
          { kind: 'prompt', path: 'prompts/04-specification.md', location: null },
          { kind: 'guideline', path: 'guidelines/SPEC.md', location: null },
        ],
        onDemand: [{
          kind: 'template', path: 'templates/SPEC.template.md', location: null,
          when: 'creating-or-restructuring-target-artifact',
        }],
        conditional: [{
          kind: 'source-adapter',
          when: 'source-inspection-requires-format-specific-guidance',
          selectOneOf: [{ format: 'figma', path: 'source-adapters/FIGMA.md', location: null }],
        }],
      },
      sourceAdapterPolicy: 'Select only the adapter matching the actual source.',
    },
    sources: {
      active: [{ id: 'SRC-DS-001', role: 'Input baseline', status: 'Active' }],
      latestOutput: null,
      latestValidationRuntime: null,
    },
    tasks: {
      current: { id: 'P01-T01', status: 'In progress' }, ready: [], nextReady: null,
    },
    profileTransition: null,
    stageCheck: { stage: { number: 4 }, decision: { recordable: false } },
    policy: {
      workflowMutation: 'allowed', implementation: 'forbidden', codeEdits: 'forbidden',
      stageDecision: 'human-approval-required', generatedViews: 'read-only-projections',
      workflowReads: 'context-resource-manifest-only',
    },
    nextAction: 'Complete SPEC.md and run stage check.',
  };
}

assert(AGENT_PROTOCOL_VERSION === 3, 'Materialized agent packet must use protocol v3.');

const context = fixtureContext();
const resources = agentResourcesForContext(context);
assert(resources.required.length === 2, 'Agent packet must materialize the canonical required-resource manifest.');
assert(resources.stagePrompt?.path === 'prompts/04-specification.md', 'Stage prompt must come from the context manifest.');
assert(
  resources.stagePrompt.resolution === 'embedded' && resources.stagePrompt.content.length > 100,
  'Matching runtime prompt must be embedded.',
);
assert(
  resources.guidance.length === 1 && resources.guidance[0].path === 'guidelines/SPEC.md',
  'Stage guidance must come from the context manifest.',
);
assert(resources.templates.length === 0, 'Registered target artifacts must not redundantly embed templates.');
assert(resources.conditional.length === 1, 'Conditional source-adapter choices must remain available without eager loading.');

const missingArtifactContext = structuredClone(context);
missingArtifactContext.execution.artifacts = [];
const missingArtifactResources = agentResourcesForContext(missingArtifactContext);
assert(missingArtifactResources.templates.length === 1, 'A missing target artifact must materialize its on-demand template.');
assert(
  missingArtifactResources.templates[0].path === 'templates/SPEC.template.md',
  'Missing SPEC artifact must select the manifest template.',
);

const pinnedContext = structuredClone(context);
pinnedContext.toolkit = {
  pinned: true,
  repository: 'ferfalcon/figma-to-implementation-workflow',
  revision: 'f'.repeat(40),
  legacy: false,
  snapshot: null,
  ambiguous: false,
};
for (const resource of [
  ...pinnedContext.execution.resources.required,
  ...pinnedContext.execution.resources.onDemand,
]) {
  resource.location = {
    scope: 'toolkit',
    repository: pinnedContext.toolkit.repository,
    revision: pinnedContext.toolkit.revision,
    path: resource.path,
  };
}
const pinnedResources = agentResourcesForContext(pinnedContext);
assert(pinnedResources.stagePrompt.content === null, 'A mismatched runtime must not embed unverified toolkit content.');
assert(
  pinnedResources.stagePrompt.resolution === 'pinned-source-required',
  'Pinned mismatch must require the exact pinned dependency.',
);
assert(
  pinnedResources.stagePrompt.source.revision === 'f'.repeat(40),
  'Pinned resource must expose the exact toolkit revision.',
);

const legacyContext = structuredClone(pinnedContext);
legacyContext.toolkit.legacy = true;
legacyContext.toolkit.snapshot = 'SRC-DOC-001';
const legacyResources = agentResourcesForContext(legacyContext);
assert(
  legacyResources.stagePrompt.resolution === 'migrate-toolkit-binding',
  'Legacy toolkit snapshot state must require migration before embedded execution.',
);

const repairContext = structuredClone(context);
repairContext.execution.kind = 'repair';
const repairResources = agentResourcesForContext(repairContext);
assert(
  repairResources.required.length === 0
    && repairResources.stagePrompt === null
    && repairResources.templates.length === 0,
  'Repair execution must withhold ordinary stage resources.',
);

const record = {
  state: { currentTask: 'P01-T01' },
  tasks: [{
    id: 'P01-T01', title: 'Implement card behavior', status: 'In progress',
    baseline: 'SRC-REPO-001', prerequisites: [], references: ['PLAN-001'],
    output: null, validation: [], customField: 'preserved',
  }],
};
const packet = composeAgentContext(context, record);
assert(packet.protocolVersion === AGENT_PROTOCOL_VERSION, 'Agent packet must use protocol v3.');
assert(packet.contextProtocolVersion === 2, 'Agent packet must expose the underlying context protocol v2.');
assert(packet.toolkit.pinned === false, 'Agent packet must preserve toolkit state.');
assert(packet.project.root === '.', 'Agent packet must preserve the resolved implementation project root.');
assert(
  packet.state.stage === 4 && packet.state.stageName === context.stage.name,
  'Agent packet must expose resolved stage state.',
);
assert(
  packet.policy.workflowReads === 'context-resource-manifest-only',
  'Agent packet must preserve minimal-read policy.',
);
assert(packet.task.current?.customField === 'preserved', 'Agent packet must preserve the full current task record.');
assert(packet.nextAction === context.nextAction, 'Agent packet must preserve the canonical next action.');

const missing = buildAgentContextWhenMissing(
  '/tmp/agent-packet/.workflow/workflow-record.json',
  { cwd: '/tmp/agent-packet' },
);
assert(
  missing.protocolVersion === AGENT_PROTOCOL_VERSION && !missing.initialized,
  'Missing-record packet must use protocol v3 and report uninitialized state.',
);
assert(missing.resources.stagePrompt?.path === 'prompts/00-intake.md', 'Initialization packet must embed the intake prompt.');
assert(missing.policy.codeEdits === 'forbidden', 'Initialization packet must forbid implementation edits.');
assert(missing.toolkit.revision === null, 'Initialization packet must use the dedicated toolkit revision shape.');

function captureStream() {
  let value = '';
  return {
    stream: { write(chunk) { value += String(chunk); } },
    value() { return value; },
  };
}

for (const args of [['agent-context', '--json'], ['context', '--agent', '--json']]) {
  const stdout = captureStream();
  const stderr = captureStream();
  const exitCode = await runAgentCli(args, {
    cwd: '/tmp/agent-packet-cli-missing', stdout: stdout.stream, stderr: stderr.stream,
  });
  assert(exitCode === 0, `${args.join(' ')} must succeed for an uninitialized project.`);
  assert(stderr.value() === '', `${args.join(' ')} must not write an initialization error.`);
  const cliPacket = JSON.parse(stdout.value());
  assert(
    cliPacket.protocolVersion === AGENT_PROTOCOL_VERSION && !cliPacket.initialized,
    `${args.join(' ')} must emit the protocol-v3 initialization packet.`,
  );
}

console.log('Agent packet materialization, toolkit-binding integrity, protocol, and CLI routing tests passed.');
