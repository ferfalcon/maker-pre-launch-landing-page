#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const packageMetadata = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const lockMetadata = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const license = readFileSync(join(root, 'LICENSE'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');

assert(packageMetadata.license === 'MIT', `package.json license is ${packageMetadata.license}, expected MIT.`);
assert(lockMetadata.packages?.['']?.license === 'MIT', `package-lock.json root license is ${lockMetadata.packages?.['']?.license}, expected MIT.`);
assert(lockMetadata.packages?.['']?.version === packageMetadata.version, 'package-lock.json root version does not match package.json.');
assert(/^MIT License\s*$/m.test(license), 'LICENSE does not declare the MIT License.');
assert(/## License[\s\S]*?Licensed under the MIT License\./m.test(readme), 'README License section does not describe the repository as MIT licensed.');

console.log('Release metadata consistently declares the MIT License.');
