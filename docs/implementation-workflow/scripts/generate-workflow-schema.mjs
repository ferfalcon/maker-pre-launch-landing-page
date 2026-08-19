#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWorkflowRecordSchemaV2 } from '../cli/lib/workflow-schema.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, '..');
const schemaPath = join(root, 'schemas', 'workflow-record.schema.json');
const schema = buildWorkflowRecordSchemaV2();
const rendered = `${JSON.stringify(schema, null, 2)}\n`;

if (process.argv.includes('--check')) {
  let current;
  try {
    current = JSON.parse(readFileSync(schemaPath, 'utf8'));
  } catch (error) {
    process.stderr.write(`schemas/workflow-record.schema.json is not valid JSON: ${error.message}\n`);
    process.exitCode = 1;
  }
  if (current && JSON.stringify(current) !== JSON.stringify(schema)) {
    process.stderr.write('schemas/workflow-record.schema.json is stale. Run node scripts/generate-workflow-schema.mjs.\n');
    process.exitCode = 1;
  } else if (current) {
    process.stdout.write('Workflow schema is current.\n');
  }
} else {
  writeFileSync(schemaPath, rendered, 'utf8');
  process.stdout.write('Updated schemas/workflow-record.schema.json.\n');
}
