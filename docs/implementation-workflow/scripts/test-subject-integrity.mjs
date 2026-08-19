#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enrichIntegrityCandidate, subjectIntegrityFindings } from '../cli/lib/subject-integrity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'cli', 'design-workflow.mjs');
const projects = [];
const toolkitRevision = git(root, ['rev-parse', 'HEAD']).toLowerCase();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function project(name) {
  const path = mkdtempSync(join(tmpdir(), `design-workflow-integrity-${name}-`));
  projects.push(path);
  return path;
}

function run(cwd, args, expectedStatus = 0, executable = cli) {
  const result = spawnSync(process.execPath, [executable, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: '/tmp' },
  });
  if (result.status !== expectedStatus) {
    throw new Error([
      `Command failed: design-workflow ${args.join(' ')}`,
      `Expected ${expectedStatus}, received ${result.status}`,
      result.stdout, result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}

function recordPath(cwd) {
  return join(cwd, '.workflow', 'workflow-record.json');
}

function record(cwd) {
  return JSON.parse(readFileSync(recordPath(cwd), 'utf8'));
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
}

function initGitRepository(cwd) {
  git(cwd, ['init']);
  git(cwd, ['config', 'user.email', 'workflow@example.test']);
  git(cwd, ['config', 'user.name', 'Workflow Test']);
  writeFileSync(join(cwd, 'app.txt'), 'baseline\n', 'utf8');
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-m', 'baseline']);
  return git(cwd, ['rev-parse', 'HEAD']);
}

try {
  const artifactProject = project('artifact');
  run(artifactProject, [
    'init', '--name', 'Integrity fixture', '--profile', 'Express',
    '--toolkit-repository', 'ferfalcon/figma-to-implementation-workflow',
    '--toolkit-revision', toolkitRevision,
  ]);
  run(artifactProject, ['artifact', 'review', 'workpack', '--evidence', 'Reviewed']);
  run(artifactProject, ['artifact', 'approve', 'workpack', '--evidence', 'Approved', '--approved-by', 'test']);

  let current = record(artifactProject);
  const artifact = current.artifacts.find((item) => item.type === 'WORKPACK');
  const artifactPath = join(artifactProject, artifact.path);
  assert(artifact.approvedRevision?.algorithm === 'sha256', 'Artifact approval must record sha256 identity.');
  assert(artifact.approvedRevision?.digest === sha256(artifactPath), 'Artifact approval digest must match approved bytes.');

  const gateCandidate = structuredClone(current);
  gateCandidate.gates.push({
    id: 'GATE-999', stage: current.state.stage, status: 'Active', result: 'Passed',
    baseline: [...current.state.activeInputs], verifications: [], artifacts: [artifact.id],
    evidence: 'Synthetic gate identity fixture', recordedAt: new Date().toISOString(), approvedBy: 'test',
  });
  enrichIntegrityCandidate(recordPath(artifactProject), current, gateCandidate);
  const gate = gateCandidate.gates.at(-1);
  const gateRevision = gate.artifactRevisions?.find((item) => item.artifact === artifact.id);
  assert(gateRevision?.revision?.digest === artifact.approvedRevision.digest, 'Passing gate must pin the approved artifact revision.');

  const preservedGateCandidate = structuredClone(gateCandidate);
  preservedGateCandidate.artifacts.find((item) => item.id === artifact.id).approvedRevision = {
    algorithm: 'sha256',
    digest: 'f'.repeat(64),
  };
  enrichIntegrityCandidate(recordPath(artifactProject), gateCandidate, preservedGateCandidate);
  assert(
    preservedGateCandidate.gates.at(-1).artifactRevisions.find((item) => item.artifact === artifact.id).revision.digest
      === gateRevision.revision.digest,
    'Existing gate evidence must never be rewritten when artifact revisions change later.',
  );

  appendFileSync(artifactPath, '\nchanged after approval\n', 'utf8');
  const stale = run(artifactProject, ['validate'], 1);
  assert(`${stale.stdout}\n${stale.stderr}`.includes('content no longer matches approvedRevision'), 'Validation must detect post-approval artifact edits.');
  const staleStatus = run(artifactProject, ['status', '--json'], 1);
  assert(staleStatus.stdout.includes('content no longer matches approvedRevision'), 'Status must report the same stale subject-integrity finding as validate.');
  run(artifactProject, ['artifact', 'reopen', 'workpack', '--evidence', 'Content changed']);
  current = record(artifactProject);
  assert(current.artifacts.find((item) => item.id === artifact.id)?.status === 'Draft', 'Reopen must repair a stale approval without silently re-approving it.');

  const repository = project('validation');
  const baselineCommit = initGitRepository(repository);
  const workflowRoot = project('validation-workflow');
  const workflowRecordPath = join(workflowRoot, '.workflow', 'workflow-record.json');
  const baseRecord = {
    schemaVersion: 2,
    toolkit: { repository: 'ferfalcon/figma-to-implementation-workflow', revision: toolkitRevision },
    project: { name: 'Validation fixture', profile: 'Express', executionMode: 'Gated' },
    state: {
      stage: 10, status: 'In progress', activeInputs: ['SRC-REPO-001'], currentTask: 'P01-T01',
      latestOutput: null, latestValidationRuntime: null, architectureDecision: null,
    },
    snapshots: [{
      id: 'SRC-REPO-001', role: 'Task start', pinStrength: 'Immutable', status: 'Active',
      reference: repository, commit: baselineCommit, task: 'P01-T01',
    }],
    verifications: [], artifacts: [], traceItems: [], gates: [],
    tasks: [{
      id: 'P01-T01', status: 'In progress', baseline: 'SRC-REPO-001', prerequisites: [], references: [],
      output: null, blocker: null, validation: [],
    }],
    profileTransitions: [], implementationReviews: [],
  };
  const candidate = structuredClone(baseRecord);
  candidate.tasks[0].validation.push({
    name: 'Build', kind: 'Build', required: true, status: 'Passed', expected: 'Build succeeds',
    actual: 'Build succeeded', evidence: ['build log'], references: [],
  });
  enrichIntegrityCandidate(workflowRecordPath, baseRecord, candidate);
  assert(candidate.tasks[0].validation[0].subject?.commit === baselineCommit, 'Executed validation must bind to current implementation HEAD.');
  assert(subjectIntegrityFindings(workflowRecordPath, candidate).length === 0, 'Fresh validation subject should satisfy integrity diagnostics.');

  const mismatchedToolkit = structuredClone(candidate);
  mismatchedToolkit.toolkit.revision = 'f'.repeat(40);
  assert(
    subjectIntegrityFindings(workflowRecordPath, mismatchedToolkit)
      .some((finding) => finding.includes('does not match executing toolkit')),
    'Recorded toolkit provenance must match the toolkit code actually executing the workflow.',
  );

  writeFileSync(join(repository, 'app.txt'), 'changed\n', 'utf8');
  git(repository, ['add', '.']);
  git(repository, ['commit', '-m', 'implementation']);
  const outputCommit = git(repository, ['rev-parse', 'HEAD']);
  const staleCompletion = structuredClone(candidate);
  staleCompletion.snapshots.push({
    id: 'SRC-REPO-002', role: 'Implementation output', pinStrength: 'Immutable', status: 'Active',
    reference: repository, commit: outputCommit, parent: 'SRC-REPO-001', task: 'P01-T01',
  });
  staleCompletion.tasks[0].output = 'SRC-REPO-002';
  staleCompletion.tasks[0].status = 'Complete';
  staleCompletion.state.currentTask = null;
  staleCompletion.state.latestOutput = 'SRC-REPO-002';
  const staleFindings = subjectIntegrityFindings(workflowRecordPath, staleCompletion);
  assert(staleFindings.some((finding) => finding.includes('not completed output')), 'Task completion must reject validation from an earlier commit.');

  const stageNine = structuredClone(baseRecord);
  stageNine.state.stage = 9;
  stageNine.state.currentTask = null;
  stageNine.tasks[0].status = 'Ready';
  stageNine.tasks[0].validation = structuredClone(candidate.tasks[0].validation);
  assert(subjectIntegrityFindings(workflowRecordPath, stageNine).some((finding) => finding.includes('cannot be executed until Stage 10')), 'Stage 9 may define checks but must not record executed validation.');

  const consumer = project('packaged-toolkit');
  const consumerCommit = initGitRepository(consumer);
  const sourceToolkitCommit = git(root, ['rev-parse', 'HEAD']).toLowerCase();
  const pack = spawnSync('npm', ['pack', '--silent', '--pack-destination', consumer], { cwd: root, encoding: 'utf8' });
  assert(pack.status === 0, `npm pack failed: ${pack.stderr}`);
  const tarball = pack.stdout.trim().split(/\r?\n/).at(-1);
  const install = spawnSync('npm', ['install', '--ignore-scripts', join(consumer, tarball)], { cwd: consumer, encoding: 'utf8' });
  assert(install.status === 0, `npm install local tarball failed: ${install.stderr}`);
  const packagedCli = join(consumer, 'node_modules', '@ferfalcon', 'design-workflow', 'cli', 'design-workflow.mjs');
  run(consumer, ['init', '--name', 'Packaged fixture', '--profile', 'Express'], 0, packagedCli);
  const packagedRecord = record(consumer);
  assert(packagedRecord.toolkit?.repository === 'ferfalcon/figma-to-implementation-workflow', 'Packaged toolkit must preserve its source repository identity.');
  assert(packagedRecord.toolkit?.revision === sourceToolkitCommit, 'Packaged toolkit must preserve its exact build-time Git revision.');
  assert(packagedRecord.toolkit.revision !== consumerCommit.toLowerCase(), 'Packaged toolkit must never inherit the consumer repository Git revision.');
  const packagedContext = run(consumer, ['context', '--json'], 0, packagedCli);
  assert(packagedContext.stdout.includes(sourceToolkitCommit), 'Packaged agent context must expose the embedded immutable toolkit revision.');

  console.log('Immutable subject identity and provenance regression tests passed.');
} finally {
  for (const path of projects) rmSync(path, { recursive: true, force: true });
}
