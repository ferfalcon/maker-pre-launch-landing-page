#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { buildAgentProjection } from '../cli/lib/agent-projection.mjs';
import { stageTransitionPolicy } from '../cli/lib/stage-transition-policy.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitBlobSha(record) {
  const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`, 'utf8');
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(bytes).digest('hex');
}

const record = JSON.parse(readFileSync(
  new URL('../tests/fixtures/workflow-record.migration.v2.json', import.meta.url),
  'utf8',
));
const digest = 'd'.repeat(64);
const recordPath = '/tmp/portable-agent/.workflow/workflow-record.json';

const projection = buildAgentProjection(recordPath, record, digest);
assert(projection.generated.projectionVersion === 4, 'Portable projection must expose version 4.');
assert(projection.generated.recordSha256 === digest, 'Portable projection must identify the canonical record digest.');
assert(
  projection.generated.recordGitBlobSha === gitBlobSha(record),
  'Portable projection must expose the Git blob SHA for the exact workflow-record serialization.',
);
assert(/^[0-9a-f]{40}$/.test(projection.generated.recordGitBlobSha), 'Record Git blob SHA must be a 40-character Git SHA.');
assert(projection.workflow.recordValidAtGeneration, 'Schema-v2 fixture must be valid at projection time.');
assert(projection.workflow.runtimeIntegrity === 'not-evaluated-in-portable-projection', 'Portable projection must not imply runtime integrity.');
assert(projection.state.stage === 9 && projection.state.executionKind === 'task-decomposition', 'Stage 9 must route to task decomposition.');
assert(projection.task.current === null, 'Ready Stage 9 task must not be reported as current.');
assert(projection.task.nextReady === 'P01-T01', 'Portable projection must expose the next Ready task.');
assert(projection.policy.workflowMutation === 'cli-required', 'Healthy schema-v2 projection must keep workflow mutations CLI-owned.');
assert(projection.policy.implementationAuthorization === 'forbidden', 'Stage 9 projection must not authorize implementation.');
assert(projection.policy.implementationIntegrity === 'not-applicable', 'Forbidden implementation must not imply a pending integrity check.');
assert(projection.policy.codeEdits === 'forbidden', 'Stage 9 projection must forbid implementation edits.');
assert(!('stageDecision' in projection.policy), 'Portable projection must not expose the ambiguous legacy stageDecision field.');
assert(!('stagePreflight' in projection.policy), 'Portable projection must not expose the ambiguous legacy stagePreflight field.');
assert(
  projection.policy.stageTransition.decisionAuthority === 'human-required',
  'Gated portable projection must report human decision authority independently from execution capability.',
);
assert(
  projection.policy.stageTransition.preflight.required
    && !projection.policy.stageTransition.preflight.availableHere
    && projection.policy.stageTransition.preflight.blocker === 'cli-unavailable-in-current-environment',
  'Portable preflight must be required while explicitly unavailable without the CLI.',
);
assert(
  !projection.policy.stageTransition.execution.availableHere
    && projection.policy.stageTransition.execution.blocker === 'cli-unavailable-in-current-environment',
  'Portable transition execution must report the CLI capability blocker independently from authority.',
);
assert(
  projection.resources.required.some((resource) => resource.path === 'prompts/09-task-decomposition.md'),
  'Projection must reuse canonical Stage 9 prompt routing.',
);
assert(!JSON.stringify(projection.resources).includes('"content"'), 'Portable projection must not embed toolkit resource bodies.');

const stageTen = structuredClone(record);
stageTen.state.stage = 10;
stageTen.state.status = 'In progress';
stageTen.state.currentTask = 'P01-T01';
stageTen.tasks[0].status = 'In progress';
stageTen.gates.push({
  id: 'GATE-001',
  stage: 9,
  status: 'Active',
  result: 'Passed',
  baseline: ['SRC-REPO-001'],
  verifications: [],
  artifacts: ['ART-WORKPACK'],
  evidence: 'Stage 9 task decomposition approved for implementation.',
  recordedAt: '2026-08-19T05:00:00.000Z',
  approvedBy: 'Fixture owner',
});
const stageTenProjection = buildAgentProjection(recordPath, stageTen, digest);
assert(stageTenProjection.workflow.recordValidAtGeneration, 'Stage 10 authorization fixture must remain structurally valid.');
assert(stageTenProjection.state.executionKind === 'implementation-task', 'Stage 10 fixture must route to implementation.');
assert(stageTenProjection.task.current?.id === 'P01-T01', 'Stage 10 projection must expose the current in-progress task.');
assert(
  stageTenProjection.policy.implementationAuthorization === 'current-task-authorized',
  'Portable Stage 10 projection must identify persisted current-task authorization separately from integrity.',
);
assert(
  stageTenProjection.policy.implementationIntegrity === 'runtime-verification-required-before-editing',
  'Portable Stage 10 authorization must require a runtime/source integrity check before implementation edits.',
);
assert(
  stageTenProjection.policy.codeEdits === 'allowed-after-source-integrity-check'
    && stageTenProjection.policy.implementation === 'allowed-after-source-integrity-check',
  'Portable Stage 10 code-edit policy must remain conditional until runtime/source integrity is verified.',
);
assert(
  stageTenProjection.workflow.runtimeIntegrity === 'not-evaluated-in-portable-projection',
  'Conditional code-edit authorization must never upgrade portable runtime integrity.',
);

const reordered = Object.fromEntries(Object.entries(record).reverse());
const reorderedProjection = buildAgentProjection(recordPath, reordered, digest);
assert(
  reorderedProjection.generated.recordGitBlobSha !== projection.generated.recordGitBlobSha,
  'Git blob identity must change when the exact serialized workflow-record bytes change.',
);

const continuous = structuredClone(record);
continuous.project.executionMode = 'Continuous documentation';
const continuousProjection = buildAgentProjection(recordPath, continuous, digest);
assert(
  continuousProjection.policy.stageTransition.decisionAuthority === 'agent-permitted',
  'Non-Gated portable projection must report agent decision authority without implying transition executability.',
);
assert(
  !continuousProjection.policy.stageTransition.execution.availableHere,
  'Agent decision authority must not imply that the portable environment can execute the transition.',
);

const pinned = structuredClone(record);
pinned.toolkit = {
  repository: 'ferfalcon/figma-to-implementation-workflow',
  revision: 'a'.repeat(40),
};
const pinnedProjection = buildAgentProjection(recordPath, pinned, digest);
assert(
  pinnedProjection.resources.required.every((resource) => resource.location?.revision === 'a'.repeat(40)),
  'Required resources must resolve to the exact pinned toolkit revision.',
);
assert(
  pinnedProjection.resources.conditional[0].selectOneOf.every((resource) => resource.location?.revision === 'a'.repeat(40)),
  'Conditional adapters must resolve to the same pinned toolkit revision.',
);
assert(
  pinnedProjection.policy.toolkitReads === 'exact-pinned-source-only',
  'Pinned portable routing must prohibit mutable toolkit fallback.',
);

const invalid = structuredClone(record);
delete invalid.project.name;
const invalidProjection = buildAgentProjection(recordPath, invalid, digest);
assert(!invalidProjection.workflow.recordValidAtGeneration, 'Invalid record must be reported as invalid at generation.');
assert(invalidProjection.policy.workflowMutation === 'repair-required-via-cli', 'Invalid projection must route workflow mutation to CLI repair.');
assert(invalidProjection.policy.implementationAuthorization === 'forbidden', 'Invalid projection must revoke implementation authorization.');
assert(invalidProjection.policy.implementationIntegrity === 'not-applicable', 'Invalid projection must not expose an implementation integrity prerequisite.');
assert(invalidProjection.policy.codeEdits === 'forbidden', 'Invalid projection must forbid implementation edits.');
assert(
  invalidProjection.policy.stageTransition.decisionAuthority === 'not-applicable'
    && invalidProjection.policy.stageTransition.preflight.blocker === 'repair-required'
    && invalidProjection.policy.stageTransition.execution.blocker === 'repair-required',
  'Invalid records must block stage-transition authority, preflight, and execution behind repair.',
);

const migrationPolicy = stageTransitionPolicy(
  { schemaVersion: 1, project: { executionMode: 'Gated' } },
  { workflowValid: false, cliAvailable: false },
);
assert(
  migrationPolicy.decisionAuthority === 'not-applicable'
    && migrationPolicy.preflight.blocker === 'migration-required'
    && migrationPolicy.execution.blocker === 'migration-required',
  'Schema-v1 records must block stage-transition authority and capability behind migration.',
);

console.log('Portable agent projection routing, authorization/integrity separation, pinning, transition-policy separation, mutation boundary, freshness identity, and integrity tests passed.');
