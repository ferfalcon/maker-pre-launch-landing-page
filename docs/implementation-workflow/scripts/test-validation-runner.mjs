#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runValidationSuite } from './run-validation-suite.mjs';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'design-workflow-validation-runner-'));
const markerPath = join(temporaryDirectory, 'marker.txt');
const firstScript = join(temporaryDirectory, 'first.mjs');
const failingScript = join(temporaryDirectory, 'failing.mjs');
const finalScript = join(temporaryDirectory, 'final.mjs');

try {
  writeFileSync(firstScript, "import { appendFileSync } from 'node:fs';\nappendFileSync(process.argv[2], 'first\\n');\n");
  writeFileSync(failingScript, "process.exitCode = 1;\n");
  writeFileSync(finalScript, "import { appendFileSync } from 'node:fs';\nappendFileSync(process.argv[2], 'final\\n');\n");

  const report = runValidationSuite([
    { name: 'first check', script: firstScript, args: [markerPath] },
    { name: 'failing check', script: failingScript },
    { name: 'final check', script: finalScript, args: [markerPath] },
  ], {
    cwd: temporaryDirectory,
    stdio: 'ignore',
    log: () => {},
  });

  assert.equal(report.passed, false);
  assert.equal(report.results.length, 3);
  assert.equal(report.failures.length, 1);
  assert.equal(report.failures[0].name, 'failing check');
  assert.equal(readFileSync(markerPath, 'utf8'), 'first\nfinal\n');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log('Validation runner tests passed (failures aggregate without skipping later checks).');
