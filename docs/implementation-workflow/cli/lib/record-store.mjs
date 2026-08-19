import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { dirname, resolve } from 'node:path';
import { inspectWorkflowRecord, validateWorkflowRecord } from './canonical-validation.mjs';
import { renderGeneratedState } from './generated-state.mjs';
import {
  isPortableRepositoryReference, portableRepositoryReference, resolveRepositoryWorkspace,
} from './repository-binding.mjs';
import { enrichIntegrityCandidate, subjectIntegrityFindings } from './subject-integrity.mjs';
import { initializationToolkitPin } from './toolkit-binding.mjs';
import { projectRootForRecord } from './workspace.mjs';

const recordVersions = new WeakMap();

function recordText(record) {
  return `${JSON.stringify(record, null, 2)}\n`;
}

function digestBytes(content) {
  return createHash('sha256').update(content).digest('hex');
}

function expectedRecordDigest(record) {
  return recordVersions.get(record) ?? digestBytes(recordText(record));
}

function tempPath(path, label, sequence) {
  return `${path}.${label}-${process.pid}-${Date.now()}-${sequence}.tmp`;
}

function asBuffer(content) {
  return Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
}

function normalizeFileChanges(fileChanges) {
  const normalized = new Map();
  for (const [path, change] of fileChanges ?? []) {
    const value = typeof change === 'string' || Buffer.isBuffer(change)
      ? { content: change, overwrite: false }
      : change;
    normalized.set(resolve(path), {
      content: asBuffer(value.content),
      overwrite: Boolean(value.overwrite),
    });
  }
  return normalized;
}

function isStrictRepair(before, after) {
  if (after.length >= before.length) return false;
  const beforeSet = new Set(before);
  return after.every((finding) => beforeSet.has(finding));
}

function repositorySnapshots(record) {
  return record.schemaVersion === 2
    ? record.snapshots.filter((snapshot) => snapshot.id?.startsWith('SRC-REPO-') && snapshot.commit)
    : [];
}

function isBindingConfigurationError(error) {
  return error instanceof Error && error.message.startsWith('Local repository binding file');
}

function hydrateRepositoryReferences(recordPath, record) {
  const projectRoot = projectRootForRecord(recordPath);
  for (const snapshot of repositorySnapshots(record)) {
    try {
      snapshot.reference = resolveRepositoryWorkspace(projectRoot, snapshot);
    } catch (error) {
      if (isBindingConfigurationError(error)) throw error;
    }
  }
  return record;
}

function canonicalizeRepositoryReferences(recordPath, candidate, currentRecord = null) {
  const projectRoot = projectRootForRecord(recordPath);
  const currentSnapshots = new Map((currentRecord?.snapshots ?? []).map((snapshot) => [snapshot.id, snapshot]));
  for (const snapshot of repositorySnapshots(candidate)) {
    let repository = null;
    try {
      repository = resolveRepositoryWorkspace(projectRoot, snapshot);
      const previousReference = currentSnapshots.get(snapshot.id)?.reference;
      const parentReference = snapshot.parent ? currentSnapshots.get(snapshot.parent)?.reference : null;
      const reference = portableRepositoryReference(
        projectRoot,
        repository,
        previousReference ?? parentReference ?? snapshot.reference,
      );
      if (reference) snapshot.reference = reference;
    } catch (error) {
      if (isBindingConfigurationError(error)) throw error;
    }

    if (!currentSnapshots.has(snapshot.id) && !isPortableRepositoryReference(projectRoot, snapshot.reference)) {
      throw new Error(`Repository snapshot ${snapshot.id} has no portable identity. Configure a Git remote or keep the repository inside the workflow project before recording the snapshot.`);
    }
    if (!currentSnapshots.has(snapshot.id) && snapshot.reference.startsWith('project://') && !repository) {
      throw new Error(`Repository snapshot ${snapshot.id} uses project-relative identity ${snapshot.reference}, but that path does not resolve to a Git repository containing pinned commit ${snapshot.commit}.`);
    }
  }
  return candidate;
}

function processIsRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
}

function staleLocalLock(lockPath) {
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    return false;
  }
  if (!Number.isInteger(lock?.pid) || lock.pid <= 0) return false;
  if (lock.hostname !== hostname()) return false;
  return !processIsRunning(lock.pid);
}

