import { execFileSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const LOCAL_BINDING_FILE = join('.workflow', 'local.json');

function git(repository, args) {
  try {
    return execFileSync('git', ['-C', repository, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function gitSucceeds(repository, args) {
  try {
    execFileSync('git', ['-C', repository, ...args], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function slashPath(value) {
  return value.split('\\').join('/');
}

function stripGitSuffix(value) {
  return value.replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
}

function isWindowsAbsolutePath(value) {
  return /^[A-Za-z]:[\\/]/.test(value);
}

function localBindingPath(cwd) {
  return resolve(cwd, LOCAL_BINDING_FILE);
}

function readLocalBindings(cwd) {
  const path = localBindingPath(cwd);
  if (!existsSync(path)) return { repositories: {} };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Local repository binding file is invalid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Local repository binding file must contain a JSON object.');
  }
  const repositories = parsed.repositories ?? {};
  if (!repositories || typeof repositories !== 'object' || Array.isArray(repositories)) {
    throw new Error('Local repository binding file "repositories" must be an object.');
  }
  for (const [reference, pathValue] of Object.entries(repositories)) {
    if (!reference.trim() || typeof pathValue !== 'string' || !pathValue.trim()) {
      throw new Error('Local repository bindings must map non-empty snapshot references to non-empty paths.');
    }
  }
  return { repositories };
}

export function canonicalRemoteReference(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim();
  if (isAbsolute(input) || isWindowsAbsolutePath(input) || input.startsWith('project://')) return null;

  if (!input.includes('://')) {
    const scpLike = /^(?:[^@/\s]+@)?([^:/\s]+):(.+)$/.exec(input);
    if (scpLike) {
      const host = scpLike[1].toLowerCase();
      const path = stripGitSuffix(scpLike[2]);
      if (host && path) return `https://${host}/${path}`;
    }
    return null;
  }

  try {
    const url = new URL(input);
    if (url.protocol === 'file:' || !url.host) return null;
    const path = stripGitSuffix(url.pathname);
    if (!path) return null;
    return `https://${url.host.toLowerCase()}/${path}`;
  } catch {
    return null;
  }
}

function repositoryRoot(repository) {
  const root = git(repository, ['rev-parse', '--show-toplevel']);
  return root ? resolve(root) : null;
}

function repositoryRemoteReference(repository) {
  let remote = git(repository, ['config', '--get', 'remote.origin.url']);
  if (!remote) {
    const firstRemote = git(repository, ['remote'])?.split(/\r?\n/).map((item) => item.trim()).find(Boolean);
    if (firstRemote) remote = git(repository, ['remote', 'get-url', firstRemote]);
  }
  return canonicalRemoteReference(remote);
}

function projectReference(cwd, repository) {
  const relativePath = slashPath(relative(resolve(cwd), resolve(repository)));
  if (relativePath === '..' || relativePath.startsWith('../') || isWindowsAbsolutePath(relativePath)) return null;
  return `project://${relativePath || '.'}`;
}

function projectReferencePath(cwd, reference) {
  if (typeof reference !== 'string' || !reference.startsWith('project://')) return null;
  const projectRoot = resolve(cwd);
  const value = reference.slice('project://'.length) || '.';
  const path = resolve(projectRoot, value);
  const relativePath = slashPath(relative(projectRoot, path));
  if (relativePath === '..' || relativePath.startsWith('../') || isWindowsAbsolutePath(relativePath)) return null;
  return path;
}

export function isPortableRepositoryReference(cwd, reference) {
  if (typeof reference !== 'string' || !reference.trim()) return false;
  if (reference.startsWith('project://')) return projectReferencePath(cwd, reference) !== null;
  return canonicalRemoteReference(reference) !== null;
}

function legacyReferencePath(cwd, reference) {
  if (typeof reference !== 'string' || !reference.trim()) return null;
  if (reference.startsWith('project://') || canonicalRemoteReference(reference)) return null;
  return isAbsolute(reference) || isWindowsAbsolutePath(reference)
    ? reference
    : resolve(cwd, reference);
}

export function portableRepositoryReference(cwd, repository, fallbackReference = null) {
  return repositoryRemoteReference(repository)
    ?? projectReference(cwd, repository)
    ?? (isPortableRepositoryReference(cwd, fallbackReference) ? fallbackReference : null);
}

export function captureRepositorySnapshot(cwd, repositoryInput) {
  const requested = isAbsolute(repositoryInput) || isWindowsAbsolutePath(repositoryInput)
    ? repositoryInput
    : resolve(cwd, repositoryInput);
  const repository = repositoryRoot(requested);
  if (!repository) throw new Error(`Could not resolve a Git repository from ${requested}`);
  const commit = git(repository, ['rev-parse', 'HEAD']);
  if (!commit) throw new Error(`Could not resolve a Git commit from ${repository}`);
  const reference = portableRepositoryReference(cwd, repository);
  if (!reference) {
    throw new Error(`Repository ${repository} is outside the workflow project and has no portable remote identity. Configure a Git remote before recording it as a snapshot.`);
  }
  return { repository, reference, commit };
}

function configuredBinding(cwd, reference) {
  const value = readLocalBindings(cwd).repositories[reference];
  if (!value) return null;
  return isAbsolute(value) || isWindowsAbsolutePath(value) ? value : resolve(cwd, value);
}

function candidateRoots(cwd, snapshot, repositoryOverride) {
  const candidates = [];
  if (repositoryOverride) candidates.push(repositoryOverride);
  const binding = configuredBinding(cwd, snapshot.reference);
  if (binding) candidates.push(binding);
  const projectPath = projectReferencePath(cwd, snapshot.reference);
  if (projectPath) candidates.push(projectPath);
  candidates.push(cwd);
  const legacyPath = legacyReferencePath(cwd, snapshot.reference);
  if (legacyPath) candidates.push(legacyPath);

  const roots = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const path = isAbsolute(candidate) || isWindowsAbsolutePath(candidate)
      ? candidate
      : resolve(cwd, candidate);
    const root = repositoryRoot(path);
    if (!root || seen.has(root)) continue;
    seen.add(root);
    roots.push(root);
  }
  return roots;
}

function matchesPortableReference(cwd, snapshot, repository) {
  if (snapshot.reference?.startsWith('project://')) {
    const projectPath = projectReferencePath(cwd, snapshot.reference);
    return Boolean(projectPath && repositoryRoot(projectPath) === repository);
  }

  const expectedRemote = canonicalRemoteReference(snapshot.reference);
  if (!expectedRemote) return true;
  const actualRemote = repositoryRemoteReference(repository);
  return actualRemote === null || actualRemote === expectedRemote;
}

export function resolveRepositoryWorkspace(cwd, snapshot, repositoryOverride = null) {
  if (!snapshot?.commit) throw new Error('Repository snapshot does not record a Git commit.');
  for (const root of candidateRoots(cwd, snapshot, repositoryOverride)) {
    if (!gitSucceeds(root, ['cat-file', '-e', `${snapshot.commit}^{commit}`])) continue;
    if (!matchesPortableReference(cwd, snapshot, root)) continue;
    return root;
  }
  const overrideHint = repositoryOverride ? '' : ' Bind a local checkout with "design-workflow repository bind".';
  throw new Error(`Could not resolve a local checkout for repository snapshot ${snapshot.id ?? snapshot.reference}.${overrideHint}`);
}

export function bindRepositoryWorkspace(cwd, snapshot, repositoryInput) {
  if (!snapshot?.reference || !snapshot?.commit) {
    throw new Error('Repository binding requires a repository snapshot with a reference and commit.');
  }
  const requested = isAbsolute(repositoryInput) || isWindowsAbsolutePath(repositoryInput)
    ? repositoryInput
    : resolve(cwd, repositoryInput);
  const repository = repositoryRoot(requested);
  if (!repository) throw new Error(`Could not resolve a Git repository from ${requested}`);
  if (!gitSucceeds(repository, ['cat-file', '-e', `${snapshot.commit}^{commit}`])) {
    throw new Error(`Bound repository does not contain snapshot commit ${snapshot.commit}.`);
  }
  if (!matchesPortableReference(cwd, snapshot, repository)) {
    throw new Error(`Bound repository identity does not match snapshot reference ${snapshot.reference}.`);
  }

  const path = localBindingPath(cwd);
  const bindings = readLocalBindings(cwd);
  const storedPath = isAbsolute(repositoryInput) || isWindowsAbsolutePath(repositoryInput)
    ? repositoryInput
    : slashPath(relative(cwd, repository) || '.');
  bindings.repositories[snapshot.reference] = storedPath;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(bindings, null, 2)}\n`, 'utf8');
  return { path, repository, reference: snapshot.reference };
}

export function verifyRepositoryCommit(cwd, snapshot, commit, repositoryOverride = null) {
  const repository = resolveRepositoryWorkspace(cwd, snapshot, repositoryOverride);
  if (!gitSucceeds(repository, ['cat-file', '-e', `${commit}^{commit}`])) {
    throw new Error(`Commit ${commit} does not exist in the resolved Git repository.`);
  }
  const head = git(repository, ['rev-parse', 'HEAD']);
  if (head !== commit) throw new Error(`Commit ${commit} is not HEAD (${head ?? 'unavailable'}).`);
  if (!gitSucceeds(repository, ['merge-base', '--is-ancestor', snapshot.commit, commit]) && snapshot.commit !== commit) {
    throw new Error(`Commit ${commit} does not descend from task baseline ${snapshot.commit}.`);
  }
  const reference = portableRepositoryReference(cwd, repository, snapshot.reference);
  if (!reference) {
    throw new Error(`Resolved repository ${repository} has no portable identity for the implementation-output snapshot.`);
  }
  return { repository, reference };
}
