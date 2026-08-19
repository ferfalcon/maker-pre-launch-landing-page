#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const launcherPath = join(root, 'AGENTS-PROMPT-Figma-file-preparation.md');
const canonicalPath = join(root, 'source-adapters', 'FIGMA-PREPARATION.md');

const launcher = readFileSync(launcherPath, 'utf8');
const canonical = readFileSync(canonicalPath, 'utf8');
const errors = [];

if (!launcher.includes('(source-adapters/FIGMA-PREPARATION.md)')) {
  errors.push('Figma preparation launcher must link to source-adapters/FIGMA-PREPARATION.md.');
}

if (!canonical.includes('(../AGENTS-PROMPT-Figma-file-preparation.md)')) {
  errors.push('Canonical Figma preparation procedure must identify the root launcher.');
}

const canonicalProcedureHeadings = [...canonical.matchAll(/^##\s+\d+\.\s+.+$/gm)]
  .map((match) => match[0]);

if (canonicalProcedureHeadings.length === 0) {
  errors.push('Canonical Figma preparation procedure exposes no numbered procedure sections.');
}

for (const heading of canonicalProcedureHeadings) {
  if (launcher.includes(heading)) {
    errors.push(`Figma preparation launcher duplicates canonical procedure heading: ${heading}`);
  }
}

if (/^##\s+\d+\.\s+/m.test(launcher)) {
  errors.push('Figma preparation launcher must not define its own numbered preparation procedure.');
}

if (errors.length > 0) {
  console.error('Figma preparation authority test failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Figma preparation authority test passed (${canonicalProcedureHeadings.length} canonical procedure sections; launcher delegates without duplicating them).`);
}
