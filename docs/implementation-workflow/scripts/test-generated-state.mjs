#!/usr/bin/env node

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

  console.log('Generated workflow state tests passed.');
} finally {
  rmSync(project, { recursive: true, force: true });
}
