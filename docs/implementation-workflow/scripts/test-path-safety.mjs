#!/usr/bin/env node

import assert from 'node:assert/strict';
import { basename, dirname, join, resolve } from 'node:path';
import { isPathWithin } from './lib/path-safety.mjs';

const root = resolve('repository-root');
const siblingPrefixRoot = join(dirname(root), `${basename(root)}-other`);

assert.equal(isPathWithin(root, root), true);
assert.equal(isPathWithin(root, join(root, 'README.md')), true);
assert.equal(isPathWithin(root, join(root, 'nested', 'file.md')), true);
assert.equal(isPathWithin(root, join(root, '..not-parent', 'file.md')), true);
assert.equal(isPathWithin(root, resolve(root, '..', 'outside.md')), false);
assert.equal(isPathWithin(root, join(siblingPrefixRoot, 'README.md')), false);

console.log('Path safety tests passed (repository containment rejects parent and sibling-prefix escapes).');
