#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const projects = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function project(name) {
  const path = mkdtempSync(join(tmpdir(), `design-workflow-${name}-`));
  projects.push(path);
  return path;
}

function run(cwd, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd, encoding: 'utf8', env: { ...process.env, TMPDIR: '/tmp' },
  });
  if (result.status !== expectedStatus) {
    throw new Error([
      `Command failed: design-workflow ${args.join(' ')}`,
      `Expected ${expectedStatus}, received ${result.status}`,
      result.stdout, result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return { stdout: result.stdout, stderr: result.stderr };
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Git command failed: git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

function initializeRepository(cwd) {
  git(cwd, ['init']);
  git(cwd, ['config', 'user.email', 'fixture@example.com']);
  git(cwd, ['config', 'user.name', 'Fixture']);
  git(cwd, ['branch', '-M', 'main']);
  writeFileSync(join(cwd, 'seed.txt'), 'baseline\n', 'utf8');
  git(cwd, ['add', 'seed.txt']);
  git(cwd, ['commit', '-m', 'Create baseline']);
  return git(cwd, ['rev-parse', 'HEAD']);
}

function record(cwd) {
  return JSON.parse(readFileSync(join(cwd, '.workflow', 'workflow-record.json'), 'utf8'));
}

function transactionPaths(cwd) {
  return [
    '.workflow/workflow-record.json',
    '.workflow/generated/WORKFLOW-STATUS.md',
    '.workflow/generated/SOURCE-INDEX.md',
    '.workflow/generated/ARTIFACT-INDEX.md',
    '.workflow/generated/TASK-INDEX.md',
    '.workflow/generated/TRACEABILITY.md',
    'WORKPACK.md',
  ].map((path) => join(cwd, path)).filter(existsSync);
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

function reviewAndApprove(cwd, selector) {
  run(cwd, ['artifact', 'review', selector, '--evidence', 'Reviewed fixture']);
  run(cwd, ['artifact', 'approve', selector, '--evidence', 'Approved fixture', '--approved-by', 'Fixture owner']);
}

function passAndAdvance(cwd, stage) {
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', `Stage ${stage} is ready`, '--approved-by', 'Fixture owner']);
  run(cwd, ['stage', 'advance']);
}

function testExecutableLifecycle() {
  const cwd = project('lifecycle');
  const baselineCommit = initializeRepository(cwd);
  run(cwd, [
    'init', '--name', 'Lifecycle fixture', '--profile', 'Express',
    '--design', 'https://figma.example/file?node-id=1-2', '--repository', '.',
  ]);
  let current = record(cwd);
  assert(current.schemaVersion === 2, 'init did not create a schema-v2 record');
  assert(current.artifacts.length === 1 && current.artifacts[0].type === 'WORKPACK', 'Express init did not scaffold Stage 0 only');
  const workpack = readFileSync(join(cwd, 'WORKPACK.md'), 'utf8');
  assert(workpack.startsWith('---\n'), 'CLI artifact does not contain real frontmatter');
  assert(!workpack.includes('Express Workpack Template'), 'CLI artifact retained template teaching content');
  assert(!workpack.includes('<!-- artifact:') && !workpack.includes('<!-- control:'), 'CLI artifact retained renderer markers');
  assert(!workpack.includes('Markdown-only Snapshot Registry') && !workpack.includes('## 1. Control state'), 'CLI artifact duplicated record-owned control state');
  for (const name of ['WORKFLOW-STATUS.md', 'SOURCE-INDEX.md', 'ARTIFACT-INDEX.md', 'TASK-INDEX.md', 'TRACEABILITY.md']) {
    assert(existsSync(join(cwd, '.workflow', 'generated', name)), `init did not generate ${name}`);
  }

  let before = capture(transactionPaths(cwd));
  run(cwd, ['stage', 'set', '1'], 1);
  assertByteIdentical(before, 'stage set compatibility error was mutating');
  run(cwd, ['mode', 'set', 'Task-by-task'], 1);
  assertByteIdentical(before, 'early task-by-task rejection was mutating');
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Missing actor'], 1);
  assertByteIdentical(before, 'missing gate approver rejection was mutating');

  run(cwd, ['snapshot', 'verify', 'SRC-DS-001', '--result', 'Unchanged', '--method', 'Named Figma version', '--evidence', 'Pinned version matched']);
  run(cwd, ['snapshot', 'verify', 'SRC-REPO-001', '--result', 'Unchanged', '--method', 'Git rev-parse', '--evidence', 'HEAD matched baseline']);
  reviewAndApprove(cwd, 'ART-WORKPACK');
  passAndAdvance(cwd, 0);
  for (let stage = 1; stage <= 5; stage += 1) passAndAdvance(cwd, stage);
  run(cwd, ['architecture', 'decide', 'not-required', '--reason', 'No cross-cutting structural decision']);
  passAndAdvance(cwd, 6);
  passAndAdvance(cwd, 7);
  passAndAdvance(cwd, 8);

  run(cwd, ['trace', 'define', 'REQ-FR-001', '--owner', 'ART-WORKPACK']);
  run(cwd, ['trace', 'define', 'SPEC-BEH-001', '--owner', 'ART-WORKPACK', '--references', 'REQ-FR-001']);
  run(cwd, ['trace', 'define', 'AC-001', '--owner', 'ART-WORKPACK', '--references', 'SPEC-BEH-001']);
  run(cwd, ['trace', 'define', 'PLAN-001', '--owner', 'ART-WORKPACK', '--references', 'AC-001']);
  run(cwd, ['trace', 'update', 'REQ-FR-001', '--required', 'true']);
  run(cwd, ['task', 'create', '--title', 'Implement fixture', '--references', 'PLAN-001']);
  run(cwd, [
    'task', 'validation', 'set', 'P01-T01', '--name', 'Build', '--kind', 'Build',
    '--required', 'true', '--status', 'Not executed', '--expected', 'Build succeeds',
    '--reason', 'Pending implementation', '--references', 'PLAN-001',
  ]);
  run(cwd, ['task', 'ready', 'P01-T01']);
  run(cwd, ['mode', 'set', 'Continuous documentation']);
  run(cwd, ['stage', 'review', '--result', 'Passed with assumptions', '--evidence', 'Documentation complete; implementation intentionally paused']);
  before = capture(transactionPaths(cwd));
  run(cwd, ['stage', 'advance'], 1);
  assertByteIdentical(before, 'continuous-documentation Stage 10 rejection was mutating');
  run(cwd, ['stage', 'review', '--result', 'Blocked', '--evidence', 'Return to gated execution']);
  run(cwd, ['mode', 'set', 'Gated']);
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Task set is ready and traced', '--approved-by', 'Fixture owner']);

  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-m', 'Record approved task plan']);
  const planningCommit = git(cwd, ['rev-parse', 'HEAD']);

  run(cwd, ['stage', 'advance']);
  run(cwd, ['task', 'start', 'P01-T01']);
  current = record(cwd);
  const taskStart = current.snapshots.find((item) => item.id === current.tasks[0].baseline);
  assert(taskStart?.role === 'Task start', 'task start did not capture an exact repository checkpoint');
  assert(taskStart.commit === planningCommit, 'task start checkpoint did not pin the approved planning HEAD');
  assert(taskStart.parent === 'SRC-REPO-001', 'task start checkpoint did not retain the original repository baseline');

  run(cwd, ['task', 'block', 'P01-T01', '--reason', 'Temporary fixture blocker']);
  current = record(cwd);
  assert(current.tasks[0].blocker.previousStatus === 'In progress', 'task blocker did not preserve previous status');
  run(cwd, ['task', 'unblock', 'P01-T01']);
  current = record(cwd);
  assert(current.tasks[0].status === 'In progress' && current.state.currentTask === 'P01-T01', 'unblock did not restore the prior in-progress state');

  writeFileSync(join(cwd, 'implementation.txt'), 'implemented\n', 'utf8');
  git(cwd, ['add', 'implementation.txt']);
  git(cwd, ['commit', '-m', 'Implement fixture']);
  const implementationCommit = git(cwd, ['rev-parse', 'HEAD']);

  before = capture(transactionPaths(cwd));
  run(cwd, ['task', 'complete', 'P01-T01', '--commit', baselineCommit, '--check', 'Build=Build passed'], 1);
  assertByteIdentical(before, 'non-HEAD task completion rejection was mutating');

  const tree = git(cwd, ['rev-parse', `${implementationCommit}^{tree}`]);
  const unrelatedCommit = git(cwd, ['commit-tree', tree, '-m', 'Unrelated root']);
  git(cwd, ['branch', 'unrelated', unrelatedCommit]);
  git(cwd, ['checkout', 'unrelated']);
  before = capture(transactionPaths(cwd));
  run(cwd, ['task', 'complete', 'P01-T01', '--commit', unrelatedCommit, '--check', 'Build=Build passed'], 1);
  assertByteIdentical(before, 'non-descendant task completion rejection was mutating');
  git(cwd, ['checkout', 'main']);

  run(cwd, ['task', 'complete', 'P01-T01', '--commit', implementationCommit, '--check', 'Build=Build passed at HEAD']);
  current = record(cwd);
  const check = current.tasks[0].validation[0];
  assert(check.status === 'Passed' && check.actual && check.executedAt && check.evidence.length > 0, 'completion did not record structured passed validation');
  assert(current.snapshots.find((item) => item.id === current.state.latestOutput)?.parent === current.tasks[0].baseline, 'completion output did not parent the exact task-start checkpoint');
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'All tasks completed with verified Git lineage', '--approved-by', 'Fixture owner']);
  run(cwd, ['stage', 'advance']);
  run(cwd, ['snapshot', 'verify', current.state.latestOutput, '--result', 'Expected workflow output', '--method', 'Git and runtime comparison', '--evidence', 'Final output reverified']);
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Final output and implementation review approved', '--approved-by', 'Fixture owner']);
  run(cwd, ['review', 'set-result', 'accepted', '--artifact', 'ART-WORKPACK', '--output', current.state.latestOutput, '--evidence', 'Accepted after final review', '--approved-by', 'Fixture owner']);
  run(cwd, ['validate']);
  run(cwd, ['sync', '--check']);
  current = record(cwd);
  assert(current.state.status === 'Complete' && current.implementationReviews.length === 1, 'final acceptance did not complete the workflow');
  const trace = readFileSync(join(cwd, '.workflow', 'generated', 'TRACEABILITY.md'), 'utf8');
  assert(trace.includes('REQ-FR-001') && trace.includes('P01-T01/Build (Passed)'), 'generated traceability lacks downstream validation coverage');
  assert(run(cwd, ['trace', 'REQ-FR-001']).stdout.includes('Definition:'), 'legacy trace alias did not show the canonical definition');

  before = capture(transactionPaths(cwd));
  run(cwd, ['trace', 'define', 'REQ-FR-002', '--owner', 'ART-WORKPACK', '--references', 'REQ-FR-002'], 1);
  assertByteIdentical(before, 'trace-cycle rejection was not transactionally byte-identical');
}

function testStageScaffoldingAndAdoption() {
  const cwd = project('scaffolding');
  initializeRepository(cwd);
  run(cwd, ['init', '--name', 'Scaffolding fixture', '--profile', 'Standard', '--repository', '.']);
  run(cwd, ['snapshot', 'verify', 'SRC-REPO-001', '--result', 'Unchanged', '--method', 'Git', '--evidence', 'Repository matched']);
  for (const type of ['SOURCE-BASELINE', 'PROJECT-CONTEXT', 'WORKFLOW-STATE']) reviewAndApprove(cwd, type);
  passAndAdvance(cwd, 0);
  assert(existsSync(join(cwd, 'DESIGN-AUDIT.md')), 'Stage 1 advancement did not scaffold DESIGN-AUDIT.md');
  reviewAndApprove(cwd, 'DESIGN-AUDIT');
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Audit complete', '--approved-by', 'Fixture owner']);

  const statusPath = join(cwd, '.workflow', 'generated', 'WORKFLOW-STATUS.md');
  writeFileSync(statusPath, `${readFileSync(statusPath, 'utf8')}stale generated edit\n`, 'utf8');
  let before = capture(transactionPaths(cwd));
  run(cwd, ['stage', 'advance'], 1);
  assertByteIdentical(before, 'stage advancement from stale generated state was mutating');
  run(cwd, ['sync']);

  writeFileSync(join(cwd, 'REQUIREMENTS.md'), '# Existing requirements\n\nPreserve this narrative.\n', 'utf8');
  const watched = [
    ...transactionPaths(cwd), join(cwd, 'SOURCE-BASELINE.md'), join(cwd, 'PROJECT-CONTEXT.md'),
    join(cwd, 'WORKFLOW-STATE.md'), join(cwd, 'DESIGN-AUDIT.md'), join(cwd, 'REQUIREMENTS.md'),
  ];
  before = capture(watched);
  run(cwd, ['stage', 'advance'], 1);
  assertByteIdentical(before, 'stage scaffolding overwrote or mutated around an unregistered narrative');
  run(cwd, ['artifact', 'adopt', 'requirements', '--path', 'REQUIREMENTS.md']);
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Adopted destination is registered', '--approved-by', 'Fixture owner']);
  run(cwd, ['stage', 'advance']);
  assert(readFileSync(join(cwd, 'REQUIREMENTS.md'), 'utf8').includes('Preserve this narrative.'), 'adopted narrative was overwritten');
  assert(record(cwd).state.stage === 2, 'adopted Stage 2 artifact did not permit advancement');

  run(cwd, ['stage', 'rewind', '1', '--reason', 'Recheck the adopted requirements boundary']);
  let current = record(cwd);
  assert(current.state.stage === 1 && current.state.status === 'In progress', 'rewind did not restore the requested stage');
  assert(current.gates.some((gate) => gate.status === 'Superseded' && gate.evidence.includes('Rewind to Stage 1')), 'rewind reason was not preserved in gate history');
  assert(current.artifacts.find((artifact) => artifact.type === 'REQUIREMENTS').status === 'Draft', 'rewind silently changed narrative lifecycle state');
  passAndAdvance(cwd, 1);

  reviewAndApprove(cwd, 'REQUIREMENTS');
  passAndAdvance(cwd, 2);
  reviewAndApprove(cwd, 'DESIGN');
  passAndAdvance(cwd, 3);
  reviewAndApprove(cwd, 'SPEC');
  passAndAdvance(cwd, 4);
  reviewAndApprove(cwd, 'DOCUMENT-REVIEW');
  passAndAdvance(cwd, 5);
  run(cwd, ['architecture', 'decide', 'required', '--reason', 'Standard work needs an explicit architecture decision record']);
  assert(existsSync(join(cwd, 'ARCHITECTURE.md')), 'required Standard architecture was not scaffolded atomically');
  reviewAndApprove(cwd, 'ARCHITECTURE');
  passAndAdvance(cwd, 6);
  reviewAndApprove(cwd, 'PLAN');
  passAndAdvance(cwd, 7);
  reviewAndApprove(cwd, 'PLAN-REVIEW');
  passAndAdvance(cwd, 8);
  reviewAndApprove(cwd, 'TASKS-INDEX');

  run(cwd, ['task', 'create', '--title', 'First Standard task']);
  const secondPath = join(cwd, 'Phase-01--Task-02.md');
  writeFileSync(secondPath, '# Existing second task narrative\n', 'utf8');
  let adoptionBefore = capture([...transactionPaths(cwd), secondPath]);
  run(cwd, ['task', 'create', '--id', 'P01-T02', '--title', 'Second Standard task'], 1);
  assertByteIdentical(adoptionBefore, 'task creation overwrote an unregistered second task narrative');
  run(cwd, ['artifact', 'adopt', 'task', '--path', 'Phase-01--Task-02.md', '--id', 'ART-TASK-P01-T02', '--task-id', 'P01-T02']);
  run(cwd, ['task', 'create', '--id', 'P01-T02', '--title', 'Second Standard task', '--prerequisites', 'P01-T01']);
  current = record(cwd);
  const taskArtifacts = current.artifacts.filter((artifact) => artifact.type === 'TASK' && artifact.status !== 'Superseded');
  assert(taskArtifacts.length === 2, 'multiple Standard tasks did not receive separate task artifacts');
  assert(new Set(taskArtifacts.map((artifact) => artifact.path)).size === 2, 'multiple Standard tasks reused one narrative path');
  for (const artifact of taskArtifacts) assert(existsSync(join(cwd, artifact.path)), `Missing task narrative ${artifact.path}`);
  for (const artifact of taskArtifacts) reviewAndApprove(cwd, artifact.id);
  run(cwd, ['task', 'ready', 'P01-T01']);
  run(cwd, ['task', 'ready', 'P01-T02']);
  run(cwd, ['stage', 'review', '--result', 'Passed', '--evidence', 'Sequential tasks are specified and Ready', '--approved-by', 'Fixture owner']);
}

function finishUpgradeTargets(cwd) {
  const current = record(cwd);
  const transition = current.profileTransitions.find((item) => item.status === 'In progress');
  for (const id of transition.targetArtifacts) {
    const artifact = current.artifacts.find((item) => item.id === id);
    if (artifact.status === 'Draft') run(cwd, ['artifact', 'review', id, '--evidence', 'Reconciled for profile upgrade']);
  }
  run(cwd, ['profile', 'upgrade', 'finish', '--evidence', 'Target profile artifacts reconciled', '--approved-by', 'Fixture owner']);
}

function testProfileUpgrades() {
  const sequential = project('upgrades');
  run(sequential, ['init', '--name', 'Upgrade fixture', '--profile', 'Express']);
  run(sequential, ['profile', 'upgrade', 'start', 'Lite', '--resume-stage', '0', '--reason', 'Broader component scope']);
  finishUpgradeTargets(sequential);
  assert(record(sequential).project.profile === 'Lite', 'Express to Lite upgrade failed');
  run(sequential, ['profile', 'upgrade', 'start', 'Standard', '--resume-stage', '0', '--reason', 'Separate documentation required']);
  finishUpgradeTargets(sequential);
  assert(record(sequential).project.profile === 'Standard', 'Lite to Standard upgrade failed');
  run(sequential, ['profile', 'upgrade', 'start', 'Full', '--resume-stage', '0', '--reason', 'Application-level scope required']);
  finishUpgradeTargets(sequential);
  assert(record(sequential).project.profile === 'Full', 'Standard to Full upgrade failed');
  const before = capture(transactionPaths(sequential));
  run(sequential, ['profile', 'upgrade', 'start', 'Lite', '--resume-stage', '0', '--reason', 'Unsupported downgrade'], 1);
  assertByteIdentical(before, 'profile downgrade rejection was mutating');

  const direct = project('direct-upgrade');
  run(direct, ['init', '--name', 'Direct upgrade fixture', '--profile', 'Express']);
  run(direct, ['trace', 'define', 'REQ-FR-001', '--owner', 'ART-WORKPACK']);
  run(direct, ['profile', 'upgrade', 'start', 'Standard', '--resume-stage', '0', '--reason', 'Multiple separate artifacts required']);
  let directRecord = record(direct);
  const directTransition = directRecord.profileTransitions.find((item) => item.status === 'In progress');
  assert(directTransition.targetArtifacts.includes('ART-REQUIREMENTS'), 'upgrade did not scaffold the target owner required by active trace');
  for (const id of directTransition.targetArtifacts) {
    const artifact = directRecord.artifacts.find((item) => item.id === id);
    if (artifact.status === 'Draft') run(direct, ['artifact', 'review', id, '--evidence', 'Reconciled for direct upgrade']);
  }
  const beforeFinish = capture(transactionPaths(direct));
  run(direct, ['profile', 'upgrade', 'finish', '--evidence', 'Target artifacts reconciled', '--approved-by', 'Fixture owner'], 1);
  assertByteIdentical(beforeFinish, 'profile finish with an obsolete trace owner was mutating');
  run(direct, ['trace', 'update', 'REQ-FR-001', '--owner', 'ART-REQUIREMENTS']);
  run(direct, ['profile', 'upgrade', 'finish', '--evidence', 'Artifacts and trace owners reconciled', '--approved-by', 'Fixture owner']);
  assert(record(direct).project.profile === 'Standard', 'Express to Standard upgrade failed');
}

function testMigration() {
  const cwd = project('migration');
  mkdirSync(join(cwd, '.workflow'), { recursive: true });
  cpSync(join(root, 'tests', 'fixtures', 'workflow-record.express.valid.json'), join(cwd, '.workflow', 'workflow-record.json'));
  writeFileSync(join(cwd, 'WORKPACK.md'), '# Legacy workpack\n', 'utf8');
  run(cwd, ['sync']);
  run(cwd, ['status']);
  let before = capture(transactionPaths(cwd));
  run(cwd, ['snapshot', 'add', '--kind', 'asset', '--reference', 'legacy mutation'], 1);
  assertByteIdentical(before, 'schema-v1 mutation was not read-only');
  const check = run(cwd, ['migrate', '--check'], 1);
  assert(check.stdout.includes('Schema version: 1 → 2'), 'migration check did not report its conversion');
  assertByteIdentical(before, 'migrate --check wrote files');
  run(cwd, ['migrate']);
  const migrated = record(cwd);
  assert(migrated.schemaVersion === 2, 'migration did not create schema v2');
  assert(migrated.legacyBoundary.gatesRequiredFromStage === 9, 'migration did not preserve its enforcement boundary');
  assert(migrated.traceItems.length > 0 && migrated.traceItems.every((item) => item.required === false), 'migration did not leave inferred trace items unclassified');
  assert(migrated.tasks[0].validation[0].kind === 'Other' && !migrated.tasks[0].validation[0].executedAt, 'migration invented validation execution metadata');
  run(cwd, ['migrate']);
  run(cwd, ['trace', 'define', 'AC-002', '--owner', 'ART-WORKPACK', '--references', 'SPEC-BEH-001']);
  run(cwd, ['trace', 'supersede', 'AC-001', '--by', 'AC-002']);
  const rewired = record(cwd);
  assert(rewired.traceItems.find((item) => item.id === 'AC-001').supersededBy === 'AC-002', 'trace supersession history was not recorded');
  assert(rewired.tasks[0].references.includes('AC-002') && !rewired.tasks[0].references.includes('AC-001'), 'trace supersession did not rewire downstream task references');
  run(cwd, ['validate']);
}

function testMarkdownOnlyRendering() {
  const cwd = project('markdown-only');
  run(cwd, ['init', '--name', 'Markdown fixture', '--profile', 'Standard', '--control', 'markdown-only']);
  assert(!existsSync(join(cwd, '.workflow', 'workflow-record.json')), 'Markdown-only init created an executable record');
  for (const name of ['SOURCE-BASELINE.md', 'PROJECT-CONTEXT.md', 'WORKFLOW-STATE.md']) {
    const content = readFileSync(join(cwd, name), 'utf8');
    assert(content.startsWith('---\n') && !content.includes(' Template'), `${name} was not rendered as a project artifact`);
    assert(!content.includes('<!-- artifact:') && !content.includes('<!-- control:'), `${name} retained template markers`);
  }
  assert(readFileSync(join(cwd, 'SOURCE-BASELINE.md'), 'utf8').includes('Markdown-only Snapshot Registry'), 'Markdown-only source registry was omitted');
  assert(readFileSync(join(cwd, 'WORKFLOW-STATE.md'), 'utf8').includes('Markdown-only Fallback'), 'Markdown-only workflow registry was omitted');
  run(cwd, ['artifact', 'scaffold', 'plan', '--control', 'markdown-only', '--project', 'Markdown fixture', '--profile', 'Standard']);
  assert(existsSync(join(cwd, 'PLAN.md')), 'Markdown-only artifact scaffold did not create PLAN.md');
}

try {
  testExecutableLifecycle();
  testStageScaffoldingAndAdoption();
  testProfileUpgrades();
  testMigration();
  testMarkdownOnlyRendering();
  console.log('Workflow CLI v2 lifecycle, migration, rendering, transaction, Git-lineage, and upgrade tests passed.');
} finally {
  for (const path of projects) rmSync(path, { recursive: true, force: true });
}
