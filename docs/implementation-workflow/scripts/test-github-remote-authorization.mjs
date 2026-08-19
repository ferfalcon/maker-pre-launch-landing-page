#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { permissionAllowsRemoteMutation } from './authorize-remote-command.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reusable = readFileSync(join(root, '.github', 'workflows', 'design-workflow-command.yml'), 'utf8');

assert.equal(permissionAllowsRemoteMutation('admin'), true);
assert.equal(permissionAllowsRemoteMutation('write'), true);
assert.equal(permissionAllowsRemoteMutation('read'), false);
assert.equal(permissionAllowsRemoteMutation('none'), false);
assert.equal(permissionAllowsRemoteMutation(undefined), false);

assert.match(reusable, /Verify requester repository permission/);
assert.match(reusable, /authorize-remote-command\.mjs/);
assert.match(reusable, /steps\.authorize\.outcome == 'success'/);
assert.match(reusable, /steps\.authorize\.outcome != 'success'/);

console.log('GitHub remote command authorization tests passed.');
