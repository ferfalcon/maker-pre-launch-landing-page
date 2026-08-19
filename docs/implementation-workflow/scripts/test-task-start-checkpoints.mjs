#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveTaskStartBaseline } from '../cli/lib/task-lineage.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrow(action, fragment) {
  try {
    action();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(fragment), `Unexpected error: ${error}`);
    return;
  }
  throw new Error(`Expected error containing "${fragment}".`);
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

const cwd = mkdtempSync(join(tmpdir(), 'design-workflow-checkpoint-'));
const recordPath = join(cwd, '.workflow', 'workflow-record.json');

try {
  git(cwd, ['init']);
  git(cwd, ['config', 'user.email', 'fixture@example.com']);
  git(cwd, ['config', 'user.name', 'Fixture']);
  writeFileSync(join(cwd, 'seed.txt'), 'baseline\n', 'utf8');
  git(cwd, ['add', 'seed.txt']);
  git(cwd, ['commit', '-m', 'Create baseline']);
  const baselineCommit = git(cwd, ['rev-parse', 'HEAD']);
  mkdirSync(join(cwd, '.workflow'), { recursive: true });

  const task1 = { id: 'P01-T01', baseline: 'SRC-REPO-001' };
  const task2 = { id: 'P01-T02', baseline: 'SRC-REPO-001' };
  const task3 = { id: 'P01-T03', baseline: 'SRC-REPO-001' };
  const task4 = { id: 'P01-T04', baseline: 'SRC-REPO-001' };
  const record = {
    state: { latestOutput: null },
    snapshots: [{
      id: 'SRC-REPO-001',
      role: 'Input baseline',
      pinStrength: 'Immutable',
      status: 'Active',
      reference: cwd,
      commit: baselineCommit,
    }],
    artifacts: [{
      id: 'ART-PLAN', type: 'PLAN', path: 'PLAN.md', status: 'Approved', baseline: ['SRC-REPO-001'],
    }],
    tasks: [task1, task2, task3, task4],
  };

  writeFileSync(join(cwd, 'PLAN.md'), '# Approved plan\n', 'utf8');
  git(cwd, ['add', 'PLAN.md']);
  git(cwd, ['commit', '-m', 'Approve implementation plan']);
  const planningCommit = git(cwd, ['rev-parse', 'HEAD']);

  const firstStart = resolveTaskStartBaseline(recordPath, record, task1);
  assert(firstStart.createdSnapshot, 'First task did not capture the committed planning checkpoint.');
  const firstStartSnapshot = record.snapshots.find((snapshot) => snapshot.id === task1.baseline);
  assert(firstStartSnapshot?.role === 'Task start', 'First task baseline is not a Task start snapshot.');
  assert(firstStartSnapshot?.commit === planningCommit, 'First task start did not pin the actual planning HEAD.');
  assert(firstStartSnapshot?.parent === 'SRC-REPO-001', 'First task start does not descend from the input baseline.');

  writeFileSync(join(cwd, 'implementation.txt'), 'task one\n', 'utf8');
  git(cwd, ['add', 'implementation.txt']);
  git(cwd, ['commit', '-m', 'Implement task one']);
  const outputCommit = git(cwd, ['rev-parse', 'HEAD']);
  record.snapshots.push({
    id: 'SRC-REPO-003',
    role: 'Implementation output',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: cwd,
    commit: outputCommit,
    parent: task1.baseline,
    task: task1.id,
  });
  record.state.latestOutput = 'SRC-REPO-003';

  writeFileSync(recordPath, '{"control":"updated"}\n', 'utf8');
  git(cwd, ['add', '.workflow/workflow-record.json']);
  git(cwd, ['commit', '-m', 'Record task one workflow state']);
  const controlCommit = git(cwd, ['rev-parse', 'HEAD']);

  const secondStart = resolveTaskStartBaseline(recordPath, record, task2);
  assert(secondStart.createdSnapshot, 'Second task did not capture the workflow-control checkpoint.');
  const secondStartSnapshot = record.snapshots.find((snapshot) => snapshot.id === task2.baseline);
  assert(secondStartSnapshot?.commit === controlCommit, 'Second task start did not pin the workflow-control HEAD.');
  assert(secondStartSnapshot?.parent === 'SRC-REPO-003', 'Second task start does not descend from the prior implementation output.');

  writeFileSync(join(cwd, 'transient.js'), 'export const transient = true;\n', 'utf8');
  git(cwd, ['add', 'transient.js']);
  git(cwd, ['commit', '-m', 'Add transient implementation change']);
  const transientCommit = git(cwd, ['rev-parse', 'HEAD']);
  git(cwd, ['revert', '--no-edit', transientCommit]);
  writeFileSync(recordPath, '{"control":"updated-again"}\n', 'utf8');
  git(cwd, ['add', '.workflow/workflow-record.json']);
  git(cwd, ['commit', '-m', 'Record additional workflow state']);

  expectThrow(
    () => resolveTaskStartBaseline(recordPath, record, task3),
    'implementation-scope paths before task start',
  );
  assert(task3.baseline === 'SRC-REPO-001', 'Reverted-history rejection mutated the task baseline.');

  git(cwd, ['reset', '--hard', controlCommit]);
  writeFileSync(join(cwd, 'unexpected.js'), 'export const unexpected = true;\n', 'utf8');
  git(cwd, ['add', 'unexpected.js']);
  git(cwd, ['commit', '-m', 'Unexpected implementation change']);
  expectThrow(
    () => resolveTaskStartBaseline(recordPath, record, task4),
    'implementation-scope paths before task start',
  );
  assert(task4.baseline === 'SRC-REPO-001', 'Rejected task start mutated the task baseline.');

  console.log('Task-start planning, control-checkpoint, full-history, and unexpected-change tests passed.');
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
