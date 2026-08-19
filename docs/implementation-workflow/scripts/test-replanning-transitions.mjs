#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const cwd = mkdtempSync(join(tmpdir(), 'design-workflow-replanning-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: '/tmp' },
  });
  if (result.status !== expectedStatus) {
    throw new Error([
      `Command failed: design-workflow ${args.join(' ')}`,
      `Expected ${expectedStatus}, received ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function git(args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function record() {
  return JSON.parse(readFileSync(join(cwd, '.workflow', 'workflow-record.json'), 'utf8'));
}

function passAndAdvance(stage) {
  run(['stage', 'review', '--result', 'Passed', '--evidence', `Stage ${stage} ready`, '--approved-by', 'Fixture owner']);
  run(['stage', 'advance']);
}

function setPassedBuild() {
  run([
    'task', 'validation', 'set', 'P01-T01',
    '--name', 'Build', '--kind', 'Build', '--required', 'true', '--status', 'Passed',
    '--expected', 'Build succeeds', '--actual', 'Build passed during current implementation attempt',
    '--executed-at', '2026-08-18T05:50:00Z', '--evidence', 'Fixture build passed',
  ]);
}

try {
  git(['init']);
  git(['config', 'user.email', 'fixture@example.com']);
  git(['config', 'user.name', 'Fixture']);
  git(['branch', '-M', 'main']);
  writeFileSync(join(cwd, 'seed.txt'), 'baseline\n', 'utf8');
  git(['add', 'seed.txt']);
  git(['commit', '-m', 'Create baseline']);

  run(['init', '--name', 'Replanning fixture', '--profile', 'Express', '--repository', '.']);
  run(['snapshot', 'verify', 'SRC-REPO-001', '--result', 'Unchanged', '--method', 'Git', '--evidence', 'Baseline matched']);
  run(['artifact', 'review', 'ART-WORKPACK', '--evidence', 'Workpack reviewed']);
  run(['artifact', 'approve', 'ART-WORKPACK', '--evidence', 'Workpack approved', '--approved-by', 'Fixture owner']);
  passAndAdvance(0);
  for (let stage = 1; stage <= 5; stage += 1) passAndAdvance(stage);
  run(['architecture', 'decide', 'not-required', '--reason', 'No architecture required for fixture']);
  passAndAdvance(6);
  passAndAdvance(7);
  passAndAdvance(8);

  run(['task', 'create', '--title', 'Implement fixture']);
  run([
    'task', 'validation', 'set', 'P01-T01', '--name', 'Build', '--kind', 'Build',
    '--required', 'true', '--status', 'Not executed', '--expected', 'Build succeeds',
    '--reason', 'Pending implementation',
  ]);
  run(['task', 'ready', 'P01-T01']);
  run(['stage', 'review', '--result', 'Passed', '--evidence', 'Task ready', '--approved-by', 'Fixture owner']);

  git(['add', '.']);
  git(['commit', '-m', 'Approve task plan']);
  run(['stage', 'advance']);
  run(['task', 'start', 'P01-T01']);
  const firstStartId = record().tasks[0].baseline;
  setPassedBuild();

  run(['stage', 'rewind', '8', '--reason', 'Implementation exposed a planning issue']);
  let current = record();
  assert(current.state.stage === 8, 'rewind did not move to Stage 8');
  assert(current.state.currentTask === null, 'rewind retained currentTask');
  assert(current.tasks[0].status === 'Ready', 'rewind did not reset current task to Ready');
  assert(current.tasks[0].validation[0].status === 'Not executed', 'rewind did not invalidate execution validation');
  assert(!current.tasks[0].validation[0].actual && !current.tasks[0].validation[0].executedAt, 'rewind retained stale execution metadata');
  assert(current.tasks[0].validation[0].evidence.length === 0, 'rewind retained stale validation evidence');
  run(['validate']);

  git(['add', '.workflow']);
  git(['commit', '-m', 'Record replanning state']);
  passAndAdvance(8);
  run(['stage', 'review', '--result', 'Passed', '--evidence', 'Task remains ready after replanning', '--approved-by', 'Fixture owner']);
  run(['stage', 'advance']);
  run(['task', 'start', 'P01-T01']);
  current = record();
  const secondStartId = current.tasks[0].baseline;
  assert(secondStartId !== firstStartId, 'restart did not capture a fresh Task-start checkpoint');
  const firstStart = current.snapshots.find((snapshot) => snapshot.id === firstStartId);
  const secondStart = current.snapshots.find((snapshot) => snapshot.id === secondStartId);
  assert(firstStart?.role === 'Historical reference' && firstStart.status === 'Superseded', 'previous Task start was not preserved as superseded history');
  assert(firstStart.supersededBy === secondStartId, 'previous Task start does not point to replacement checkpoint');
  assert(secondStart?.role === 'Task start' && secondStart.task === 'P01-T01', 'restart checkpoint is not attributed to the task');
  run(['validate']);

  setPassedBuild();
  run([
    'profile', 'upgrade', 'start', 'Standard', '--resume-stage', '8',
    '--reason', 'Implementation exposed broader planning scope',
  ]);
  current = record();
  assert(current.project.profile === 'Standard', 'profile upgrade did not select Standard');
  assert(current.state.stage === 8 && current.state.status === 'Blocked', 'profile upgrade did not return to blocked Stage 8 reconciliation');
  assert(current.state.currentTask === null, 'profile upgrade retained currentTask');
  assert(current.tasks[0].status === 'Ready', 'profile upgrade did not reset current task to Ready');
  assert(current.tasks[0].validation[0].status === 'Not executed', 'profile upgrade did not invalidate execution validation');
  assert(!current.tasks[0].validation[0].actual && !current.tasks[0].validation[0].executedAt, 'profile upgrade retained stale execution metadata');
  assert(current.tasks[0].validation[0].evidence.length === 0, 'profile upgrade retained stale validation evidence');
  assert(current.profileTransitions.some((transition) => transition.status === 'In progress'), 'profile upgrade transition was not recorded');
  run(['validate']);

  console.log('Rewind, task restart, historical checkpoint, and profile-upgrade replanning tests passed.');
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