function lockMetadata() {
  return `${JSON.stringify({
    pid: process.pid,
    hostname: hostname(),
    acquiredAt: new Date().toISOString(),
  })}\n`;
}

function writeRecordLock(lockPath) {
  writeFileSync(lockPath, lockMetadata(), { flag: 'wx' });
}

function recoverStaleLock(lockPath) {
  const recoveryPath = `${lockPath}.reap`;
  try {
    writeFileSync(recoveryPath, lockMetadata(), { flag: 'wx' });
  } catch (error) {
    if (error?.code === 'EEXIST') return false;
    throw error;
  }

  try {
    if (!existsSync(lockPath) || !staleLocalLock(lockPath)) return false;
    rmSync(lockPath);
    return true;
  } finally {
    rmSync(recoveryPath, { force: true });
  }
}

function acquireRecordLock(recordPath) {
  const lockPath = `${recordPath}.lock`;
  mkdirSync(dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeRecordLock(lockPath);
      return () => rmSync(lockPath, { force: true });
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (attempt === 0 && recoverStaleLock(lockPath)) continue;
      throw new Error(
        `Workflow record is locked by another workflow mutation at ${lockPath}. `
        + 'The lock is active or cannot be safely identified as stale; inspect it before removing it manually.',
      );
    }
  }
  throw new Error(`Could not acquire workflow record lock at ${lockPath}.`);
}

function rollback(committed, originals) {
  const rollbackTemps = [];
  try {
    for (let index = 0; index < committed.length; index += 1) {
      const path = committed[index];
      const original = originals.get(path);
      if (original === null) {
        rmSync(path, { force: true });
        continue;
      }
      const temp = tempPath(path, 'rollback', index);
      writeFileSync(temp, original, { flag: 'wx' });
      rollbackTemps.push(temp);
      renameSync(temp, path);
    }
  } finally {
    rollbackTemps.forEach((path) => rmSync(path, { force: true }));
  }
}

function writeFileSet(files) {
  const staged = [];
  const committed = [];
  const originals = new Map();
  try {
    let sequence = 0;
    for (const [path, change] of files) {
      mkdirSync(dirname(path), { recursive: true });
      const original = existsSync(path) ? readFileSync(path) : null;
      originals.set(path, original);
      const temp = tempPath(path, 'candidate', sequence);
      sequence += 1;
      writeFileSync(temp, change.content, { flag: 'wx' });
      staged.push([temp, path]);
    }
    for (const [temp, path] of staged) {
      renameSync(temp, path);
      committed.push(path);
    }
  } catch (error) {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
    try {
      rollback([...committed].reverse(), originals);
    } catch (rollbackError) {
      throw new Error(`Transaction failed and rollback also failed: ${error.message}; rollback: ${rollbackError.message}`);
    }
    throw error;
  } finally {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
  }
}

export function readStoredRecord(recordPath) {
  if (!existsSync(recordPath)) {
    throw new Error(`Workflow record not found at ${recordPath}. Run "design-workflow init" first.`);
  }
  const bytes = readFileSync(recordPath, 'utf8');
  try {
    const record = JSON.parse(bytes);
    recordVersions.set(record, digestBytes(bytes));
    return { record, bytes };
  } catch (error) {
    throw new Error(`Workflow record is not valid JSON: ${error.message}`);
  }
}

export function requireMutableRecord(record) {
  if (record.schemaVersion === 1) {
    throw new Error('Schema-v1 records are read-only. Run "design-workflow migrate" before mutation.');
  }
  if (record.schemaVersion !== 2) {
    throw new Error(`Unsupported workflow record schema version: ${String(record.schemaVersion)}`);
  }
}

export function prepareRecordMutation(recordPath, options = {}) {
  const stored = readStoredRecord(recordPath);
  if (!options.allowLegacy) requireMutableRecord(stored.record);
  return {
    ...stored,
    findings: validateWorkflowRecord(stored.record),
    candidate: hydrateRepositoryReferences(recordPath, structuredClone(stored.record)),
  };
}

