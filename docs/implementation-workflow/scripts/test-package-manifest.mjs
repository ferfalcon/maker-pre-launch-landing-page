#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const provenancePath = join(root, 'cli', 'toolkit-provenance.json');
const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--silent'], {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
});
if (result.status !== 0) {
  throw new Error(`npm pack --dry-run failed:\n${result.stderr || result.stdout}`);
}

const report = JSON.parse(result.stdout)[0];
const files = new Set(report.files.map((item) => item.path.split('\\').join('/')));
const requiredAreas = [
  'AGENTS-instructions.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
  'cli/', 'cli/toolkit-provenance.json', 'workflow/', 'guidelines/', 'prompts/', 'source-adapters/',
  'templates/', 'examples/', 'schemas/', 'scripts/', 'tests/',
];
const missingAreas = requiredAreas.filter((area) => (
  area.endsWith('/') ? ![...files].some((path) => path.startsWith(area)) : !files.has(area)
));
if (missingAreas.length > 0) throw new Error(`Package is missing required areas: ${missingAreas.join(', ')}`);
if (existsSync(provenancePath)) throw new Error('npm postpack must remove the transient source-tree toolkit provenance file.');

const forbidden = [...files].filter((path) => path.startsWith('node_modules/') || path.endsWith('.tgz'));
if (forbidden.length > 0) throw new Error(`Package contains forbidden files: ${forbidden.join(', ')}`);

function stripCodeFences(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '');
}

function normalizeTarget(raw) {
  let target = raw.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  const title = target.match(/\s+["']/);
  if (title?.index !== undefined) target = target.slice(0, title.index);
  try { target = decodeURIComponent(target); } catch { /* report the unresolved literal below */ }
  return target.split('#')[0].split('?')[0];
}

const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
const broken = [];
for (const file of [...files].filter((path) => extname(path).toLowerCase() === '.md')) {
  const content = stripCodeFences(readFileSync(join(root, file), 'utf8'));
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const target = normalizeTarget(match[1]);
    if (!target || /^(?:https?:|mailto:|tel:|data:)/.test(target) || target.includes('<') || target.includes('>')) continue;
    const resolved = normalize(relative(root, resolve(root, dirname(file), target))).split('\\').join('/');
    const packaged = files.has(resolved) || [...files].some((path) => path.startsWith(`${resolved}/`));
    if (resolved.startsWith('../') || !packaged) broken.push(`${file} → ${match[1]}`);
  }
}
if (broken.length > 0) throw new Error(`Packaged relative Markdown links do not resolve:\n${broken.map((item) => `- ${item}`).join('\n')}`);

console.log(`Package manifest tests passed (${files.size} packaged files, immutable toolkit provenance included, all relative Markdown links resolved).`);
