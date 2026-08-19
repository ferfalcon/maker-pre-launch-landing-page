#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function fail(message) { throw new Error(message); }
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function writeJson(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); }

function legacyToolkitBinding(record) {
  const candidates = (record.snapshots ?? []).filter((snapshot) => (
    snapshot?.status === 'Active'
    && typeof snapshot.reference === 'string'
    && snapshot.reference.startsWith('toolkit+github://')
    && SHA_PATTERN.test(String(snapshot.commit ?? ''))
  )).map((snapshot) => {
    const payload = snapshot.reference.slice('toolkit+github://'.length);
    const separator = payload.lastIndexOf('@');
    if (separator <= 0) return null;
    const repository = payload.slice(0, separator);
    if (!REPOSITORY_PATTERN.test(repository)) return null;
    return { repository, revision: String(snapshot.commit).toLowerCase() };
  }).filter(Boolean);
  if (candidates.length > 1) fail('Multiple active legacy toolkit bindings are present; resolve the ambiguity before remote execution.');
  return candidates[0] ?? null;
}

export function resolveRuntimeToolkit({ project, bridgeRepository, bridgeRevision }) {
  if (!REPOSITORY_PATTERN.test(bridgeRepository)) fail('Remote bridge repository identity is invalid.');
  if (!SHA_PATTERN.test(bridgeRevision)) fail('Remote bridge revision is not an exact Git SHA.');

  const recordPath = resolve(project, '.workflow', 'workflow-record.json');
  if (!existsSync(recordPath)) {
    return { repository: bridgeRepository, revision: bridgeRevision.toLowerCase(), source: 'bridge-bootstrap' };
  }

  const record = readJson(recordPath);
  const binding = record.toolkit
    ? {
        repository: record.toolkit.repository,
        revision: String(record.toolkit.revision ?? record.toolkit.commit ?? '').toLowerCase(),
      }
    : legacyToolkitBinding(record);

  if (!binding) {
    return { repository: bridgeRepository, revision: bridgeRevision.toLowerCase(), source: 'bridge-bootstrap-unpinned' };
  }
  if (!REPOSITORY_PATTERN.test(binding.repository) || !SHA_PATTERN.test(binding.revision)) {
    fail('Recorded toolkit binding is malformed and cannot be used for remote execution.');
  }
  if (binding.repository !== bridgeRepository) {
    fail(`Recorded toolkit repository ${binding.repository} does not match trusted remote bridge repository ${bridgeRepository}.`);
  }
  return { ...binding, source: record.toolkit ? 'canonical-record' : 'legacy-record' };
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) fail('Resolver options must use --name value pairs.');
    options[key.slice(2)] = value;
  }
  return options;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const resultPath = options.result ? resolve(options.result) : null;
  try {
    const runtime = resolveRuntimeToolkit({
      project: options.project,
      bridgeRepository: options['bridge-repository'],
      bridgeRevision: options['bridge-revision'],
    });
    if (!options['github-output']) fail('--github-output is required.');
    writeFileSync(resolve(options['github-output']), `toolkit-repository=${runtime.repository}\ntoolkit-revision=${runtime.revision}\n`, { flag: 'a' });
    console.log(`Resolved workflow runtime ${runtime.repository}#${runtime.revision} (${runtime.source}).`);
  } catch (error) {
    if (resultPath) {
      let existing = { status: 'pending' };
      try { existing = readJson(resultPath); } catch {}
      writeJson(resultPath, { ...existing, status: 'failed', message: error.message });
    }
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) main();