export function commitRecordCandidate({
  recordPath,
  currentRecord = null,
  candidate,
  fileChanges = new Map(),
  requireClean = true,
  repair = false,
  allowCreate = false,
}) {
  const recordAbsolute = resolve(recordPath);
  const expectedDigest = currentRecord ? expectedRecordDigest(currentRecord) : null;
  const releaseLock = acquireRecordLock(recordAbsolute);
  try {
    const stored = existsSync(recordAbsolute) ? readStoredRecord(recordAbsolute) : null;
    if (!stored && currentRecord) {
      throw new Error('Workflow record changed since this mutation was prepared: the record was removed. Retry the command against the latest workflow state.');
    }
    if (!stored && !allowCreate) throw new Error(`Workflow record not found at ${recordAbsolute}.`);
    if (stored && allowCreate && !currentRecord) throw new Error(`Workflow record already exists at ${recordAbsolute}.`);
    if (stored && !currentRecord) {
      throw new Error('Existing workflow mutations require the current record returned by prepareRecordMutation() or readStoredRecord().');
    }
    if (stored && expectedDigest !== digestBytes(stored.bytes)) {
      throw new Error('Workflow record changed since this mutation was prepared. Retry the command against the latest workflow state.');
    }

    const current = stored?.record ?? null;
    const migratingLegacy = current?.schemaVersion === 1 && candidate.schemaVersion === 2;
    if (current && current.schemaVersion === 1 && candidate.schemaVersion === 1) requireMutableRecord(current);
    if ((!current && allowCreate || migratingLegacy) && candidate.schemaVersion === 2 && !candidate.toolkit) {
      const pin = initializationToolkitPin();
      if (pin) candidate.toolkit = pin;
    }

    const beforeFindings = current ? [
      ...validateWorkflowRecord(current),
      ...subjectIntegrityFindings(recordAbsolute, current),
    ] : [];

    canonicalizeRepositoryReferences(recordAbsolute, candidate, current);

    const narrativeChanges = normalizeFileChanges(fileChanges);
    for (const [path, change] of narrativeChanges) {
      if (existsSync(path) && !change.overwrite) {
        throw new Error(`Refusing to overwrite existing stage destination ${path}. Use "artifact adopt" instead.`);
      }
    }

    // Migration must not manufacture historical artifact or validation provenance from current bytes or HEAD.
    // The currently executing toolkit may be pinned because it is a present dependency, not historical evidence.
    if (!migratingLegacy) {
      enrichIntegrityCandidate(recordAbsolute, current, candidate, narrativeChanges);
    }

    const candidateRecordFindings = validateWorkflowRecord(candidate);
    const candidateIntegrityFindings = subjectIntegrityFindings(recordAbsolute, candidate, {
      fileChanges: narrativeChanges,
      requireToolkit: !allowCreate,
    });
    const candidateFindings = [...candidateRecordFindings, ...candidateIntegrityFindings];
    const strictRepair = isStrictRepair(beforeFindings, candidateFindings);
    if (requireClean && beforeFindings.length > 0 && !repair && !strictRepair) {
      throw new Error(`Current workflow state is invalid:\n${beforeFindings.map((item) => `- ${item}`).join('\n')}`);
    }
    if (candidateFindings.length > 0) {
      const allowedLegacyMigration = migratingLegacy && candidateRecordFindings.length === 0;
      const allowedRepair = strictRepair && (repair || requireClean);
      if (!allowedLegacyMigration && !allowedRepair) {
        throw new Error(`Candidate workflow record is invalid:\n${candidateFindings.map((item) => `- ${item}`).join('\n')}`);
      }
    }

    const rendered = renderGeneratedState(recordAbsolute, candidate);
    const completeSet = new Map();
    completeSet.set(recordAbsolute, { content: asBuffer(recordText(candidate)), overwrite: true });
    for (const [path, content] of rendered) {
      completeSet.set(resolve(path), { content: asBuffer(content), overwrite: true });
    }
    for (const [path, change] of narrativeChanges) completeSet.set(path, change);
    writeFileSet(completeSet);
    return {
      record: candidate,
      files: [...completeSet.keys()],
      findings: candidateFindings,
    };
  } finally {
    releaseLock();
  }
}

export function mutateRecord(recordPath, mutator, options = {}) {
  const prepared = prepareRecordMutation(recordPath, options);
  const result = mutator(prepared.candidate, prepared.record) ?? {};
  return commitRecordCandidate({
    recordPath,
    currentRecord: prepared.record,
    candidate: prepared.candidate,
    fileChanges: result.fileChanges,
    requireClean: options.requireClean ?? true,
    repair: Boolean(options.repair),
  });
}

export function recordInspection(record) {
  return inspectWorkflowRecord(record);
}
