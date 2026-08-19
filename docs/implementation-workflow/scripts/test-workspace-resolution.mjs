#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const temporary = mkdtempSync(join(tmpdir(), 'design-workflow-workspace-'));
const invocation = join(temporary, 'invocation');
const project = join(temporary, 'project');
const standaloneProject = join(temporary, 'standalone-project');

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function initializeRepository(directory) {
  mkdirSync(directory, { recursive: true });
  git(directory, ['init']);
  git(directory, ['config', 'user.email', 'workspace@example.com']);
  git(directory, ['config', 'user.name', 'Workspace Fixture']);
  git(directory, ['branch', '-M', 'main']);
  writeFileSync(join(directory, 'seed.txt'), 'baseline\n', 'utf8');
  git(directory, ['add', 'seed.txt']);
  git(directory, ['commit', '-m', 'Create baseline']);
}

try {
  mkdirSync(invocation, { recursive: true });
  initializeRepository(project);

  const nestedRecord = join(project, '.workflow', 'custom-record.json');
  run(invocation, [
    'init', '--record', nestedRecord, '--name', 'External invocation fixture',
    '--profile', 'Express', '--repository', project,
  ]);

  assert(existsSync(nestedRecord), 'Explicit record was not created in the target project.');
  assert(existsSync(join(project, 'WORKPACK.md')), 'Narrative artifact was not rendered in the inferred project root.');
  assert(existsSync(join(project, '.workflow', 'generated', 'WORKFLOW-STATUS.md')), 'Generated views were not written beside the explicit control record.');
  assert(!existsSync(join(invocation, 'WORKPACK.md')), 'Invocation directory incorrectly received project artifacts.');
  assert(!existsSync(join(invocation, '.workflow')), 'Invocation directory incorrectly received workflow control files.');

  const contextResult = run(invocation, ['agent-context', '--record', nestedRecord, '--json']);
  const context = JSON.parse(contextResult.stdout);
  assert(context.project?.root === '.', `Agent context project root was ${context.project?.root}, expected .`);
  assert(context.control?.record === '.workflow/custom-record.json', `Agent context record path was ${context.control?.record}`);

  run(invocation, ['repository', 'bind', 'SRC-REPO-001', '--record', nestedRecord, '--path', project]);
  assert(existsSync(join(project, '.workflow', 'local.json')), 'Repository binding was not stored under the resolved project root.');
  assert(!existsSync(join(invocation, '.workflow', 'local.json')), 'Repository binding leaked into the invocation directory.');

  initializeRepository(standaloneProject);
  const standaloneRecord = join(standaloneProject, 'workflow-control.json');
  run(invocation, [
    'init', '--record', standaloneRecord, '--name', 'Standalone record fixture',
    '--profile', 'Express', '--repository', standaloneProject,
  ]);
  assert(existsSync(join(standaloneProject, 'WORKPACK.md')), 'Non-.workflow record did not infer its own directory as project root.');
  assert(existsSync(join(standaloneProject, 'generated', 'WORKFLOW-STATUS.md')), 'Non-.workflow record did not keep generated control state beside the record.');

  const standaloneContext = JSON.parse(run(
    invocation, ['agent-context', '--record', standaloneRecord, '--json'],
  ).stdout);
  assert(standaloneContext.project?.root === '.', 'Standalone record context did not normalize to its project directory.');
  assert(standaloneContext.control?.record === 'workflow-control.json', 'Standalone record context exposed an invocation-relative path.');

  console.log('Explicit record paths resolve one canonical project workspace across CLI and agent context.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
