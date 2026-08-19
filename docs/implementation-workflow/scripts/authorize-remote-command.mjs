#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function permissionAllowsRemoteMutation(permission) {
  return permission === 'write' || permission === 'admin';
}

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeFailure(resultPath, message) {
  if (!resultPath) return;
  let existing = { status: 'pending' };
  try {
    existing = readJson(resultPath);
  } catch {}
  writeFileSync(resultPath, `${JSON.stringify({ ...existing, status: 'rejected', message }, null, 2)}\n`);
}

async function repositoryPermission({ apiUrl, token, repository, username }) {
  const response = await fetch(
    `${apiUrl}/repos/${encodeURIComponent(repository.split('/')[0])}/${encodeURIComponent(repository.split('/')[1])}/collaborators/${encodeURIComponent(username)}/permission`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) {
    fail(`Could not verify repository permission for ${username} (${response.status} ${response.statusText}).`);
  }
  const payload = await response.json();
  return payload.permission;
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) fail('Authorization options must use --name value pairs.');
    options[key.slice(2)] = value;
  }
  return options;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const resultPath = options.result ? resolve(options.result) : null;
  try {
    const event = readJson(resolve(options.event));
    const repository = event.repository?.full_name;
    const username = event.issue?.user?.login;
    const token = process.env.GITHUB_TOKEN;
    const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
    if (typeof repository !== 'string' || repository.split('/').length !== 2) fail('Issue event is missing repository identity.');
    if (typeof username !== 'string' || !username.trim()) fail('Issue event is missing requester identity.');
    if (!token) fail('GITHUB_TOKEN is required to verify requester permission.');

    const permission = await repositoryPermission({ apiUrl, token, repository, username });
    if (!permissionAllowsRemoteMutation(permission)) {
      fail(`Requester ${username} has ${permission ?? 'unknown'} repository permission; write or admin permission is required.`);
    }
    console.log(`Authorized ${username} with ${permission} repository permission.`);
  } catch (error) {
    writeFailure(resultPath, error.message);
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
