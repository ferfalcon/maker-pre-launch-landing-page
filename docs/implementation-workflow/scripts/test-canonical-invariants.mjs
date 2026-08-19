#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWorkflowRecord } from './lib/validate-workflow-record.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDirectory, '..');
const base = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'workflow-record.migration.v2.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectFindings(label, mutate, fragments) {
  const record = structuredClone(base);
  mutate(record);
  const errors = validateWorkflowRecord(record);
  for (const fragment of fragments) {
    assert(
      errors.some((error) => error.includes(fragment)),
      `${label} did not report "${fragment}".\nActual findings:\n${errors.map((error) => `- ${error}`).join('\n')}`,
    );
  }
}

function passedValidation() {
  return {
    name: 'Build',
    kind: 'Build',
    required: true,
    status: 'Passed',
    expected: 'Production build succeeds',
    actual: 'Production build succeeded',
    executedAt: '2026-08-18T05:30:00Z',
    evidence: ['Build command exited successfully'],
    references: [],
  };
}

function addOutput(record, { status = 'Active' } = {}) {
  record.snapshots.push({
    id: 'SRC-REPO-002',
    role: 'Implementation output',
    pinStrength: 'Immutable',
    status,
    reference: '.',
    commit: '2222222222222222222222222222222222222222',
    parent: 'SRC-REPO-001',
    task: 'P01-T01',
  });
  record.tasks[0].status = 'Complete';
  record.tasks[0].output = 'SRC-REPO-002';
  record.tasks[0].validation = [passedValidation()];
  record.state.latestOutput = 'SRC-REPO-002';
}

expectFindings('Task-start shape', (record) => {
  record.snapshots.push({
    id: 'SRC-REPO-002',
    role: 'Task start',
    pinStrength: 'Time-bound',
    status: 'Active',
    reference: '.',
  });
}, [
  'Task start requires Immutable pin strength',
  'Task start requires a commit SHA',
  'Task start requires a parent repository snapshot',
  'Task start requires a task',
]);

expectFindings('Current task status', (record) => {
  record.state.currentTask = 'P01-T01';
}, ['current task P01-T01 must be In progress']);

expectFindings('Missing current task pointer', (record) => {
  record.tasks[0].status = 'In progress';
}, ['In progress task P01-T01 requires state.currentTask']);

expectFindings('Multiple active tasks', (record) => {
  record.tasks[0].status = 'In progress';
  record.state.currentTask = 'P01-T01';
  record.tasks.push({
    id: 'P01-T02',
    status: 'In progress',
    baseline: 'SRC-REPO-001',
    prerequisites: [],
    references: [],
    output: null,
    blocker: null,
    validation: [{
      name: 'Second build',
      kind: 'Build',
      required: true,
      status: 'Not executed',
      expected: 'Build succeeds',
      evidence: [],
      reason: 'Pending execution',
      references: [],
    }],
  });
}, ['multiple In progress tasks exist']);

expectFindings('Executable task baseline', (record) => {
  record.snapshots[0].role = 'Historical reference';
  record.snapshots[0].pinStrength = 'Time-bound';
}, [
  'is not an executable repository baseline',
  'must use Immutable pin strength',
]);

expectFindings('Inactive incomplete baseline', (record) => {
  record.snapshots.push({
    id: 'SRC-REPO-002',
    role: 'Input baseline',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: '.',
    commit: '2222222222222222222222222222222222222222',
  });
  record.snapshots[0].status = 'Superseded';
  record.snapshots[0].supersededBy = 'SRC-REPO-002';
  record.state.activeInputs = ['SRC-REPO-002'];
}, ['incomplete task P01-T01 requires an Active repository baseline']);

expectFindings('Task-start reciprocity', (record) => {
  record.snapshots.push({
    id: 'SRC-REPO-002',
    role: 'Task start',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: '.',
    commit: '2222222222222222222222222222222222222222',
    parent: 'SRC-REPO-001',
    task: 'P01-T01',
  });
}, ['Task start snapshot SRC-REPO-002 must equal task P01-T01 baseline']);

expectFindings('Output reciprocity', (record) => {
  record.snapshots.push({
    id: 'SRC-REPO-002',
    role: 'Implementation output',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: '.',
    commit: '2222222222222222222222222222222222222222',
    parent: 'SRC-REPO-001',
    task: 'P01-T01',
  });
}, ['Implementation output SRC-REPO-002 must equal task P01-T01 output']);

expectFindings('Latest output status', (record) => {
  addOutput(record, { status: 'Invalid' });
}, ['must reference an Active Implementation output snapshot']);

expectFindings('Latest output completion', (record) => {
  addOutput(record);
  record.tasks[0].status = 'Ready';
}, ['must be produced by a Complete task']);

expectFindings('Latest validation runtime lineage', (record) => {
  addOutput(record);
  record.snapshots.push({
    id: 'SRC-RUN-001',
    role: 'Validation runtime',
    pinStrength: 'Time-bound',
    status: 'Active',
    reference: 'local://preview',
  });
  record.state.latestValidationRuntime = 'SRC-RUN-001';
}, ['must parent latest output SRC-REPO-002']);

console.log('Canonical schema-v2 workflow invariant tests passed.');
