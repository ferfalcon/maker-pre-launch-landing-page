#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wrapper = readFileSync(join(root, 'cli', 'lib', 'workflow-cli.mjs'), 'utf8');
const core = readFileSync(join(root, 'cli', 'lib', 'commands-v2.mjs'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const forbiddenImport of [
  "./git-worktree-policy.mjs",
  "./task-lineage.mjs",
  "./workflow-actions.mjs",
  "./workflow-diagnostics.mjs",
  "./workflow-transitions.mjs",
]) {
  assert(
    !wrapper.includes(forbiddenImport),
    `workflow-cli.mjs must not own core lifecycle behavior through ${forbiddenImport}.`,
  );
}

for (const shadowRoute of [
  "command === 'status'",
  "command === 'validate'",
  "command === 'next'",
  "positionals[1] === 'rewind'",
  "positionals[2] === 'start')",
  "positionals[1] === 'start' && positionals[2]",
  "positionals[1] === 'complete' && positionals[2]",
]) {
  assert(
    !wrapper.includes(shadowRoute),
    `workflow-cli.mjs contains a shadow core command route: ${shadowRoute}`,
  );
}

for (const canonicalDependency of [
  "./task-lineage.mjs",
  "./workflow-diagnostics.mjs",
  "./workflow-transitions.mjs",
]) {
  assert(
    core.includes(canonicalDependency),
    `commands-v2.mjs must own canonical core behavior through ${canonicalDependency}.`,
  );
}

assert(
  core.includes('startTaskAtCurrentHead(path, id)'),
  'Core task start must use the canonical Git-lineage implementation.',
);
assert(
  core.includes('rewindStageForReplanning(cwd, stdout, stderr, positionals, options)'),
  'Core stage rewind must use the canonical replanning implementation.',
);
assert(
  core.includes('startProfileUpgradeForReplanning(cwd, stdout, stderr, positionals, options)'),
  'Core profile-upgrade start must use the canonical replanning implementation.',
);
assert(
  core.includes('workflowDiagnostics(path, record)'),
  'Core read commands must use canonical workflow diagnostics.',
);

console.log('Core lifecycle commands have one executable owner; workflow-cli remains an extension router.');
