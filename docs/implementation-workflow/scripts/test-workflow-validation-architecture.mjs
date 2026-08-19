#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  facade: 'cli/lib/workflow-record-validation.mjs',
  domains: 'cli/lib/workflow-record-validation-domains.mjs',
  invariants: 'cli/lib/workflow-record-validation-invariants.mjs',
  primitives: 'cli/lib/workflow-record-validation-primitives.mjs',
};
const source = Object.fromEntries(Object.entries(files).map(([name, path]) => [
  name,
  readFileSync(resolve(root, path), 'utf8'),
]));

const facadeLines = source.facade.split('\n').length;
assert.ok(
  facadeLines <= 450,
  `workflow-record-validation.mjs must remain an orchestration facade (found ${facadeLines} lines; limit 450)`,
);

for (const helper of ['function push(', 'function expectObject(', 'function checkShape(', 'function findCycles(']) {
  assert.equal(
    source.facade.includes(helper),
    false,
    `workflow-record-validation.mjs must not reintroduce primitive helper ${helper}`,
  );
}

assert.match(source.facade, /workflow-record-validation-domains\.mjs/);
assert.match(source.facade, /workflow-record-validation-invariants\.mjs/);
assert.match(source.facade, /workflow-record-validation-primitives\.mjs/);

for (const [name, moduleSource] of Object.entries(source)) {
  if (name === 'facade') continue;
  assert.equal(
    moduleSource.includes("from './workflow-record-validation.mjs'"),
    false,
    `${files[name]} must not depend back on the facade`,
  );
}

assert.equal(
  source.domains.includes('workflow-record-validation-invariants.mjs'),
  false,
  'domain validators must not depend on cross-record invariants',
);
assert.equal(
  source.primitives.includes('workflow-model.mjs'),
  false,
  'validation primitives must remain model-agnostic',
);

console.log('Workflow validation architecture tests passed (facade and dependency boundaries are preserved).');
