import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { GENERATED_STATE_DIRECTORY, GENERATED_STATE_FILES } from './generated-state.mjs';
import { resolveRepositoryWorkspace } from './repository-binding.mjs';
import { projectRootForRecord } from './workspace.mjs';

const FULL_COMMIT = /^[0-9a-f]{40}$/i;

function gitRaw(repository, args) {
  try {
    return execFileSync('git', ['-C', repository, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function normalizeRepositoryPath(path) {
  return String(path).replaceAll('\\', '/').replace(/^\.\//, '');
}

function repositoryRelativePath(repository, path) {
  const value = normalizeRepositoryPath(relative(repository, resolve(path)));
  if (!value || value === '..' || value.startsWith('../') || isAbsolute(value)) return null;
  return value;
}

export function workflowControlPaths(recordPath, repository) {
  const control = [
    resolve(recordPath),
    ...GENERATED_STATE_FILES.map((file) => resolve(
      dirname(recordPath), GENERATED_STATE_DIRECTORY, file,
    )),
  ];
  return new Set(control.map((path) => repositoryRelativePath(repository, path)).filter(Boolean));
}

export function workflowManagedPaths(recordPath, repository, record) {
  const managed = workflowControlPaths(recordPath, repository);
  const projectRoot = projectRootForRecord(recordPath);
  for (const artifact of record?.artifacts ?? []) {
    if (artifact.status === 'Superseded' || !artifact.path) continue;
    const absolute = isAbsolute(artifact.path) ? artifact.path : resolve(projectRoot, artifact.path);
    const path = repositoryRelativePath(repository, absolute);
    if (path) managed.add(path);
  }
  return managed;
}

function parsePorcelainPaths(output) {
  if (!output) return [];
  const entries = output.split('\0');
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    const status = entry.slice(0, 2);
    const path = entry.slice(3);
    if (path) paths.push(normalizeRepositoryPath(path));
    if (status.includes('R') || status.includes('C')) {
      const original = entries[index + 1];
      if (original) paths.push(normalizeRepositoryPath(original));
      index += 1;
    }
  }
  return [...new Set(paths)];
}

function dirtyPaths(repository) {
  const output = gitRaw(repository, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  if (output === null) return null;
  return parsePorcelainPaths(output);
}

function commitPaths(repository, commit) {
  const output = gitRaw(repository, [
    'diff-tree', '--root', '-m', '--no-commit-id', '--name-only', '-r', '-z', commit,
  ]);
  if (output === null) return null;
  return [...new Set(output.split('\0').filter(Boolean).map(normalizeRepositoryPath))];
}

function rangePaths(repository, fromCommit, toCommit) {
  if (fromCommit === toCommit) return [];
  const output = gitRaw(repository, [
    'log', '-m', '--format=', '--name-only', '-z', '--no-renames', `${fromCommit}..${toCommit}`,
  ]);
  if (output === null) return null;
  return [...new Set(output.split('\0').filter(Boolean).map(normalizeRepositoryPath))];
}

function taskRepository(recordPath, record, task) {
  if (!task?.baseline) return { finding: 'Task does not have a repository baseline.' };
  const baseline = record.snapshots.find((item) => item.id === task.baseline && item.id.startsWith('SRC-REPO-'));
  if (!baseline?.reference) {
    return { finding: `Task baseline ${task.baseline} does not reference a Git repository.` };
  }
  try {
    return { repository: resolveRepositoryWorkspace(projectRootForRecord(recordPath), baseline) };
  } catch {
    return { finding: `Task baseline ${task.baseline} does not reference an accessible Git repository.` };
  }
}

function implementationDirtyFindings(repository, action, allowed, message) {
  const dirty = dirtyPaths(repository);
  if (dirty === null) return [`Git working-tree state could not be inspected before ${action}.`];
  const implementation = dirty.filter((path) => !allowed.has(path));
  if (implementation.length === 0) return [];
  return [
    `Git working tree has uncommitted implementation-scope changes before ${action}: ${implementation.join(', ')}. ${message}`,
  ];
}

export function taskStartGitFindings(recordPath, record, task) {
  const resolved = taskRepository(recordPath, record, task);
  if (resolved.finding) return [resolved.finding];
  return implementationDirtyFindings(
    resolved.repository,
    'task start',
    workflowControlPaths(recordPath, resolved.repository),
    'Approved planning and task narratives must be committed before task start; only canonical workflow-control state may remain dirty.',
  );
}

export function taskStartCheckpointFindings(recordPath, record, repository, fromCommit, toCommit) {
  const paths = rangePaths(repository, fromCommit, toCommit);
  if (paths === null) return ['Could not inspect committed repository history before task start.'];
  const managed = workflowManagedPaths(recordPath, repository, record);
  const unexpected = paths.filter((path) => !managed.has(path));
  if (unexpected.length === 0) return [];
  return [
    `Repository history since ${fromCommit} includes implementation-scope paths before task start: ${unexpected.join(', ')}. `
      + 'Review and record those upstream changes before starting the task.',
  ];
}

export function taskCompletionGitFindings(recordPath, record, task, commit) {
  const resolved = taskRepository(recordPath, record, task);
  if (resolved.finding) return [resolved.finding];
  const managed = workflowManagedPaths(recordPath, resolved.repository, record);
  const findings = implementationDirtyFindings(
    resolved.repository,
    'task completion',
    managed,
    'Only workflow-managed state and active narrative artifacts may remain dirty.',
  );
  if (!FULL_COMMIT.test(String(commit ?? ''))) return findings;
  const paths = commitPaths(resolved.repository, String(commit).toLowerCase());
  if (paths === null) return findings;
  const mixed = paths.filter((path) => managed.has(path));
  if (mixed.length > 0) {
    findings.push(
      `Implementation output commit ${String(commit).toLowerCase()} modifies workflow-managed files: ${mixed.join(', ')}. `
        + 'Record implementation work in a separate commit and commit workflow bookkeeping or narrative updates separately.',
    );
  }
  return findings;
}
