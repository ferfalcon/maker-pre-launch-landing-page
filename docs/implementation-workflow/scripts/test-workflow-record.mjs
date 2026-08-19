#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWorkflowRecord } from './lib/validate-workflow-record.mjs';
import { migrateRecordV1 } from '../cli/lib/migrate-record.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDirectory, '..');

function readFixture(name) {
  return JSON.parse(readFileSync(join(root, 'tests', 'fixtures', name), 'utf8'));
}

function expectValid(name) {
  const errors = validateWorkflowRecord(readFixture(name));
  if (errors.length > 0) {
    console.error(`Expected ${name} to pass:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
}

expectValid('workflow-record.valid.json');
expectValid('workflow-record.express.valid.json');

const invalidErrors = validateWorkflowRecord(readFixture('workflow-record.invalid.json'));
const expectedFragments = [
  'references missing snapshot SRC-DS-999',
  'Task-by-task mode requires task decomposition to be reached',
  'Complete workflow must be at Stage 11',
  'dependency cycle detected',
  'Passed validation requires evidence',
  'Blocked validation requires a reason',
  'Full profile requires ARCHITECTURE',
  'Complete task cannot contain failed, blocked, or unexecuted required validation',
];

const missing = expectedFragments.filter((fragment) => !invalidErrors.some((error) => error.includes(fragment)));
if (missing.length > 0) {
  console.error('Invalid fixture did not produce all expected findings:');
  missing.forEach((fragment) => console.error(`- ${fragment}`));
  console.error('\nActual findings:');
  invalidErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const invalidExpress = structuredClone(readFixture('workflow-record.express.valid.json'));
invalidExpress.artifacts.push({
  id: 'ART-PLAN',
  type: 'PLAN',
  status: 'Approved',
  baseline: ['SRC-REPO-001'],
});
invalidExpress.tasks[0].prerequisites = ['P01-T02'];
invalidExpress.tasks.push({
  id: 'P01-T02',
  status: 'Ready',
  baseline: 'SRC-REPO-001',
  prerequisites: [],
  references: ['AC-002'],
  output: null,
  validation: [
    {
      name: 'Second task validation',
      status: 'Not executed',
      reason: 'Second task should force a profile upgrade',
    },
  ],
});

const invalidExpressErrors = validateWorkflowRecord(invalidExpress);
const expectedExpressFragments = [
  'Express profile must consolidate PLAN responsibility in WORKPACK',
  'Express profile permits at most one implementation task',
  'Express task cannot have task prerequisites',
];

const missingExpress = expectedExpressFragments.filter(
  (fragment) => !invalidExpressErrors.some((error) => error.includes(fragment)),
);
if (missingExpress.length > 0) {
  console.error('Invalid Express record did not produce all expected findings:');
  missingExpress.forEach((fragment) => console.error(`- ${fragment}`));
  console.error('\nActual findings:');
  invalidExpressErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const migrationV1 = readFixture('workflow-record.migration.v1.json');
const migrationGolden = readFixture('workflow-record.migration.v2.json');
const migrated = migrateRecordV1(migrationV1);
if (JSON.stringify(migrated) !== JSON.stringify(migrationGolden)) {
  console.error('Schema-v1 migration did not match the golden schema-v2 record.');
  process.exit(1);
}
const migratedErrors = validateWorkflowRecord(migrated);
if (migratedErrors.length > 0) {
  console.error('Golden migrated record is invalid:');
  migratedErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
if (JSON.stringify(migrateRecordV1(migrated)) !== JSON.stringify(migrated)) {
  console.error('Schema-v2 migration is not idempotent.');
  process.exit(1);
}

const strictV2 = structuredClone(migrationGolden);
strictV2.unexpected = true;
strictV2.state.activeInputs.push('SRC-REPO-001');
strictV2.traceItems[0].id = 'REQ-FUNC-001';
strictV2.tasks[0].validation[0] = {
  name: 'Required skipped check',
  kind: 'Other',
  required: true,
  status: 'Not applicable',
  expected: 'Must run',
  evidence: [],
  reason: 'Skipped',
  references: [],
};
const strictErrors = validateWorkflowRecord(strictV2);
for (const fragment of [
  'unknown property',
  'duplicate array value',
  'invalid identifier or value: REQ-FUNC-001',
  'Required validation cannot be Not applicable',
]) {
  if (!strictErrors.some((error) => error.includes(fragment))) {
    console.error(`Strict schema-v2 validation did not report: ${fragment}`);
    strictErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
}

const passedWithoutProof = structuredClone(migrationGolden);
passedWithoutProof.tasks[0].validation[0] = {
  name: 'Unproven pass',
  kind: 'Test',
  required: true,
  status: 'Passed',
  expected: 'Tests pass',
  evidence: [],
  references: [],
};
const passedWithoutProofErrors = validateWorkflowRecord(passedWithoutProof);
for (const fragment of ['actual result', 'execution timestamp', 'requires evidence']) {
  if (!passedWithoutProofErrors.some((error) => error.includes(fragment))) {
    console.error(`Passed-check validation did not report: ${fragment}`);
    process.exit(1);
  }
}

const cyclicTrace = structuredClone(migrationGolden);
cyclicTrace.traceItems[0].references = ['REQ-FR-001'];
const cyclicErrors = validateWorkflowRecord(cyclicTrace);
if (!cyclicErrors.some((error) => error.includes('trace cycle detected'))) {
  console.error('Trace graph cycle was not detected.');
  process.exit(1);
}

console.log(`Workflow record validator and migration tests passed (${invalidErrors.length + invalidExpressErrors.length} expected legacy findings plus strict v2 cases).`);
