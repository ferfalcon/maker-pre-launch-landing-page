#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observedRuntimeToolkitPin, toolkitBindingFromRecord } from '../cli/lib/toolkit-binding.mjs';
import { validateWorkflowRecord } from './lib/validate-workflow-record.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const projects = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function project(name) {
  const path = mkdtempSync(join(tmpdir(), `design-workflow-toolkit-${name}-`));
  projects.push(path);
  return path;
}

function run(cwd, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: '/tmp' },
  });
  if (result.status !== expectedStatus) {
    throw new Error([
      `Command failed: design-workflow ${args.join(' ')}`,
      `Expected ${expectedStatus}, received ${result.status}`,
      result.stdout, result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function recordPath(cwd) {
  return join(cwd, '.workflow', 'workflow-record.json');
}

function record(cwd) {
  return JSON.parse(readFileSync(recordPath(cwd), 'utf8'));
}

function writeRecord(cwd, value) {
  writeFileSync(recordPath(cwd), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const runtimeToolkit = observedRuntimeToolkitPin();
const revisionA = runtimeToolkit?.revision;
const revisionB = revisionA === 'b'.repeat(40) ? 'c'.repeat(40) : 'b'.repeat(40);
const repository = runtimeToolkit?.repository ?? 'ferfalcon/figma-to-implementation-workflow';

try {
  assert(revisionA, 'Toolkit source tests must resolve the executing toolkit revision.');

  const missing = project('missing');
  const missingContext = JSON.parse(run(missing, ['context', '--json']).stdout);
  assert(missingContext.initialized === false, 'Missing-project context must remain uninitialized.');
  assert(missingContext.project.root === '.', 'Missing-project context must expose the implementation workspace separately.');
  assert(missingContext.toolkit.pinned === false, 'Missing-project context must not invent a persisted toolkit dependency.');

  const cwd = project('pinned');
  run(cwd, [
    'init', '--name', 'Toolkit fixture', '--profile', 'Express',
    '--toolkit-repository', repository,
    '--toolkit-revision', revisionA,
  ]);

  let current = record(cwd);
  assert(current.toolkit?.repository === repository, 'Initialization did not record the toolkit repository.');
  assert(current.toolkit?.revision === revisionA, 'Initialization did not record the toolkit revision.');
  assert(!current.snapshots.some((snapshot) => snapshot.reference?.startsWith('toolkit+github://')), 'Toolkit dependency must not occupy project source lineage.');

  let context = JSON.parse(run(cwd, ['context', '--json']).stdout);
  assert(context.project.root === '.', 'Context must resolve the implementation project root independently.');
  assert(context.toolkit.pinned === true, 'Context did not expose the toolkit dependency.');
  assert(context.toolkit.legacy === false, 'Canonical toolkit dependency must not be reported as legacy.');
  assert(context.toolkit.repository === repository, 'Context toolkit repository is incorrect.');
  assert(context.toolkit.revision === revisionA, 'Context toolkit revision is incorrect.');
  assert(context.execution.prompt === 'prompts/00-intake.md', 'Legacy relative prompt field changed unexpectedly.');
  assert(context.execution.promptSource?.scope === 'toolkit', 'Prompt source must identify toolkit scope.');
  assert(context.execution.promptSource?.repository === repository, 'Prompt source repository is not resolved.');
  assert(context.execution.promptSource?.revision === revisionA, 'Prompt source revision is not resolved.');
  assert(context.execution.promptSource?.path === 'prompts/00-intake.md', 'Prompt source path is not resolved.');

  const show = JSON.parse(run(cwd, ['toolkit', 'show', '--json']).stdout);
  assert(show.pinned === true && show.revision === revisionA, 'toolkit show did not report the recorded dependency.');

  const beforeSamePin = readFileSync(recordPath(cwd));
  run(cwd, ['toolkit', 'pin', '--repository', repository, '--revision', revisionA]);
  const afterSamePin = readFileSync(recordPath(cwd));
  assert(Buffer.compare(beforeSamePin, afterSamePin) === 0, 'Re-pinning the same toolkit must be idempotent.');

  const beforeDifferentPin = readFileSync(recordPath(cwd));
  run(cwd, ['toolkit', 'pin', '--repository', repository, '--revision', revisionB], 1);
  const afterDifferentPin = readFileSync(recordPath(cwd));
  assert(Buffer.compare(beforeDifferentPin, afterDifferentPin) === 0, 'Refusing a different toolkit pin must not mutate the workflow record.');

  const preToolkit = structuredClone(current);
  delete preToolkit.toolkit;
  assert(validateWorkflowRecord(preToolkit).length === 0, 'Existing schema-v2 records without toolkit must remain valid.');

  const alias = project('commit-alias');
  run(alias, [
    'init', '--name', 'Commit alias fixture', '--profile', 'Express',
    '--toolkit-repository', repository,
    '--toolkit-commit', revisionA,
  ]);
  assert(record(alias).toolkit?.revision === revisionA, '--toolkit-commit must remain a compatibility alias for --toolkit-revision.');

  const invalid = project('invalid');
  run(invalid, [
    'init', '--name', 'Invalid toolkit fixture', '--profile', 'Express', '--toolkit-revision', 'abc123',
  ], 1);
  assert(!existsSync(recordPath(invalid)), 'Invalid explicit toolkit revision must fail before initialization mutates files.');

  const legacy = project('legacy');
  run(legacy, [
    'init', '--name', 'Legacy toolkit fixture', '--profile', 'Express',
    '--toolkit-repository', repository,
    '--toolkit-revision', revisionA,
  ]);
  const legacyRecord = record(legacy);
  delete legacyRecord.toolkit;
  legacyRecord.snapshots.push({
    id: 'SRC-DOC-999',
    role: 'Supporting source',
    pinStrength: 'Immutable',
    status: 'Active',
    reference: `toolkit+github://${repository}@0.3.0`,
    commit: revisionA,
  });
  assert(validateWorkflowRecord(legacyRecord).length === 0, 'Legacy snapshot fixture must remain structurally readable.');
  const legacyBinding = toolkitBindingFromRecord(legacyRecord);
  assert(legacyBinding.pinned === true && legacyBinding.legacy === true, 'Legacy snapshot pin must be recognized for compatibility.');
  assert(legacyBinding.revision === revisionA, 'Legacy snapshot commit must resolve as toolkit revision.');
  writeRecord(legacy, legacyRecord);

  run(legacy, ['toolkit', 'migrate']);
  const migrated = record(legacy);
  assert(migrated.toolkit?.repository === repository, 'Legacy migration did not create the toolkit repository binding.');
  assert(migrated.toolkit?.revision === revisionA, 'Legacy migration did not preserve the immutable toolkit revision.');
  assert(!migrated.snapshots.some((snapshot) => snapshot.reference?.startsWith('toolkit+github://')), 'Legacy migration must remove toolkit state from project source lineage.');
  context = JSON.parse(run(legacy, ['context', '--json']).stdout);
  assert(context.toolkit.legacy === false, 'Migrated toolkit dependency must be canonical in context.');

  console.log('Toolkit dependency separation, prompt resolution, migration, and backward-compatibility tests passed.');
} finally {
  for (const path of projects) rmSync(path, { recursive: true, force: true });
}
