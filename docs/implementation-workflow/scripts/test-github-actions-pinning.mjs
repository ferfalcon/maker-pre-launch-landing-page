#!/usr/bin/env node

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowDirectory = join(root, '.github', 'workflows');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function leadingIndent(line) {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function stripInlineComment(value) {
  return value.replace(/\s+#.*$/, '').trim();
}

export function hasWritePermissions(source) {
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)permissions:\s*(.*?)\s*$/);
    if (!match) continue;

    const baseIndent = match[1].length;
    const inlineValue = stripInlineComment(match[2]);

    if (inlineValue === 'write-all' || /\bwrite\b/.test(inlineValue)) return true;
    if (inlineValue) continue;

    for (let childIndex = index + 1; childIndex < lines.length; childIndex += 1) {
      const child = lines[childIndex];
      const trimmed = child.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (leadingIndent(child) <= baseIndent) break;

      const permissionEntry = stripInlineComment(trimmed);
      if (/^[A-Za-z0-9_-]+:\s*write\s*$/.test(permissionEntry)) return true;
    }
  }

  return false;
}

export function findExternalActionUses(source) {
  const uses = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*(?:-\s*)?uses:\s*(.+?)\s*$/);
    if (!match) continue;

    let value = stripInlineComment(match[1]);
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('./') || value.startsWith('docker://')) continue;

    const separator = value.lastIndexOf('@');
    const action = separator > 0 ? value.slice(0, separator) : value;
    const ref = separator > 0 ? value.slice(separator + 1) : '';
    uses.push({ action, ref, line: index + 1, value });
  }

  return uses;
}

export function pinningViolations(source, path = '<workflow>') {
  if (!hasWritePermissions(source)) return [];

  return findExternalActionUses(source)
    .filter(({ ref }) => !/^[0-9a-f]{40}$/i.test(ref))
    .map(({ line, value }) => `${path}:${line} external action must use a full 40-character commit SHA: ${value}`);
}

const pinnedSha = 'a'.repeat(40);
assert(
  pinningViolations(`permissions:\n  contents: write\nsteps:\n  - uses: actions/checkout@v4`).length === 1,
  'Mutable action refs must fail in workflows with mapped write permissions.',
);
assert(
  pinningViolations(`permissions: write-all\nsteps:\n  - uses: actions/checkout@v4`).length === 1,
  'Mutable action refs must fail in workflows with write-all permissions.',
);
assert(
  pinningViolations(`permissions:\n  contents: read\nsteps:\n  - uses: actions/checkout@v4`).length === 0,
  'Read-only workflows are outside the privileged-action pinning policy.',
);
assert(
  pinningViolations(`jobs:\n  test:\n    permissions:\n      issues: write\n    steps:\n      - uses: actions/checkout@${pinnedSha} # v4.4.0`).length === 0,
  'Full commit SHAs must be accepted in privileged jobs.',
);
assert(
  pinningViolations(`permissions:\n  contents: write\nsteps:\n  - uses: ./local-action`).length === 0,
  'Repository-local actions must not require an external commit SHA.',
);

const workflowFiles = readdirSync(workflowDirectory)
  .filter((name) => ['.yml', '.yaml'].includes(extname(name)))
  .sort();

const violations = [];
let privilegedWorkflowCount = 0;

for (const workflowFile of workflowFiles) {
  const path = join(workflowDirectory, workflowFile);
  const source = readFileSync(path, 'utf8');
  if (!hasWritePermissions(source)) continue;

  privilegedWorkflowCount += 1;
  violations.push(...pinningViolations(source, `.github/workflows/${workflowFile}`));
}

assert(privilegedWorkflowCount > 0, 'Expected at least one GitHub Actions workflow with write permissions.');

if (violations.length > 0) {
  throw new Error(`Privileged GitHub Actions workflows contain mutable external action refs:\n- ${violations.join('\n- ')}`);
}

console.log(`Privileged GitHub Actions workflows use immutable SHA-pinned external actions (${privilegedWorkflowCount} workflow checked).`);
