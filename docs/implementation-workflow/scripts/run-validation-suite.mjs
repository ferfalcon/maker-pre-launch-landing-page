#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const validationSteps = [
  { name: 'schema drift', script: 'scripts/generate-workflow-schema.mjs', args: ['--check'] },
  { name: 'repository contract', script: 'scripts/validate-workflow.mjs' },
  { name: 'validation runner', script: 'scripts/test-validation-runner.mjs' },
  { name: 'path safety', script: 'scripts/test-path-safety.mjs' },
  { name: 'release metadata', script: 'scripts/test-release-metadata.mjs' },
  { name: 'Figma preparation authority', script: 'scripts/test-figma-preparation-authority.mjs' },
  { name: 'agent bootstrap authority', script: 'scripts/test-agent-bootstrap-authority.mjs' },
  { name: 'entrypoint authority', script: 'scripts/test-entrypoint-authority.mjs' },
  { name: 'CLI layering', script: 'scripts/test-cli-layering.mjs' },
  { name: 'workflow validation architecture', script: 'scripts/test-workflow-validation-architecture.mjs' },
  { name: 'workflow record', script: 'scripts/test-workflow-record.mjs' },
  { name: 'canonical invariants', script: 'scripts/test-canonical-invariants.mjs' },
  { name: 'stage gates', script: 'scripts/test-stage-gates.mjs' },
  { name: 'generated state', script: 'scripts/test-generated-state.mjs' },
  { name: 'agent projection', script: 'scripts/test-agent-projection.mjs' },
  { name: 'record concurrency', script: 'scripts/test-record-concurrency.mjs' },
  { name: 'artifact renderer', script: 'scripts/test-artifact-renderer.mjs' },
  { name: 'task phases', script: 'scripts/test-task-phases.mjs' },
  { name: 'orchestration', script: 'scripts/test-orchestration.mjs' },
  { name: 'toolkit source', script: 'scripts/test-toolkit-source.mjs' },
  { name: 'packed install', script: 'scripts/test-packed-install.mjs' },
  { name: 'subject integrity', script: 'scripts/test-subject-integrity.mjs' },
  { name: 'agent context', script: 'scripts/test-agent-context.mjs' },
  { name: 'command ownership', script: 'scripts/test-command-ownership.mjs' },
  { name: 'Git worktree policy', script: 'scripts/test-git-worktree-policy.mjs' },
  { name: 'repository portability', script: 'scripts/test-repository-portability.mjs' },
  { name: 'workspace resolution', script: 'scripts/test-workspace-resolution.mjs' },
  { name: 'task start checkpoints', script: 'scripts/test-task-start-checkpoints.mjs' },
  { name: 'replanning transitions', script: 'scripts/test-replanning-transitions.mjs' },
  { name: 'CLI', script: 'scripts/test-cli.mjs' },
  { name: 'sequential task lineage', script: 'scripts/test-sequential-task-lineage.mjs' },
  { name: 'GitHub remote command bridge', script: 'scripts/test-github-remote-command.mjs' },
  { name: 'GitHub remote authorization', script: 'scripts/test-github-remote-authorization.mjs' },
  { name: 'GitHub remote filesystem containment', script: 'scripts/test-github-remote-paths.mjs' },
  { name: 'GitHub Actions pinning', script: 'scripts/test-github-actions-pinning.mjs' },
  { name: 'package manifest', script: 'scripts/test-package-manifest.mjs' },
];

function formatDuration(durationMs) {
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
  return `${(durationMs / 1000).toFixed(2)} s`;
}

function runStep(step, { cwd = root, stdio = 'inherit', log = console.log } = {}) {
  const startedAt = performance.now();
  log(`\n→ ${step.name}`);

  const result = spawnSync(process.execPath, [step.script, ...(step.args ?? [])], {
    cwd,
    stdio,
  });
  const durationMs = performance.now() - startedAt;
  const passed = result.status === 0 && !result.error;

  if (result.error) {
    log(`  ${result.error.message}`);
  } else if (result.signal) {
    log(`  terminated by signal ${result.signal}`);
  }

  log(`${passed ? 'PASS' : 'FAIL'} ${step.name} (${formatDuration(durationMs)})`);

  return {
    name: step.name,
    passed,
    status: result.status,
    signal: result.signal ?? null,
    error: result.error?.message ?? null,
    durationMs,
  };
}

export function runValidationSuite(steps = validationSteps, options = {}) {
  const log = options.log ?? console.log;
  const results = [];
  const startedAt = performance.now();

  for (const step of steps) {
    results.push(runStep(step, { ...options, log }));
  }

  const durationMs = performance.now() - startedAt;
  const failures = results.filter((result) => !result.passed);

  log('\nValidation summary');
  for (const result of results) {
    log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name} (${formatDuration(result.durationMs)})`);
  }
  log(`\n${results.length - failures.length} passed, ${failures.length} failed in ${formatDuration(durationMs)}.`);

  if (failures.length > 0) {
    log('Failed checks:');
    for (const failure of failures) log(`- ${failure.name}`);
  }

  return {
    passed: failures.length === 0,
    results,
    failures,
    durationMs,
  };
}

const directInvocation = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (directInvocation) {
  const report = runValidationSuite();
  if (!report.passed) process.exitCode = 1;
}
