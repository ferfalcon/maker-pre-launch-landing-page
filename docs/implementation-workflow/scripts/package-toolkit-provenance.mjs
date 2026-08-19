#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const toolkitRoot = resolve(scriptDirectory, '..');
const provenancePath = resolve(toolkitRoot, 'cli', 'toolkit-provenance.json');
const revisionPattern = /^[0-9a-f]{40}$/i;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const DEFAULT_REPOSITORY = 'ferfalcon/figma-to-implementation-workflow';

function git(args) {
  try {
    return execFileSync('git', ['-C', toolkitRoot, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function githubRepositoryFromRemote(remote) {
  if (!remote) return null;
  const ssh = remote.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (ssh) return ssh[1];
  const https = remote.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (https) return https[1];
  const sshUrl = remote.match(/^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i);
  return sshUrl?.[1] ?? null;
}

function explicitIdentity() {
  const repository = process.env.DESIGN_WORKFLOW_TOOLKIT_REPOSITORY?.trim() ?? null;
  const revision = process.env.DESIGN_WORKFLOW_TOOLKIT_COMMIT?.trim().toLowerCase() ?? null;
  if (!repository && !revision) return null;
  if (!repository || !revision) {
    throw new Error('Packaging provenance requires both DESIGN_WORKFLOW_TOOLKIT_REPOSITORY and DESIGN_WORKFLOW_TOOLKIT_COMMIT when either is supplied.');
  }
  return { repository, revision };
}

function gitIdentity() {
  const root = git(['rev-parse', '--show-toplevel']);
  if (!root || resolve(root) !== toolkitRoot) return null;
  const dirty = git(['status', '--porcelain', '--untracked-files=all']);
  if (dirty) {
    throw new Error('Refusing to stamp toolkit package provenance from a dirty worktree; commit or remove local changes before packaging.');
  }
  const revision = git(['rev-parse', 'HEAD'])?.toLowerCase() ?? null;
  if (!revision) return null;
  return {
    repository: githubRepositoryFromRemote(git(['remote', 'get-url', 'origin'])) ?? DEFAULT_REPOSITORY,
    revision,
  };
}

function validate(identity) {
  if (!repositoryPattern.test(identity?.repository ?? '')) {
    throw new Error(`Toolkit package provenance repository must use owner/name form; received ${identity?.repository ?? 'empty value'}.`);
  }
  if (!revisionPattern.test(identity?.revision ?? '')) {
    throw new Error(`Toolkit package provenance revision must be an exact 40-character Git SHA; received ${identity?.revision ?? 'empty value'}.`);
  }
  return { repository: identity.repository, revision: identity.revision.toLowerCase() };
}

function sameIdentity(left, right) {
  return left.repository === right.repository && left.revision === right.revision;
}

function writeProvenance() {
  const observed = gitIdentity();
  const explicit = explicitIdentity();
  if (observed && explicit && !sameIdentity(validate(observed), validate(explicit))) {
    throw new Error(
      `Explicit toolkit package provenance ${explicit.repository}#${explicit.revision} does not match observed Git identity ${observed.repository}#${observed.revision}.`,
    );
  }
  const identity = validate(observed ?? explicit);
  writeFileSync(provenancePath, `${JSON.stringify(identity, null, 2)}\n`, 'utf8');
}

function cleanProvenance() {
  if (existsSync(provenancePath)) rmSync(provenancePath, { force: true });
}

const action = process.argv[2];
if (action === 'write') writeProvenance();
else if (action === 'clean') cleanProvenance();
else throw new Error('Usage: node scripts/package-toolkit-provenance.mjs <write|clean>');
