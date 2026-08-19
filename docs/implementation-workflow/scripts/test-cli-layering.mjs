#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cliRoot = join(root, 'cli');

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (entry.isFile() && extname(entry.name) === '.mjs') files.push(path);
  }
  return files;
}

const importPatterns = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
];
const violations = [];

for (const file of sourceFiles(cliRoot)) {
  const source = readFileSync(file, 'utf8');
  for (const pattern of importPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith('.')) continue;
      const target = resolve(dirname(file), specifier);
      const fromCli = relative(cliRoot, target);
      if (fromCli === '..' || fromCli.startsWith(`..${sep}`) || isAbsolute(fromCli)) {
        violations.push(`${relative(root, file)} -> ${specifier}`);
      }
    }
  }
}

if (violations.length > 0) {
  throw new Error(`CLI runtime modules must not depend on repository script/tooling layers:\n${violations.map((item) => `- ${item}`).join('\n')}`);
}

console.log('CLI layering tests passed (all relative runtime imports stay inside cli/).');
