#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyRemoteCommandPaths } from './verify-remote-command-paths.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reusable = readFileSync(join(root, '.github', 'workflows', 'design-workflow-command.yml'), 'utf8');
const temp = mkdtempSync(join(tmpdir(), 'design-workflow-remote-paths-'));
const project = join(temp, 'project');
const outside = join(temp, 'outside');

try {
  mkdirSync(join(project, 'docs'), { recursive: true });
  mkdirSync(outside, { recursive: true });
  writeFileSync(join(project, 'docs', 'existing.md'), '# Existing\n');
  writeFileSync(join(outside, 'secret.md'), 'outside\n');

  verifyRemoteCommandPaths(project, ['artifact', 'adopt', 'requirements', '--path', 'docs/existing.md']);
  verifyRemoteCommandPaths(project, ['artifact', 'scaffold', 'requirements', '--path', 'docs/new.md']);
  assert.throws(
    () => verifyRemoteCommandPaths(project, ['artifact', 'adopt', 'requirements', '--path', '../outside/secret.md']),
    /escapes the checked-out project repository/,
  );

  symlinkSync(outside, join(project, 'escape'), 'dir');
  assert.throws(
    () => verifyRemoteCommandPaths(project, ['artifact', 'scaffold', 'requirements', '--path', 'escape/new.md']),
    /symlink outside the checked-out project repository/,
  );
  assert.throws(
    () => verifyRemoteCommandPaths(project, ['artifact', 'adopt', 'requirements', '--path', 'escape/secret.md']),
    /symlink outside the checked-out project repository/,
  );

  mkdirSync(join(project, 'internal-target'));
  symlinkSync(join(project, 'internal-target'), join(project, 'internal-link'), 'dir');
  verifyRemoteCommandPaths(project, ['artifact', 'scaffold', 'requirements', '--path', 'internal-link/new.md']);

  assert.match(reusable, /Verify command filesystem scope/);
  assert.match(reusable, /verify-remote-command-paths\.mjs/);
  assert.match(reusable, /steps\.verify-paths\.outcome == 'success'/);
  assert.match(reusable, /steps\.verify-paths\.outcome != 'success'/);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log('GitHub remote command filesystem containment tests passed.');
