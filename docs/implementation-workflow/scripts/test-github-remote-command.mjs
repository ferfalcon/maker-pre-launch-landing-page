#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  executeRequest,
  parseCommandIssue,
  validateCommandArgs,
  validateTargetRef,
} from '../scripts/github-remote-command.mjs';
import { resolveRuntimeToolkit } from '../scripts/resolve-remote-toolkit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reusable = readFileSync(join(root, '.github', 'workflows', 'design-workflow-command.yml'), 'utf8');
const caller = readFileSync(join(root, 'templates', 'github', 'design-workflow-command.yml.template'), 'utf8');
const orchestration = readFileSync(join(root, 'workflow', 'GitHub-Remote-Execution.md'), 'utf8');
const toolkitRepository = 'ferfalcon/figma-to-implementation-workflow';
const toolkitRevision = 'b'.repeat(40);

function event(overrides = {}) {
  const payload = {
    protocolVersion: 1,
    targetRef: 'feature/workflow',
    expectedHead: 'a'.repeat(40),
    args: ['stage', 'advance'],
    ...(overrides.payload ?? {}),
  };
  return {
    action: 'opened',
    repository: { full_name: 'ferfalcon/example' },
    issue: {
      number: 17,
      title: '[design-workflow] command',
      author_association: 'OWNER',
      user: { login: 'ferfalcon' },
      body: `\`\`\`design-workflow-command\n${JSON.stringify(payload)}\n\`\`\``,
      ...(overrides.issue ?? {}),
    },
  };
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function makeExecutionFixture() {
  const temp = mkdtempSync(join(tmpdir(), 'design-workflow-remote-'));
  const bare = join(temp, 'origin.git');
  const seed = join(temp, 'seed');
  const work = join(temp, 'work');
  mkdirSync(seed);
  execFileSync('git', ['init', '--bare', bare], { stdio: 'ignore' });
  execFileSync('git', ['init'], { cwd: seed, stdio: 'ignore' });
  git(seed, 'config', 'user.name', 'Fixture');
  git(seed, 'config', 'user.email', 'fixture@example.com');
  mkdirSync(join(seed, '.workflow', 'generated'), { recursive: true });
  writeFileSync(join(seed, '.workflow', 'workflow-record.json'), `${JSON.stringify({
    schemaVersion: 2,
    toolkit: { repository: toolkitRepository, revision: toolkitRevision },
    state: { stage: 1 },
  })}\n`);
  writeFileSync(join(seed, '.workflow', 'generated', 'STATE.txt'), 'before\n');
  git(seed, 'add', '.');
  git(seed, 'commit', '-m', 'Initial fixture');
  git(seed, 'branch', '-M', 'feature/workflow');
  git(seed, 'remote', 'add', 'origin', bare);
  git(seed, 'push', '-u', 'origin', 'feature/workflow');
  const expectedHead = git(seed, 'rev-parse', 'HEAD');
  execFileSync('git', ['clone', '--branch', 'feature/workflow', bare, work], { stdio: 'ignore' });

  const fakeCli = join(temp, 'fake-cli.mjs');
  writeFileSync(fakeCli, `import { readFileSync, writeFileSync } from 'node:fs';\n`
    + `const args = process.argv.slice(2);\n`
    + `if (args[0] === 'stage' && args[1] === 'check') { console.log(JSON.stringify({ decision: { recordable: false, findings: ['Needs evidence'] } })); process.exit(1); }\n`
    + `if (args[0] === 'stage' && args[1] === 'advance') { const path = '.workflow/workflow-record.json'; const record = JSON.parse(readFileSync(path, 'utf8')); record.state.stage = 2; writeFileSync(path, JSON.stringify(record) + '\\n'); writeFileSync('.workflow/generated/STATE.txt', 'after\\n'); process.exit(0); }\n`
    + `if (args[0] === 'mode' && args[1] === 'set') { writeFileSync('.workflow/generated/STATE.txt', 'should-rollback\\n'); process.exit(2); }\n`
    + `if (args[0] === 'validate' || (args[0] === 'sync' && args[1] === '--check')) process.exit(0);\n`
    + `process.exit(2);\n`);

  const failingReadOnlyCli = join(temp, 'failing-readonly-cli.mjs');
  writeFileSync(failingReadOnlyCli, `const args = process.argv.slice(2);\n`
    + `if (args[0] === 'validate' || (args[0] === 'sync' && args[1] === '--check')) process.exit(1);\n`
    + `process.exit(2);\n`);

  return {
    temp, bare, work, fakeCli, failingReadOnlyCli, expectedHead,
  };
}

const parsed = parseCommandIssue(event());
assert.equal(parsed.targetRef, 'feature/workflow');
assert.equal(parsed.expectedHead, 'a'.repeat(40));
assert.deepEqual(parsed.args, ['stage', 'advance']);
assert.equal(parsed.requester, 'ferfalcon');

assert.throws(() => parseCommandIssue(event({ issue: { author_association: 'CONTRIBUTOR' } })), /not authorized/);
assert.throws(() => parseCommandIssue(event({ payload: { expectedHead: 'main' } })), /40-character Git SHA/);
assert.throws(() => parseCommandIssue(event({ payload: { targetRef: '../escape' } })), /targetRef/);
assert.throws(() => validateTargetRef('feature/../main'), /safe branch/);
assert.throws(() => validateCommandArgs(['status']), /supported design-workflow/);
assert.throws(() => validateCommandArgs(['migrate', '--check']), /not supported/);
assert.throws(() => validateCommandArgs(['stage', 'advance', '--record', '../record.json']), /--record/);
assert.throws(() => validateCommandArgs(['init', '--control', 'markdown-only']), /--control/);
assert.throws(() => validateCommandArgs(['artifact', 'adopt', 'requirements', '--path', '../outside.md']), /escape/);
assert.throws(() => validateCommandArgs(['init', '--repository', '..']), /--repository \./);
assert.throws(() => validateCommandArgs(['stage', 'advance', 'unexpected']), /command shapes/);
assert.deepEqual(validateCommandArgs(['stage', 'check', '--json']), ['stage', 'check', '--json']);
assert.deepEqual(validateCommandArgs(['validate']), ['validate']);
assert.deepEqual(validateCommandArgs(['sync', '--check']), ['sync', '--check']);
assert.deepEqual(
  validateCommandArgs(['task', 'validation', 'set', 'P01-T01', '--name', 'Build']),
  ['task', 'validation', 'set', 'P01-T01', '--name', 'Build'],
);

assert.match(reusable, /^\s*workflow_call:\s*$/m);
assert.match(reusable, /repository: \$\{\{ job\.workflow_repository \}\}/);
assert.match(reusable, /ref: \$\{\{ job\.workflow_sha \}\}/);
assert.match(reusable, /Resolve pinned workflow runtime/);
assert.match(reusable, /steps\.resolve-runtime\.outputs\.toolkit-revision/);
assert.match(reusable, /contents: write/);
assert.match(reusable, /issues: write/);
assert.match(reusable, /continue-on-error: true/);
assert.doesNotMatch(reusable, /pull_request_target/);
assert.doesNotMatch(reusable, /workflow_dispatch/);
assert.doesNotMatch(reusable, /force-with-lease|--force|force: true/);

assert.match(caller, /^\s*issues:\s*$/m);
assert.match(caller, /types:\s*\n\s*- opened/);
assert.match(caller, /@<REMOTE_EXECUTOR_REVISION>/);
assert.match(caller, /contents: write/);
assert.match(caller, /issues: write/);
assert.doesNotMatch(caller, /pull_request_target/);

assert.match(orchestration, /default branch/i);
assert.match(orchestration, /expectedHead/);
assert.match(orchestration, /non-force/i);
assert.match(orchestration, /must not replace human approval/i);
assert.match(orchestration, /GITHUB_TOKEN/i);

const resolverFixture = mkdtempSync(join(tmpdir(), 'design-workflow-resolver-'));
try {
  mkdirSync(join(resolverFixture, '.workflow'));
  writeFileSync(join(resolverFixture, '.workflow', 'workflow-record.json'), JSON.stringify({
    schemaVersion: 2,
    toolkit: { repository: toolkitRepository, revision: 'a'.repeat(40) },
  }));
  assert.deepEqual(resolveRuntimeToolkit({
    project: resolverFixture,
    bridgeRepository: toolkitRepository,
    bridgeRevision: toolkitRevision,
  }), {
    repository: toolkitRepository,
    revision: 'a'.repeat(40),
    source: 'canonical-record',
  });
  assert.throws(() => resolveRuntimeToolkit({
    project: resolverFixture,
    bridgeRepository: 'trusted/other-toolkit',
    bridgeRevision: toolkitRevision,
  }), /does not match trusted remote bridge repository/);
} finally {
  rmSync(resolverFixture, { recursive: true, force: true });
}

const fixture = makeExecutionFixture();
try {
  const baseRequest = {
    repository: 'ferfalcon/example',
    issueNumber: 17,
    requester: 'ferfalcon',
    requesterAssociation: 'OWNER',
    targetRef: 'feature/workflow',
    expectedHead: fixture.expectedHead,
  };
  const readResult = executeRequest({
    request: { ...baseRequest, args: ['stage', 'check', '--json'], command: 'stage check' },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  });
  assert.equal(readResult.status, 'succeeded');
  assert.equal(readResult.commandExitCode, 1);
  assert.equal(readResult.changed, false);
  assert.match(readResult.output, /Needs evidence/);
  assert.equal(git(fixture.work, 'status', '--porcelain'), '');

  const validateResult = executeRequest({
    request: { ...baseRequest, args: ['validate'], command: 'validate' },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  });
  assert.equal(validateResult.status, 'succeeded');
  assert.equal(validateResult.commandExitCode, 0);
  assert.equal(validateResult.changed, false);

  const syncCheckResult = executeRequest({
    request: { ...baseRequest, args: ['sync', '--check'], command: 'sync --check' },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  });
  assert.equal(syncCheckResult.status, 'succeeded');
  assert.equal(syncCheckResult.commandExitCode, 0);
  assert.equal(syncCheckResult.changed, false);
  assert.equal(git(fixture.work, 'status', '--porcelain'), '');

  assert.throws(() => executeRequest({
    request: { ...baseRequest, args: ['validate'], command: 'validate' },
    project: fixture.work,
    cliPath: fixture.failingReadOnlyCli,
    toolkitRepository,
    toolkitRevision,
  }), /design-workflow validate failed/);
  assert.equal(git(fixture.work, 'status', '--porcelain'), '');

  assert.throws(() => executeRequest({
    request: { ...baseRequest, args: ['sync', '--check'], command: 'sync --check' },
    project: fixture.work,
    cliPath: fixture.failingReadOnlyCli,
    toolkitRepository,
    toolkitRevision,
  }), /design-workflow sync --check failed/);
  assert.equal(git(fixture.work, 'status', '--porcelain'), '');

  const mutationResult = executeRequest({
    request: { ...baseRequest, args: ['stage', 'advance'], command: 'stage advance' },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  });
  assert.equal(mutationResult.status, 'succeeded');
  assert.equal(mutationResult.changed, true);
  assert.notEqual(mutationResult.after, fixture.expectedHead);
  assert.equal(git(fixture.bare, 'rev-parse', 'refs/heads/feature/workflow'), mutationResult.after);

  assert.throws(() => executeRequest({
    request: { ...baseRequest, args: ['stage', 'advance'], command: 'stage advance' },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  }), /Stale command/);

  const rollbackHead = mutationResult.after;
  assert.throws(() => executeRequest({
    request: {
      ...baseRequest,
      expectedHead: rollbackHead,
      args: ['mode', 'set', 'Gated'],
      command: 'mode set Gated',
    },
    project: fixture.work,
    cliPath: fixture.fakeCli,
    toolkitRepository,
    toolkitRevision,
  }), /design-workflow mode set Gated failed/);
  assert.equal(git(fixture.work, 'rev-parse', 'HEAD'), rollbackHead);
  assert.equal(git(fixture.work, 'status', '--porcelain'), '');
  assert.equal(readFileSync(join(fixture.work, '.workflow', 'generated', 'STATE.txt'), 'utf8'), 'after\n');
  assert.equal(git(fixture.bare, 'rev-parse', 'refs/heads/feature/workflow'), rollbackHead);
} finally {
  rmSync(fixture.temp, { recursive: true, force: true });
}

console.log('GitHub remote command bridge tests passed.');
