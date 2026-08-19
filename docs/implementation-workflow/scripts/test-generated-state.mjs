#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  GENERATED_STATE_FILES,
  generatedStateFindings,
  syncGeneratedState,
  workflowRecordDigest,
} from '../cli/lib/generated-state.mjs';

function gitBlobSha(record) {
  const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`, 'utf8');
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(bytes).digest('hex');
}

const project = mkdtempSync(join(tmpdir(), 'design-workflow-state-'));
const recordPath = join(project, '.workflow', 'workflow-record.json');
const record = {
  schemaVersion: 1,
  project: {
    name: 'Generated state fixture',
    profile: 'Express',
    executionMode: 'Gated',
  },
  state: {
    stage: 0,
    status: 'In progress',
    activeInputs: ['SRC-DS-001'],
    currentTask: null,
    latestOutput: null,
  },
  snapshots: [{
    id: 'SRC-DS-001',
    role: 'Input baseline',
    pinStrength: 'Time-bound',
    status: 'Active',
    reference: 'Figma fixture',
  }],
  artifacts: [{
    id: 'ART-WORKPACK',
    type: 'WORKPACK',
    status: 'Draft',
    baseline: ['SRC-DS-001'],
  }],
  tasks: [],
};

try {
  const first = syncGeneratedState(recordPath, record);
  if (first.updated.length !== GENERATED_STATE_FILES.length) {
    throw new Error('Initial sync did not create every generated state view');
  }

  for (const name of GENERATED_STATE_FILES) {
    const path = join(project, '.workflow', 'generated', name);
    if (!existsSync(path)) throw new Error(`Missing generated view: ${name}`);
    const content = readFileSync(path, 'utf8');
    if (!content.includes('Do not edit manually')) {
      throw new Error(`${name} is missing its generated-file warning`);
    }
  }

  const projectionPath = join(project, '.workflow', 'generated', 'AGENT-CONTEXT.json');
  const projection = JSON.parse(readFileSync(projectionPath, 'utf8'));
  if (projection.generated.projectionVersion !== 4) {
    throw new Error('Agent context projection must expose projection version 4');
  }
  if (projection.generated.recordSha256 !== workflowRecordDigest(record)) {
    throw new Error('Agent context projection must identify the exact canonical record digest');
  }
  if (projection.generated.recordGitBlobSha !== gitBlobSha(record)) {
    throw new Error('Agent context projection must expose the GitHub-verifiable workflow-record blob SHA');
  }
  if (projection.state.executionKind !== 'migration') {
    throw new Error('Schema-v1 agent projection must route to migration');
  }
  if (projection.policy.workflowMutation !== 'migration-required-via-cli') {
    throw new Error('Portable projection must never authorize manual workflow mutation');
  }
  if (
    projection.policy.stageTransition.decisionAuthority !== 'not-applicable'
    || projection.policy.stageTransition.preflight.blocker !== 'migration-required'
    || projection.policy.stageTransition.execution.blocker !== 'migration-required'
  ) {
    throw new Error('Schema-v1 projection must block stage-transition authority and capability behind migration');
  }
  if (projection.resources.required[0]?.path !== 'prompts/00-intake.md') {
    throw new Error('Agent context projection must reuse canonical stage resource routing');
  }
  if (JSON.stringify(projection.resources).includes('"content"')) {
    throw new Error('Portable projection must not embed toolkit resource bodies');
  }

  const reordered = {
    tasks: record.tasks,
    artifacts: record.artifacts,
    snapshots: record.snapshots,
    state: record.state,
    project: record.project,
    schemaVersion: record.schemaVersion,
  };
  if (workflowRecordDigest(record) !== workflowRecordDigest(reordered)) {
    throw new Error('Record digest changed when only object key order changed');
  }
  if (gitBlobSha(record) === gitBlobSha(reordered)) {
    throw new Error('Git blob identity did not change when exact serialized record bytes changed');
  }

  const current = syncGeneratedState(recordPath, record, { check: true });
  if (!current.current || current.stale.length !== 0) {
    throw new Error('Fresh generated views were reported as stale');
  }

  record.state.stage = 1;
  const findings = generatedStateFindings(recordPath, record);
  if (findings.length !== GENERATED_STATE_FILES.length) {
    throw new Error('A record mutation did not invalidate every generated view');
  }

  const repaired = syncGeneratedState(recordPath, record);
  if (repaired.updated.length !== GENERATED_STATE_FILES.length) {
    throw new Error('Sync did not repair every stale generated view');
  }

  const statusPath = join(
    project,
    '.workflow',
    'generated',
    'WORKFLOW-STATUS.md',
  );
  writeFileSync(
    statusPath,
    `${readFileSync(statusPath, 'utf8')}manual edit\n`,
    'utf8',
  );
  const manualEdit = generatedStateFindings(recordPath, record);
  if (manualEdit.length !== 1 || !manualEdit[0].includes('WORKFLOW-STATUS.md')) {
    throw new Error('Manual generated-file edits were not detected precisely');
  }

  const malformed = generatedStateFindings(recordPath, {
    schemaVersion: 1,
    project: {},
  });
  if (malformed.length !== 1 || !malformed[0].includes('could not be evaluated')) {
    throw new Error('Malformed record did not produce a controlled state finding');
  }

  console.log('Generated workflow state and portable agent context tests passed.');
} finally {
  rmSync(project, { recursive: true, force: true });
}
