#!/usr/bin/env node

import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  commitRecordCandidate, prepareRecordMutation,
} from '../cli/lib/record-store.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cwd = mkdtempSync(join(tmpdir(), 'design-workflow-concurrency-'));
const recordPath = join(cwd, '.workflow', 'workflow-record.json');
const lockPath = `${recordPath}.lock`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrow(action, fragment) {
  try {
    action();
  } catch (error) {
    assert(error instanceof Error, 'Expected an Error instance.');
    assert(error.message.includes(fragment), `Expected error containing "${fragment}", received: ${error.message}`);
    return;
  }
  throw new Error(`Expected action to fail with "${fragment}".`);
}

function capture(paths) {
  return new Map(paths.map((path) => [path, readFileSync(path)]));
}

function assertByteIdentical(before, message) {
  for (const [path, bytes] of before) {
    assert(existsSync(path), `${message}: missing ${path}`);
    assert(Buffer.compare(bytes, readFileSync(path)) === 0, `${message}: changed ${path}`);
  }
}

try {
  mkdirSync(dirname(recordPath), { recursive: true });
  const initial = JSON.parse(readFileSync(
    join(root, 'tests', 'fixtures', 'workflow-record.migration.v2.json'),
    'utf8',
  ));
  // The migration golden fixture intentionally preserves a legacy relative repository
  // reference and fake SHA. This concurrency test creates a fresh canonical record, so
  // adapt only its in-memory copy to the current portable repository-reference contract.
  initial.snapshots.find((snapshot) => snapshot.id === 'SRC-REPO-001').reference = 'https://github.com/example/concurrency-fixture';
  const workpackPath = join(cwd, 'WORKPACK.md');
  const initialized = commitRecordCandidate({
    recordPath,
    candidate: initial,
    fileChanges: new Map([[workpackPath, '# Concurrency fixture workpack\n']]),
    allowCreate: true,
  });
  assert(!existsSync(lockPath), 'Successful initialization leaked the workflow mutation lock.');

  const writerA = prepareRecordMutation(recordPath);
  const writerB = prepareRecordMutation(recordPath);
  writerB.candidate.project.name = 'Writer B committed';
  const writerBCommit = commitRecordCandidate({
    recordPath,
    currentRecord: writerB.record,
    candidate: writerB.candidate,
  });

  const transactionFiles = [...new Set([
    ...initialized.files,
    ...writerBCommit.files,
    workpackPath,
  ])];
  let before = capture(transactionFiles);
  writerA.candidate.project.name = 'Writer A stale overwrite';
  expectThrow(() => commitRecordCandidate({
    recordPath,
    currentRecord: writerA.record,
    candidate: writerA.candidate,
  }), 'changed since this mutation was prepared');
  assertByteIdentical(before, 'Stale mutation conflict was not byte-identical');
  assert(!existsSync(lockPath), 'Stale mutation conflict leaked the workflow mutation lock.');

  const lockedWriter = prepareRecordMutation(recordPath);
  lockedWriter.candidate.project.name = 'Writer blocked by lock';
  writeFileSync(lockPath, 'fixture lock\n', { flag: 'wx' });
  before = capture(transactionFiles);
  expectThrow(() => commitRecordCandidate({
    recordPath,
    currentRecord: lockedWriter.record,
    candidate: lockedWriter.candidate,
  }), 'locked by another workflow mutation');
  assertByteIdentical(before, 'Lock conflict was not byte-identical');
  assert(readFileSync(lockPath, 'utf8') === 'fixture lock\n', 'Failed lock acquisition modified the existing lock.');
  rmSync(lockPath, { force: true });

  const invalidWriter = prepareRecordMutation(recordPath);
  invalidWriter.candidate.schemaVersion = 999;
  expectThrow(() => commitRecordCandidate({
    recordPath,
    currentRecord: invalidWriter.record,
    candidate: invalidWriter.candidate,
  }), 'Candidate workflow record is invalid');
  assert(!existsSync(lockPath), 'Validation failure leaked the workflow mutation lock.');

  const finalRecord = JSON.parse(readFileSync(recordPath, 'utf8'));
  assert(finalRecord.project.name === 'Writer B committed', 'Rejected mutations changed the committed workflow record.');

  console.log('Workflow mutation concurrency tests passed.');
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
