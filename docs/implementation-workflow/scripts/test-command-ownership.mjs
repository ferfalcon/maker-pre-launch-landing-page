#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const wrapper = read('cli/lib/workflow-cli.mjs');
const core = read('cli/lib/commands-v2.mjs');
const support = read('cli/lib/command-support.mjs');
const stage = read('cli/lib/commands/stage.mjs');
const task = read('cli/lib/commands/task.mjs');

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

const domainModules = [
  'artifact',
  'review',
  'snapshot',
  'stage',
  'task',
  'trace',
];
for (const domain of domainModules) {
  assert(
    core.includes(`./commands/${domain}.mjs`),
    `commands-v2.mjs must delegate the ${domain} domain to cli/lib/commands/${domain}.mjs.`,
  );
}

for (const extractedCommand of [
  'commandArchitecture',
  'commandArtifact',
  'commandMode',
  'commandProfile',
  'commandReview',
  'commandSnapshot',
  'commandStage',
  'commandTask',
  'commandTrace',
]) {
  assert(
    !core.includes(`export function ${extractedCommand}(`),
    `commands-v2.mjs must not re-implement extracted command ${extractedCommand}.`,
  );
}

for (const forbiddenCoreDependency of [
  "./git-worktree-policy.mjs",
  "./task-lineage.mjs",
  "./repository-binding.mjs",
  "./workflow-transitions.mjs",
]) {
  assert(
    !core.includes(forbiddenCoreDependency),
    `commands-v2.mjs must not reclaim domain behavior through ${forbiddenCoreDependency}.`,
  );
}

assert(
  core.split('\n').length <= 420,
  'commands-v2.mjs exceeded the router/core-shell size budget; extract new mutation domains instead of growing the monolith.',
);

assert(
  support.includes('export function addArtifactCandidate(')
    && support.includes('export function invalidateCurrentGate('),
  'Shared command infrastructure must remain in command-support.mjs instead of being duplicated by domains.',
);

for (const canonicalDependency of [
  "../workflow-actions.mjs",
  "../workflow-transitions.mjs",
]) {
  assert(
    stage.includes(canonicalDependency),
    `Stage command domain must own canonical lifecycle behavior through ${canonicalDependency}.`,
  );
}
assert(
  stage.includes('rewindStageForReplanning(cwd, stdout, stderr, positionals, options)')
    && stage.includes('startProfileUpgradeForReplanning(cwd, stdout, stderr, positionals, options)')
    && stage.includes('stageAdvanceFindings(record)'),
  'Stage command domain must use the canonical replanning and advancement implementations.',
);

for (const canonicalDependency of [
  "../git-worktree-policy.mjs",
  "../repository-binding.mjs",
  "../task-lineage.mjs",
  "../workflow-diagnostics.mjs",
]) {
  assert(
    task.includes(canonicalDependency),
    `Task command domain must own canonical task behavior through ${canonicalDependency}.`,
  );
}
assert(
  task.includes('startTaskAtCurrentHead(path, id)')
    && task.includes('taskCompletionGitFindings(')
    && task.includes('verifyRepositoryCommit(')
    && task.includes('workflowDiagnostics(path, prepared.record)'),
  'Task command domain must preserve canonical Git lineage, completion policy, and diagnostics.',
);

console.log('Core lifecycle commands have one executable owner; commands-v2 is a bounded router/core shell and workflow-cli remains an extension router.');
