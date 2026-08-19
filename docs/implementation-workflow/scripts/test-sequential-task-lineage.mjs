#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observedRuntimeToolkitPin } from '../cli/lib/toolkit-binding.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const cwd = mkdtempSync(join(tmpdir(), 'design-workflow-lineage-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function git(args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
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

function workflowRecord() {
  return JSON.parse(readFileSync(join(cwd, '.workflow', 'workflow-record.json'), 'utf8'));
}

function validation() {
  return [{
    name: 'Build',
    kind: 'Build',
    required: true,
    status: 'Not executed',
    expected: 'Build succeeds',
    evidence: [],
    reason: 'Pending implementation',
    references: [],
  }];
}

function task(id, prerequisites = []) {
  return {
    id,
    status: 'Ready',
    baseline: 'SRC-REPO-001',
    prerequisites,
    references: [],
    output: null,
    blocker: null,
    validation: validation(),
  };
}

function artifactContent(type) {
  return `# ${type}\n`;
}

function artifact(type) {
  const content = artifactContent(type);
  return {
    id: `ART-${type}`,
    type,
    path: `${type}.md`,
    status: 'Approved',
    baseline: ['SRC-REPO-001'],
    approvedRevision: {
      algorithm: 'sha256',
      digest: createHash('sha256').update(content).digest('hex'),
    },
  };
}

try {
  git(['init']);
  git(['config', 'user.email', 'fixture@example.com']);
  git(['config', 'user.name', 'Fixture']);
  git(['branch', '-M', 'main']);
  writeFileSync(join(cwd, 'seed.txt'), 'baseline\n', 'utf8');
  git(['add', 'seed.txt']);
  git(['commit', '-m', 'Create baseline']);
  const inputCommit = git(['rev-parse', 'HEAD']);
  const toolkit = observedRuntimeToolkitPin();
  assert(toolkit, 'Sequential-lineage fixture must resolve the executing toolkit identity.');

  mkdirSync(join(cwd, '.workflow'), { recursive: true });
  const record = {
    schemaVersion: 2,
    project: {
      name: 'Sequential lineage fixture',
      profile: 'Standard',
      executionMode: 'Gated',
    },
    toolkit: {
      repository: toolkit.repository,
      revision: toolkit.revision,
    },
    state: {
      stage: 10,
      status: 'Ready',
      activeInputs: ['SRC-REPO-001'],
      currentTask: null,
      latestOutput: null,
      latestValidationRuntime: null,
      architectureDecision: {
        result: 'Not required',
        reason: 'Fixture has no architecture decision requirement.',
        recordedAt: '2026-08-18T00:00:00.000Z',
      },
    },
    snapshots: [{
      id: 'SRC-REPO-001',
      role: 'Input baseline',
      pinStrength: 'Immutable',
      status: 'Active',
      reference: cwd,
      commit: inputCommit,
    }],
    verifications: [],
    artifacts: [
      'SOURCE-BASELINE',
      'PROJECT-CONTEXT',
      'WORKFLOW-STATE',
      'DESIGN-AUDIT',
      'REQUIREMENTS',
      'DESIGN',
      'SPEC',
      'DOCUMENT-REVIEW',
      'PLAN',
      'PLAN-REVIEW',
      'TASKS-INDEX',
    ].map(artifact),
    traceItems: [],
    gates: [],
    tasks: [
      task('P01-T01'),
      task('P01-T02', ['P01-T01']),
      task('P01-T03', ['P01-T02']),
    ],
    profileTransitions: [],
    implementationReviews: [],
    legacyBoundary: {
      migratedFrom: 1,
      gatesRequiredFromStage: 10,
      traceRequiredFromStage: 10,
    },
  };
  writeFileSync(
    join(cwd, '.workflow', 'workflow-record.json'),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf8',
  );
  for (const item of record.artifacts) {
    writeFileSync(join(cwd, item.path), artifactContent(item.type), 'utf8');
  }
  run(['sync']);
  run(['validate']);
  git(['add', '.']);
  git(['commit', '-m', 'Record approved planning state']);
  const planningCommit = git(['rev-parse', 'HEAD']);

  run(['task', 'start', 'P01-T01']);
  let current = workflowRecord();
  const firstStart = current.snapshots.find((snapshot) => snapshot.id === current.tasks[0].baseline);
  assert(firstStart?.role === 'Task start', 'First task did not capture an exact task-start snapshot.');
  assert(firstStart.commit === planningCommit, 'First task-start snapshot did not pin the actual planning HEAD.');
  assert(firstStart.parent === 'SRC-REPO-001', 'First task-start snapshot did not retain the input-baseline parent.');

  writeFileSync(join(cwd, 'first.txt'), 'first task\n', 'utf8');
  git(['add', 'first.txt']);
  git(['commit', '-m', 'Implement first task']);
  const firstCommit = git(['rev-parse', 'HEAD']);
  run(['task', 'complete', 'P01-T01', '--commit', firstCommit, '--check', 'Build=First build passed']);
  current = workflowRecord();
  const firstOutput = current.tasks[0].output;
  assert(firstOutput, 'First task did not record an output snapshot.');
  assert(
    current.snapshots.find((snapshot) => snapshot.id === firstOutput)?.parent === current.tasks[0].baseline,
    'First output does not descend from the exact first task-start checkpoint.',
  );

  run(['task', 'start', 'P01-T02']);
  current = workflowRecord();
  assert(
    current.tasks[1].baseline === firstOutput,
    'Second task did not adopt the latest approved implementation output as its task-start baseline.',
  );
  assert(
    current.snapshots.find((snapshot) => snapshot.id === firstOutput)?.commit === firstCommit,
    'Second task baseline does not identify the current HEAD commit.',
  );

  writeFileSync(join(cwd, 'second.txt'), 'second task\n', 'utf8');
  git(['add', 'second.txt']);
  git(['commit', '-m', 'Implement second task']);
  const secondCommit = git(['rev-parse', 'HEAD']);
  run(['task', 'complete', 'P01-T02', '--commit', secondCommit, '--check', 'Build=Second build passed']);
  current = workflowRecord();
  const secondOutput = current.tasks[1].output;
  assert(secondOutput, 'Second task did not record an output snapshot.');
  assert(
    current.snapshots.find((snapshot) => snapshot.id === secondOutput)?.parent === firstOutput,
    'Second output parent is not the first task implementation output.',
  );

  writeFileSync(join(cwd, 'concurrent.txt'), 'unexpected concurrent change\n', 'utf8');
  git(['add', 'concurrent.txt']);
  git(['commit', '-m', 'Unexpected concurrent change']);
  const beforeRejectedStart = readFileSync(join(cwd, '.workflow', 'workflow-record.json'));
  const rejected = run(['task', 'start', 'P01-T03'], 1);
  assert(
    rejected.stderr.includes('implementation-scope paths before task start')
      && rejected.stderr.includes('concurrent.txt'),
    'Unexpected committed implementation change was not explained by the task-start checkpoint policy.',
  );
  assert(
    Buffer.compare(beforeRejectedStart, readFileSync(join(cwd, '.workflow', 'workflow-record.json'))) === 0,
    'Rejected concurrent-change task start mutated the workflow record.',
  );

  console.log('Sequential task lineage, exact task-start checkpoints, and unexpected-change rejection tests passed.');
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
