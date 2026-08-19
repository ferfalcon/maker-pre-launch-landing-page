import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_TOOLKIT_REPOSITORY = 'ferfalcon/figma-to-implementation-workflow';
export const LEGACY_TOOLKIT_REFERENCE_PREFIX = 'toolkit+github://';

const revisionPattern = /^[0-9a-f]{40}$/i;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const toolkitRoot = resolve(moduleDirectory, '../..');
const packagedProvenancePath = resolve(toolkitRoot, 'cli', 'toolkit-provenance.json');

let stagedInitializationPin;

function git(args) {
  try {
    return execFileSync('git', ['-C', toolkitRoot, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function toolkitIsGitRoot() {
  const detectedRoot = git(['rev-parse', '--show-toplevel']);
  return detectedRoot ? resolve(detectedRoot) === toolkitRoot : false;
}

function githubRepositoryFromRemote(remote) {
  if (!remote) return null;
  const ssh = remote.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (ssh) return ssh[1];
  const https = remote.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (https) return https[1];
  const sshUrl = remote.match(/^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i);
  return sshUrl?.[1] ?? null;
}

function normalizeRepository(value) {
  const repository = String(value ?? '').trim();
  if (!repositoryPattern.test(repository)) {
    throw new Error(`Toolkit repository must use owner/name form; received ${repository || 'empty value'}.`);
  }
  return repository;
}

function normalizeRevision(value) {
  const revision = String(value ?? '').trim().toLowerCase();
  if (!revisionPattern.test(revision)) {
    throw new Error(`Toolkit revision must be an exact 40-character Git SHA; received ${revision || 'empty value'}.`);
  }
  return revision;
}

export function normalizeToolkitBinding(value) {
  return {
    repository: normalizeRepository(value?.repository),
    revision: normalizeRevision(value?.revision ?? value?.commit),
  };
}

function packagedToolkitPin() {
  if (!existsSync(packagedProvenancePath)) return null;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(packagedProvenancePath, 'utf8'));
  } catch (error) {
    throw new Error(`Packaged toolkit provenance at ${packagedProvenancePath} is invalid JSON: ${error.message}`);
  }
  try {
    return normalizeToolkitBinding(parsed);
  } catch (error) {
    throw new Error(`Packaged toolkit provenance at ${packagedProvenancePath} is invalid: ${error.message}`);
  }
}

export function observedRuntimeToolkitPin() {
  if (!toolkitIsGitRoot()) return packagedToolkitPin();
  const detectedRevision = git(['rev-parse', 'HEAD']);
  if (!detectedRevision) return null;
  const detectedRepository = githubRepositoryFromRemote(git(['remote', 'get-url', 'origin']));
  return normalizeToolkitBinding({
    repository: detectedRepository ?? DEFAULT_TOOLKIT_REPOSITORY,
    revision: detectedRevision,
  });
}

export function runtimeToolkitPin(overrides = {}) {
  const explicitRevision = overrides.revision ?? overrides.commit ?? null;
  if (explicitRevision) {
    return normalizeToolkitBinding({
      repository: overrides.repository ?? DEFAULT_TOOLKIT_REPOSITORY,
      revision: explicitRevision,
    });
  }
  return observedRuntimeToolkitPin();
}

export async function withInitializationToolkitPin(pin, callback) {
  const previous = stagedInitializationPin;
  stagedInitializationPin = pin;
  try {
    return await callback();
  } finally {
    stagedInitializationPin = previous;
  }
}

export function initializationToolkitPin() {
  if (stagedInitializationPin !== undefined) return stagedInitializationPin;
  return runtimeToolkitPin();
}

function parseLegacyToolkitReference(reference) {
  if (typeof reference !== 'string' || !reference.startsWith(LEGACY_TOOLKIT_REFERENCE_PREFIX)) return null;
  const payload = reference.slice(LEGACY_TOOLKIT_REFERENCE_PREFIX.length);
  const separator = payload.lastIndexOf('@');
  if (separator <= 0) return null;
  try {
    return { repository: normalizeRepository(payload.slice(0, separator)) };
  } catch {
    return null;
  }
}

export function legacyToolkitPins(record) {
  return (record.snapshots ?? [])
    .filter((snapshot) => snapshot.status === 'Active')
    .map((snapshot) => {
      const source = parseLegacyToolkitReference(snapshot.reference);
      if (!source || !revisionPattern.test(snapshot.commit ?? '')) return null;
      return {
        repository: source.repository,
        revision: snapshot.commit.toLowerCase(),
        snapshot: snapshot.id,
        pinStrength: snapshot.pinStrength,
        role: snapshot.role,
      };
    })
    .filter(Boolean);
}

export function toolkitBindingFromRecord(record) {
  if (record.toolkit) {
    try {
      return {
        pinned: true,
        ...normalizeToolkitBinding(record.toolkit),
        legacy: false,
        snapshot: null,
        ambiguous: false,
      };
    } catch {
      return {
        pinned: false, repository: null, revision: null,
        legacy: false, snapshot: null, ambiguous: false, invalid: true,
      };
    }
  }
  const legacy = legacyToolkitPins(record);
  if (legacy.length === 0) {
    return {
      pinned: false, repository: null, revision: null,
      legacy: false, snapshot: null, ambiguous: false,
    };
  }
  const pin = legacy.at(-1);
  return {
    pinned: true,
    repository: pin.repository,
    revision: pin.revision,
    legacy: true,
    snapshot: pin.snapshot,
    ambiguous: legacy.length > 1,
  };
}

function sameBinding(left, right) {
  return left.repository === right.repository && left.revision === right.revision;
}

function legacyPinReferences(record, snapshotId) {
  const references = [];
  if (record.state?.activeInputs?.includes(snapshotId)) references.push('state.activeInputs');
  if (record.state?.latestOutput === snapshotId) references.push('state.latestOutput');
  if (record.state?.latestValidationRuntime === snapshotId) references.push('state.latestValidationRuntime');
  for (const snapshot of record.snapshots ?? []) {
    if (snapshot.parent === snapshotId) references.push(`${snapshot.id}.parent`);
    if (snapshot.supersededBy === snapshotId) references.push(`${snapshot.id}.supersededBy`);
  }
  for (const verification of record.verifications ?? []) {
    if (verification.snapshot === snapshotId) references.push(`${verification.id}.snapshot`);
    if (verification.replacement === snapshotId) references.push(`${verification.id}.replacement`);
  }
  for (const artifact of record.artifacts ?? []) if (artifact.baseline?.includes(snapshotId)) references.push(`${artifact.id}.baseline`);
  for (const gate of record.gates ?? []) if (gate.baseline?.includes(snapshotId)) references.push(`${gate.id}.baseline`);
  for (const task of record.tasks ?? []) {
    if (task.baseline === snapshotId) references.push(`${task.id}.baseline`);
    if (task.output === snapshotId) references.push(`${task.id}.output`);
    for (const check of task.validation ?? []) if (check.subject?.runtime === snapshotId) references.push(`${task.id}/${check.name}.subject.runtime`);
  }
  for (const review of record.implementationReviews ?? []) {
    if (review.output === snapshotId) references.push(`${review.id}.output`);
    if (review.runtime === snapshotId) references.push(`${review.id}.runtime`);
  }
  return references;
}

function removeLegacyToolkitPins(record, pins) {
  const ids = new Set(pins.map((pin) => pin.snapshot));
  for (const id of ids) {
    const references = legacyPinReferences(record, id);
    if (references.length > 0) {
      throw new Error(`Legacy toolkit snapshot ${id} is referenced by ${references.join(', ')} and cannot be migrated automatically.`);
    }
  }
  record.snapshots = record.snapshots.filter((snapshot) => !ids.has(snapshot.id));
}

export function bindToolkit(record, pin) {
  const normalized = normalizeToolkitBinding(pin);
  if (record.toolkit) {
    let existing;
    try {
      existing = normalizeToolkitBinding(record.toolkit);
    } catch {
      record.toolkit = normalized;
      return { changed: true, migrated: false, repaired: true, binding: normalized };
    }
    if (sameBinding(existing, normalized)) return { changed: false, migrated: false, repaired: false, binding: existing };
    throw new Error(
      `Toolkit is already pinned to ${existing.repository}#${existing.revision}. `
      + 'Refusing to replace it implicitly; toolkit upgrades must be explicit and preserve the previous dependency identity.',
    );
  }

  const legacy = legacyToolkitPins(record);
  if (legacy.length > 1) throw new Error('Multiple legacy toolkit source snapshots are active; resolve the ambiguity before migration.');
  if (legacy.length === 1 && !sameBinding(legacy[0], normalized)) {
    throw new Error(
      `Legacy toolkit source is pinned to ${legacy[0].repository}#${legacy[0].revision}. `
      + 'Pin the same dependency to migrate it, or perform an explicit toolkit upgrade.',
    );
  }

  record.toolkit = normalized;
  if (legacy.length === 1) removeLegacyToolkitPins(record, legacy);
  return { changed: true, migrated: legacy.length === 1, repaired: false, binding: normalized };
}

export function migrateLegacyToolkitBinding(record) {
  if (record.toolkit) return { changed: false, binding: normalizeToolkitBinding(record.toolkit), migrated: false };
  const legacy = legacyToolkitPins(record);
  if (legacy.length === 0) throw new Error('No legacy toolkit source snapshot exists to migrate.');
  if (legacy.length > 1) throw new Error('Multiple legacy toolkit source snapshots are active; resolve the ambiguity before migration.');
  const binding = normalizeToolkitBinding(legacy[0]);
  record.toolkit = binding;
  removeLegacyToolkitPins(record, legacy);
  return { changed: true, binding, migrated: true };
}

export function toolkitPromptSource(toolkit, path) {
  if (!path || !toolkit?.pinned || toolkit.ambiguous || toolkit.invalid) return null;
  return {
    scope: 'toolkit',
    repository: toolkit.repository,
    revision: toolkit.revision,
    path,
  };
}
