#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalRemoteReference, resolveRepositoryWorkspace, verifyRepositoryCommit,
} from '../cli/lib/repository-binding.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const cleanup = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function temp(name) {
  const path = mkdtempSync(join(tmpdir(), `design-workflow-portability-${name}-`));
  cleanup.push(path);
  return path;
}

function run(cwd, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd, encoding: 'utf8', env: { ...process.env, TMPDIR: '/tmp' },
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

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function initializeRepository(cwd, remote = null) {
  git(cwd, ['init']);
  git(cwd, ['config', 'user.email', 'fixture@example.com']);
  git(cwd, ['config', 'user.name', 'Fixture']);
  git(cwd, ['branch', '-M', 'main']);
  writeFileSync(join(cwd, 'seed.txt'), 'baseline\n', 'utf8');
  git(cwd, ['add', 'seed.txt']);
  git(cwd, ['commit', '-m', 'Create baseline']);
  if (remote) git(cwd, ['remote', 'add', 'origin', remote]);
  return git(cwd, ['rev-parse', 'HEAD']);
}

function record(cwd) {
  return JSON.parse(readFileSync(join(cwd, '.workflow', 'workflow-record.json'), 'utf8'));
}

function movedCopy(source, name) {
  const parent = temp(name);
  const destination = join(parent, 'project');
  cpSync(source, destination, { recursive: true });
  return destination;
}

function testRemoteCanonicalization() {
  assert(
    canonicalRemoteReference('git@github.com:Example/Portable.git') === 'https://github.com/Example/Portable',
    'scp-style SSH remote was not canonicalized',
  );
  assert(
    canonicalRemoteReference('ssh://git@github.com/Example/Portable.git') === 'https://github.com/Example/Portable',
    'SSH URL remote was not canonicalized',
  );
  assert(
    canonicalRemoteReference('https://token@github.com/Example/Portable.git') === 'https://github.com/Example/Portable',
    'HTTPS credentials were not removed from canonical identity',
  );
  assert(canonicalRemoteReference('/tmp/local-checkout') === null, 'Local filesystem path became a remote identity');
}

function testProjectRelativeSnapshotSurvivesMove() {
  const cwd = temp('project-local');
  const baseline = initializeRepository(cwd);
  run(cwd, ['init', '--name', 'Portable local fixture', '--profile', 'Express', '--repository', '.']);

  let current = record(cwd);
  let snapshot = current.snapshots.find((item) => item.id === 'SRC-REPO-001');
  assert(snapshot.reference === 'project://.', `Expected project://. reference, received ${snapshot.reference}`);
  assert(snapshot.commit === baseline, 'Portable snapshot did not retain the baseline commit');
  assert(!snapshot.reference.includes(cwd), 'Portable snapshot leaked the original checkout path');

  const moved = movedCopy(cwd, 'moved');
  rmSync(cwd, { recursive: true, force: true });
  run(moved, ['snapshot', 'add', '--kind', 'asset', '--reference', 'fixture-assets']);
  current = record(moved);
  snapshot = current.snapshots.find((item) => item.id === 'SRC-REPO-001');
  assert(snapshot.reference === 'project://.', 'Mutation after moving the checkout rewrote the portable reference');
  assert(resolveRepositoryWorkspace(moved, snapshot) === resolve(moved), 'Moved checkout was not resolved from project://.');

  writeFileSync(join(moved, 'implementation.txt'), 'implemented\n', 'utf8');
  git(moved, ['add', 'implementation.txt']);
  git(moved, ['commit', '-m', 'Create portable descendant']);
  const output = git(moved, ['rev-parse', 'HEAD']);
  const verified = verifyRepositoryCommit(moved, snapshot, output);
  assert(verified.reference === 'project://.', 'Verified output did not retain a portable project reference');
}

function testProjectSubdirectoryReference() {
  const workflow = temp('subdirectory');
  const repository = join(workflow, 'implementation');
  mkdirSync(repository, { recursive: true });
  initializeRepository(repository);
  run(workflow, ['init', '--name', 'Subdirectory fixture', '--profile', 'Express', '--repository', 'implementation']);
  const snapshot = record(workflow).snapshots.find((item) => item.id === 'SRC-REPO-001');
  assert(snapshot.reference === 'project://implementation', `Expected project://implementation, received ${snapshot.reference}`);
  assert(resolveRepositoryWorkspace(workflow, snapshot) === resolve(repository), 'Project subdirectory binding did not resolve');
}

function testProjectReferenceCannotEscapeRoot() {
  const parent = temp('escape');
  const workflow = join(parent, 'workflow');
  const outside = join(parent, 'outside');
  mkdirSync(workflow, { recursive: true });
  mkdirSync(outside, { recursive: true });
  const commit = initializeRepository(outside);

  let rejected = false;
  try {
    resolveRepositoryWorkspace(workflow, {
      id: 'SRC-REPO-999', reference: 'project://../outside', commit,
    });
  } catch {
    rejected = true;
  }
  assert(rejected, 'project:// reference escaped the workflow root');

  run(workflow, ['init', '--name', 'Containment fixture', '--profile', 'Express']);
  const escapeResult = run(workflow, [
    'snapshot', 'add', '--kind', 'repo', '--reference', 'project://../outside', '--commit', commit,
  ], 1);
  assert(escapeResult.stderr.includes('portable identity'), 'Invalid project:// snapshot was not rejected at serialization');

  const missingResult = run(workflow, [
    'snapshot', 'add', '--kind', 'repo', '--reference', 'project://missing', '--commit', commit,
  ], 1);
  assert(missingResult.stderr.includes('does not resolve'), 'Missing project-relative repository was accepted as a new snapshot');
}

function testRemoteIdentityAndLocalBinding() {
  const workflow = temp('external-workflow');
  const repository = temp('external-repository');
  initializeRepository(repository, 'git@github.com:Example/Portable.git');

  run(workflow, ['init', '--name', 'External fixture', '--profile', 'Express', '--repository', repository]);
  let current = record(workflow);
  const snapshot = current.snapshots.find((item) => item.id === 'SRC-REPO-001');
  assert(snapshot.reference === 'https://github.com/Example/Portable', 'External repository did not store its canonical remote identity');
  assert(!snapshot.reference.includes(repository), 'External repository snapshot leaked a local checkout path');

  run(workflow, ['repository', 'bind', 'SRC-REPO-001', '--path', repository]);
  const localPath = join(workflow, '.workflow', 'local.json');
  assert(existsSync(localPath), 'Local repository binding file was not created');
  const local = JSON.parse(readFileSync(localPath, 'utf8'));
  assert(local.repositories[snapshot.reference] === repository, 'Local binding did not map the canonical identity to the checkout');
  assert(resolveRepositoryWorkspace(workflow, snapshot) === resolve(repository), 'Local repository binding did not resolve the external checkout');

  run(workflow, ['snapshot', 'add', '--kind', 'asset', '--reference', 'external-assets']);
  current = record(workflow);
  assert(
    current.snapshots.find((item) => item.id === 'SRC-REPO-001').reference === snapshot.reference,
    'Mutation with a local binding wrote the machine path back into the canonical record',
  );
}

function testBindingRejectsConflictingRemoteIdentity() {
  const workflow = temp('identity-workflow');
  const source = temp('identity-source');
  const conflicting = temp('identity-conflicting');
  initializeRepository(source, 'git@github.com:Example/Portable.git');
  git(temp('clone-parent'), ['clone', source, conflicting]);
  git(conflicting, ['remote', 'set-url', 'origin', 'git@github.com:Other/Repository.git']);

  run(workflow, ['init', '--name', 'Identity fixture', '--profile', 'Express', '--repository', source]);
  const result = run(workflow, ['repository', 'bind', 'SRC-REPO-001', '--path', conflicting], 1);
  assert(result.stderr.includes('identity does not match'), 'Binding with a conflicting remote identity was accepted');
  assert(!existsSync(join(workflow, '.workflow', 'local.json')), 'Rejected identity binding still wrote local configuration');
}

function testLegacyAbsolutePathHealsAfterMove() {
  const cwd = temp('legacy');
  initializeRepository(cwd);
  run(cwd, ['init', '--name', 'Legacy fixture', '--profile', 'Express', '--repository', '.']);

  const legacy = record(cwd);
  legacy.snapshots.find((item) => item.id === 'SRC-REPO-001').reference = cwd;
  writeFileSync(join(cwd, '.workflow', 'workflow-record.json'), `${JSON.stringify(legacy, null, 2)}\n`, 'utf8');

  const moved = movedCopy(cwd, 'legacy-moved');
  rmSync(cwd, { recursive: true, force: true });
  run(moved, ['snapshot', 'add', '--kind', 'asset', '--reference', 'legacy-assets']);
  const healed = record(moved).snapshots.find((item) => item.id === 'SRC-REPO-001');
  assert(healed.reference === 'project://.', `Legacy absolute path was not healed after move: ${healed.reference}`);
}

function testExternalRepositoryWithoutIdentityIsRejected() {
  const workflow = temp('no-identity-workflow');
  const repository = temp('no-identity-repository');
  initializeRepository(repository);
  const result = run(workflow, ['init', '--name', 'Rejected fixture', '--profile', 'Express', '--repository', repository], 1);
  assert(result.stderr.includes('portable identity'), 'Rejection did not explain the missing portable repository identity');
  assert(!existsSync(join(workflow, '.workflow', 'workflow-record.json')), 'Rejected init still created a canonical workflow record');
}

try {
  testRemoteCanonicalization();
  testProjectRelativeSnapshotSurvivesMove();
  testProjectSubdirectoryReference();
  testProjectReferenceCannotEscapeRoot();
  testRemoteIdentityAndLocalBinding();
  testBindingRejectsConflictingRemoteIdentity();
  testLegacyAbsolutePathHealsAfterMove();
  testExternalRepositoryWithoutIdentityIsRejected();
  assert(readFileSync(join(root, '.gitignore'), 'utf8').includes('.workflow/local.json'), 'Local binding file is not ignored by Git');
  console.log('Repository portability, binding, containment, legacy-healing, and identity tests passed.');
} finally {
  for (const path of cleanup) rmSync(path, { recursive: true, force: true });
}
