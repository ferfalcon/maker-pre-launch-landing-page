import {
  existsSync, mkdirSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, relative } from 'node:path';
import { renderArtifactFile } from './artifact-renderer.mjs';
import { readStoredRecord, requireMutableRecord } from './record-store.mjs';
import {
  artifactId, artifactType, fail, normalizeChoice, resolveRecordPath,
} from './utils.mjs';
import { workflowDiagnostics } from './workflow-diagnostics.mjs';
import { VALIDATION_STATUSES } from './workflow-model.mjs';

export function now() {
  return new Date().toISOString();
}

export function date() {
  return new Date().toISOString().slice(0, 10);
}

export function optionString(options, name, { required = false } = {}) {
  const value = options[name];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (required) throw new Error(`--${name} is required.`);
  return null;
}

export function booleanOption(value, fallback = false) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true' || value === 'yes') return true;
  if (value === false || value === 'false' || value === 'no') return false;
  throw new Error('Boolean values must be true or false.');
}

export function recordPathFor(cwd, options) {
  return resolveRecordPath(cwd, options.record);
}

export function loadRecord(cwd, options, mutable = false) {
  const path = recordPathFor(cwd, options);
  const stored = readStoredRecord(path);
  if (mutable) requireMutableRecord(stored.record);
  return { path, record: stored.record };
}

export function commandFailure(stderr, error) {
  return fail(stderr, error instanceof Error ? error.message : String(error));
}

export function nextArtifactId(record, type, suffix = '') {
  return artifactId(record, type, suffix);
}

export function relativeArtifactPath(cwd, path) {
  const value = relative(cwd, path).split('\\').join('/');
  return value || path;
}

export function renderForRecord(cwd, record, type, options = {}) {
  return renderArtifactFile(cwd, type, {
    control: 'cli-managed',
    project: record.project.name,
    profile: record.project.profile,
    mode: record.project.executionMode,
    date: date(),
    ...options,
  });
}

export function addArtifactCandidate(cwd, record, type, fileChanges, options = {}) {
  const desiredId = options.id ?? nextArtifactId(record, type, options.taskId ?? '');
  const rendered = renderForRecord(cwd, record, type, options);
  const destinationPath = relativeArtifactPath(cwd, rendered.path);
  const existing = record.artifacts.find((item) => (
    item.status !== 'Superseded'
    && (
      type === 'TASK'
        ? item.id === desiredId || item.path === destinationPath
        : item.type === type
    )
  ));
  if (existing) return existing;
  const placeholder = record.artifacts.find((item) => (
    item.type === type
    && item.status === 'Superseded'
    && item.path === destinationPath
    && !item.supersededBy
  ));
  if (placeholder) {
    placeholder.id = desiredId;
    placeholder.status = 'Draft';
    placeholder.baseline = [...new Set(options.baseline ?? record.state.activeInputs)];
    fileChanges.set(rendered.path, { content: rendered.content, overwrite: false });
    return placeholder;
  }
  const artifact = {
    id: desiredId,
    type,
    path: destinationPath,
    status: 'Draft',
    baseline: [...new Set(options.baseline ?? record.state.activeInputs)],
  };
  record.artifacts.push(artifact);
  fileChanges.set(rendered.path, { content: rendered.content, overwrite: false });
  return artifact;
}

export function writeNewNarratives(fileChanges) {
  const staged = [];
  const committed = [];
  try {
    let index = 0;
    for (const [path, content] of fileChanges) {
      if (existsSync(path)) throw new Error(`Refusing to overwrite existing narrative file ${path}.`);
      mkdirSync(dirname(path), { recursive: true });
      const temp = `${path}.scaffold-${process.pid}-${Date.now()}-${index}.tmp`;
      index += 1;
      writeFileSync(temp, content, { flag: 'wx' });
      staged.push([temp, path]);
    }
    for (const [temp, path] of staged) {
      renameSync(temp, path);
      committed.push(path);
    }
  } catch (error) {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
    committed.forEach((path) => rmSync(path, { force: true }));
    throw error;
  } finally {
    staged.forEach(([temp]) => rmSync(temp, { force: true }));
  }
  return committed;
}

export function latestVerificationIds(record) {
  const ids = [];
  const snapshotIds = [
    ...record.state.activeInputs,
    record.state.latestOutput,
    record.state.latestValidationRuntime,
  ].filter(Boolean);
  for (const snapshotId of [...new Set(snapshotIds)]) {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === snapshotId);
    if (verification) ids.push(verification.id);
  }
  return ids;
}

export function requireCleanCurrent(recordPath, record, action) {
  const findings = workflowDiagnostics(recordPath, record).findings;
  if (findings.length > 0) {
    throw new Error(`Current workflow state must be clean before ${action}:\n${findings.map((item) => `- ${item}`).join('\n')}\nRun "design-workflow sync" after resolving record findings.`);
  }
}

export function invalidateCurrentGate(record, nextStatus = 'In progress') {
  let invalidated = false;
  for (const gate of record.gates) {
    if (gate.stage === record.state.stage && gate.status === 'Active') {
      gate.status = 'Superseded';
      invalidated = true;
    }
  }
  if (invalidated) record.state.status = nextStatus;
  return invalidated;
}

export function artifactBySelector(record, selector) {
  const exact = record.artifacts.find((item) => item.id === selector);
  if (exact) return exact;
  const type = artifactType(selector);
  if (type) {
    return [...record.artifacts].reverse().find((item) => (
      item.type === type && item.status !== 'Superseded'
    ));
  }
  return null;
}

export function taskById(record, id) {
  const task = record.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`Task ${id} does not exist.`);
  return task;
}

export function parseValidationStatus(value) {
  return normalizeChoice(value, VALIDATION_STATUSES);
}
