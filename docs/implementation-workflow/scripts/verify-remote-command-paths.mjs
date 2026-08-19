#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function optionValue(args, name) {
  const prefix = `${name}=`;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name) return args[index + 1] ?? null;
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return null;
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\'));
}

function nearestExistingPath(path, floor) {
  let cursor = path;
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor || !isWithin(floor, parent)) return null;
    cursor = parent;
  }
  return cursor;
}

export function verifyRemoteCommandPaths(project, args) {
  const projectPath = resolve(project);
  const realProject = realpathSync(projectPath);
  const pathValue = optionValue(args, '--path');
  if (!pathValue) return;

  const lexicalTarget = resolve(projectPath, pathValue);
  if (!isWithin(projectPath, lexicalTarget)) {
    fail('--path escapes the checked-out project repository.');
  }

  const existing = nearestExistingPath(lexicalTarget, projectPath);
  if (!existing) fail('Could not resolve a safe existing ancestor for --path.');
  const realExisting = realpathSync(existing);
  if (!isWithin(realProject, realExisting)) {
    fail('--path resolves through a symlink outside the checked-out project repository.');
  }
}

function writeFailure(resultPath, message) {
  if (!resultPath) return;
  let existing = { status: 'pending' };
  try {
    existing = readJson(resultPath);
  } catch {}
  writeFileSync(resultPath, `${JSON.stringify({ ...existing, status: 'rejected', message }, null, 2)}\n`);
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) fail('Path-verification options must use --name value pairs.');
    options[key.slice(2)] = value;
  }
  return options;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const resultPath = options.result ? resolve(options.result) : null;
  try {
    const request = readJson(resolve(options.request));
    verifyRemoteCommandPaths(options.project, request.args);
    console.log('Remote command filesystem scope verified.');
  } catch (error) {
    writeFailure(resultPath, error.message);
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) main();
