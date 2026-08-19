#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMAND_FENCE = /```design-workflow-command\s*\r?\n([\s\S]*?)```/g;
const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SAFE_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const MAX_ARGS = 64;
const MAX_ARG_LENGTH = 4096;
const MAX_ARG_BYTES = 32768;

const MUTATING_COMMANDS = [
  { prefix: ['init'], positionals: 1 },
  { prefix: ['migrate'], positionals: 1 },
  { prefix: ['sync'], positionals: 1 },
  { prefix: ['toolkit', 'pin'], positionals: 2 },
  { prefix: ['toolkit', 'migrate'], positionals: 2 },
  { prefix: ['snapshot', 'add'], positionals: 2 },
  { prefix: ['snapshot', 'verify'], positionals: 3 },
  { prefix: ['snapshot', 'supersede'], positionals: 3 },
  { prefix: ['artifact', 'adopt'], positionals: 3 },
  { prefix: ['artifact', 'scaffold'], positionals: 3 },
  { prefix: ['artifact', 'review'], positionals: 3 },
  { prefix: ['artifact', 'approve'], positionals: 3 },
  { prefix: ['artifact', 'reopen'], positionals: 3 },
  { prefix: ['artifact', 'supersede'], positionals: 3 },
  { prefix: ['artifact', 'baseline'], positionals: 3 },
  { prefix: ['stage', 'review'], positionals: 2 },
  { prefix: ['stage', 'advance'], positionals: 2 },
  { prefix: ['stage', 'rewind'], positionals: 3 },
  { prefix: ['architecture', 'decide'], positionals: 3 },
  { prefix: ['profile', 'upgrade', 'start'], positionals: 4 },
  { prefix: ['profile', 'upgrade', 'finish'], positionals: 3 },
  { prefix: ['trace', 'define'], positionals: 3 },
  { prefix: ['trace', 'update'], positionals: 3 },
  { prefix: ['trace', 'supersede'], positionals: 3 },
  { prefix: ['task', 'create'], positionals: 2 },
  { prefix: ['task', 'ready'], positionals: 3 },
  { prefix: ['task', 'start'], positionals: 3 },
  { prefix: ['task', 'block'], positionals: 3 },
  { prefix: ['task', 'unblock'], positionals: 3 },
  { prefix: ['task', 'complete'], positionals: 3 },
  { prefix: ['task', 'validation', 'set'], positionals: 4 },
  { prefix: ['review', 'set-result'], positionals: 3 },
  { prefix: ['mode', 'set'], positionals: 3 },
];

function isStageCheckJsonCommand(args) {
  return args.length === 3 && args[0] === 'stage' && args[1] === 'check' && args[2] === '--json';
}

function isReadOnlyCommand(args) {
  return isStageCheckJsonCommand(args)
    || (args.length === 1 && args[0] === 'validate')
    || (args.length === 2 && args[0] === 'sync' && args[1] === '--check');
}

function acceptsReadOnlyExitCode(args, status) {
  return status === 0 || (status === 1 && isStageCheckJsonCommand(args));
}

function fail(message) {
  throw new Error(message);
}

function optionValue(args, name) {
  const prefix = `${name}=`;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name) {
      const value = args[index + 1];
      return value && !value.startsWith('--') ? value : null;
    }
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return null;
}

function hasOption(args, name) {
  return args.some((arg) => arg === name || arg.startsWith(`${name}=`));
}

function commandMatches(args, prefix) {
  return prefix.every((value, index) => args[index] === value);
}

function commandLabel(args) {
  const parts = [];
  for (const arg of args) {
    if (arg.startsWith('--')) break;
    parts.push(arg.replace(/[\r\n]+/g, ' ').slice(0, 80));
    if (parts.length === 3) break;
  }
  return parts.join(' ');
}

function validateRelativePath(value, flag) {
  if (typeof value !== 'string' || !value.trim()) fail(`${flag} requires a repository-relative path.`);
  const normalized = value.replaceAll('\\', '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    fail(`${flag} must not use an absolute path.`);
  }
  if (normalized.split('/').some((segment) => segment === '..')) {
    fail(`${flag} must not escape the project checkout.`);
  }
  if (normalized.includes('\0') || normalized.includes('\r') || normalized.includes('\n')) {
    fail(`${flag} contains an invalid control character.`);
  }
}

export function validateTargetRef(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 200) {
    fail('targetRef must be a non-empty branch name no longer than 200 characters.');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)) fail('targetRef contains unsupported characters.');
  if (value === 'HEAD' || value.startsWith('-') || value.startsWith('/') || value.endsWith('/')) fail('targetRef is not a safe branch name.');
  if (value.includes('..') || value.includes('//') || value.includes('@{') || value.endsWith('.') || value.endsWith('.lock')) {
    fail('targetRef is not a safe branch name.');
  }
  return value;
}

export function validateCommandArgs(args) {
  if (!Array.isArray(args) || args.length === 0 || args.length > MAX_ARGS) {
    fail(`args must contain between 1 and ${MAX_ARGS} command arguments.`);
  }
  let bytes = 0;
  for (const arg of args) {
    if (typeof arg !== 'string' || arg.length === 0 || arg.length > MAX_ARG_LENGTH || arg.includes('\0')) {
      fail('Every command argument must be a non-empty bounded string without NUL characters.');
    }
    bytes += Buffer.byteLength(arg);
  }
  if (bytes > MAX_ARG_BYTES) fail(`Command arguments exceed the ${MAX_ARG_BYTES}-byte limit.`);

  const readOnly = isReadOnlyCommand(args);
  const firstOption = args.findIndex((arg) => arg.startsWith('--'));
  const positionalCount = firstOption === -1 ? args.length : firstOption;
  const matched = MUTATING_COMMANDS.find((spec) => (
    positionalCount === spec.positionals && commandMatches(args, spec.prefix)
  ));
  if (!readOnly && !matched) fail('Only explicitly supported design-workflow remote command shapes may use the bridge.');

  if (commandMatches(args, ['migrate']) && hasOption(args, '--check')) fail('migrate --check is not supported by the remote bridge.');
  if (hasOption(args, '--record')) fail('Remote commands must use the canonical project record; --record is not allowed.');
  if (hasOption(args, '--control')) fail('Remote commands support CLI-managed workflow state only; --control is not allowed.');

  for (const flag of ['--path']) {
    if (hasOption(args, flag)) validateRelativePath(optionValue(args, flag), flag);
  }

  if (commandMatches(args, ['init']) && hasOption(args, '--repository')) {
    const repository = optionValue(args, '--repository');
    if (repository !== '.') fail('Remote init may use --repository only with the checked-out project repository: --repository .');
  }

  for (const flag of ['--toolkit-repository', '--toolkit-revision', '--toolkit-commit']) {
    if (hasOption(args, flag)) fail(`${flag} is controlled by the pinned reusable workflow and is not accepted remotely.`);
  }

  return args;
}

export function parseCommandIssue(event) {
  if (!event || event.action !== 'opened' || !event.issue) fail('Remote commands must originate from an opened GitHub Issue event.');
  if (event.issue.title !== '[design-workflow] command') fail('Issue title must be exactly "[design-workflow] command".');
  if (!SAFE_ASSOCIATIONS.has(event.issue.author_association)) {
    fail(`Issue author association ${event.issue.author_association ?? 'UNKNOWN'} is not authorized for workflow mutation.`);
  }

  const body = String(event.issue.body ?? '');
  const blocks = [...body.matchAll(COMMAND_FENCE)];
  if (blocks.length !== 1) fail('Issue body must contain exactly one design-workflow-command fenced JSON block.');

  let payload;
  try {
    payload = JSON.parse(blocks[0][1]);
  } catch (error) {
    fail(`Command envelope is not valid JSON: ${error.message}`);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('Command envelope must be a JSON object.');
  if (payload.protocolVersion !== 1) fail('Unsupported remote command protocolVersion; expected 1.');

  const targetRef = validateTargetRef(payload.targetRef);
  const expectedHead = String(payload.expectedHead ?? '').toLowerCase();
  if (!SHA_PATTERN.test(expectedHead)) fail('expectedHead must be an exact 40-character Git SHA.');
  const args = validateCommandArgs(payload.args);

  const repository = event.repository?.full_name;
  if (typeof repository !== 'string' || !repository.includes('/')) fail('Issue event is missing repository identity.');
  const issueNumber = event.issue.number;
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) fail('Issue event is missing a valid issue number.');
  const requester = event.issue.user?.login;
  if (typeof requester !== 'string' || !requester.trim()) fail('Issue event is missing the requester login.');

  return {
    protocolVersion: 1,
    repository,
    issueNumber,
    requester,
    requesterAssociation: event.issue.author_association,
    targetRef,
    expectedHead,
    args,
    command: commandLabel(args),
  };
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env ?? process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

function requireSuccess(result, label) {
  if (result.status === 0 && !result.error) return result;
  const detail = `${result.stderr}\n${result.stdout}`.trim().slice(-1800);
  fail(`${label} failed${detail ? `: ${detail}` : '.'}`);
}

function git(project, args) {
  return run('git', args, { cwd: project });
}

function gitOutput(project, args, label) {
  return requireSuccess(git(project, args), label).stdout.trim();
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function rollback(project, expectedHead) {
  git(project, ['reset', '--hard', expectedHead]);
  git(project, ['clean', '-fd']);
}

function allowedWithoutCanonicalToolkit(args) {
  return isReadOnlyCommand(args)
    || commandMatches(args, ['migrate'])
    || commandMatches(args, ['sync'])
    || commandMatches(args, ['toolkit', 'pin'])
    || commandMatches(args, ['toolkit', 'migrate']);
}

function readCanonicalToolkitBinding(project) {
  const recordPath = resolve(project, '.workflow', 'workflow-record.json');
  if (!existsSync(recordPath)) return null;
  const record = readJson(recordPath);
  if (!record.toolkit) return { present: false, schemaVersion: record.schemaVersion ?? null };
  return {
    present: true,
    schemaVersion: record.schemaVersion ?? null,
    repository: record.toolkit.repository ?? null,
    revision: String(record.toolkit.revision ?? record.toolkit.commit ?? '').toLowerCase(),
  };
}

function requireToolkitCompatibility(project, request, toolkitRepository, toolkitRevision) {
  const binding = readCanonicalToolkitBinding(project);
  if (binding === null) {
    if (!commandMatches(request.args, ['init'])) fail('Workflow is not initialized; the next remote mutation must be init.');
    return;
  }
  if (!binding.present) {
    if (!allowedWithoutCanonicalToolkit(request.args)) {
      fail('Workflow toolkit is not canonically pinned; pin or migrate the toolkit binding before ordinary remote mutations.');
    }
    return;
  }
  if (binding.repository !== toolkitRepository || binding.revision !== toolkitRevision) {
    fail(`Workflow toolkit binding ${binding.repository}#${binding.revision} does not match remote executor ${toolkitRepository}#${toolkitRevision}.`);
  }
}

function requirePostMutationToolkit(project, toolkitRepository, toolkitRevision) {
  const binding = readCanonicalToolkitBinding(project);
  if (!binding?.present) return;
  if (binding.repository !== toolkitRepository || binding.revision !== toolkitRevision) {
    fail(`Mutation produced toolkit binding ${binding.repository}#${binding.revision}; expected ${toolkitRepository}#${toolkitRevision}.`);
  }
}

function remoteHead(project, targetRef) {
  const result = requireSuccess(git(project, ['ls-remote', '--heads', 'origin', `refs/heads/${targetRef}`]), 'Remote branch lookup');
  const line = result.stdout.trim();
  if (!line) fail(`Target branch ${targetRef} no longer exists on origin.`);
  return line.split(/\s+/)[0].toLowerCase();
}

export function executeRequest({ request, project, cliPath, toolkitRepository, toolkitRevision }) {
  const projectPath = resolve(project);
  const cli = resolve(cliPath);
  if (!existsSync(cli)) fail(`Pinned design-workflow CLI is missing at ${cli}.`);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(toolkitRepository)) fail('Reusable workflow toolkit repository identity is invalid.');
  if (!SHA_PATTERN.test(toolkitRevision)) fail('Reusable workflow toolkit revision is not an exact Git SHA.');

  requireSuccess(git(projectPath, ['check-ref-format', '--branch', request.targetRef]), 'Target branch validation');
  const head = gitOutput(projectPath, ['rev-parse', 'HEAD'], 'HEAD lookup').toLowerCase();
  if (head !== request.expectedHead) fail(`Stale command: expected ${request.expectedHead}, but checked-out HEAD is ${head}.`);
  if (gitOutput(projectPath, ['status', '--porcelain'], 'Working-tree check')) fail('Remote command checkout is not clean before execution.');

  requireToolkitCompatibility(projectPath, request, toolkitRepository, toolkitRevision.toLowerCase());

  const readOnly = isReadOnlyCommand(request.args);
  const commandResult = run(process.execPath, [cli, ...request.args], { cwd: projectPath });
  if (readOnly) {
    if (commandResult.error || !acceptsReadOnlyExitCode(request.args, commandResult.status)) {
      requireSuccess(commandResult, `design-workflow ${request.command}`);
    }
    if (gitOutput(projectPath, ['status', '--porcelain'], 'Read-only working-tree check')) {
      rollback(projectPath, request.expectedHead);
      fail(`Read-only command design-workflow ${request.command} modified the project checkout.`);
    }
    return {
      status: 'succeeded',
      command: request.command,
      commandExitCode: commandResult.status,
      targetRef: request.targetRef,
      before: request.expectedHead,
      after: request.expectedHead,
      changed: false,
      output: `${commandResult.stdout}${commandResult.stderr}`.trim().slice(0, 12000),
      message: `Read-only design-workflow command executed with exit code ${commandResult.status}.`,
    };
  }

  if (commandResult.status !== 0 || commandResult.error) {
    rollback(projectPath, request.expectedHead);
    requireSuccess(commandResult, `design-workflow ${request.command}`);
  }

  try {
    requirePostMutationToolkit(projectPath, toolkitRepository, toolkitRevision.toLowerCase());
    const recordPath = resolve(projectPath, '.workflow', 'workflow-record.json');
    if (existsSync(recordPath)) {
      requireSuccess(run(process.execPath, [cli, 'validate'], { cwd: projectPath }), 'Post-mutation design-workflow validate');
      requireSuccess(run(process.execPath, [cli, 'sync', '--check'], { cwd: projectPath }), 'Post-mutation design-workflow sync --check');
    }
  } catch (error) {
    rollback(projectPath, request.expectedHead);
    throw error;
  }

  requireSuccess(git(projectPath, ['add', '-A']), 'Git stage');
  const staged = git(projectPath, ['diff', '--cached', '--quiet']);
  if (staged.status === 0) {
    return {
      status: 'succeeded',
      command: request.command,
      targetRef: request.targetRef,
      before: request.expectedHead,
      after: request.expectedHead,
      changed: false,
      message: 'Command succeeded and produced no repository changes.',
    };
  }
  if (staged.status !== 1) fail('Could not determine whether the remote command produced staged changes.');

  requireSuccess(git(projectPath, ['config', 'user.name', 'github-actions[bot]']), 'Git author configuration');
  requireSuccess(git(projectPath, ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']), 'Git author configuration');
  requireSuccess(git(projectPath, ['commit', '-m', `Run design-workflow ${request.command}`]), 'Workflow-state commit');
  const after = gitOutput(projectPath, ['rev-parse', 'HEAD'], 'Resulting HEAD lookup').toLowerCase();

  const observedRemote = remoteHead(projectPath, request.targetRef);
  if (observedRemote !== request.expectedHead) {
    fail(`Concurrent update detected before push: origin/${request.targetRef} is ${observedRemote}, expected ${request.expectedHead}.`);
  }
  requireSuccess(git(projectPath, ['push', 'origin', `HEAD:refs/heads/${request.targetRef}`]), 'Non-force workflow-state push');

  return {
    status: 'succeeded',
    command: request.command,
    targetRef: request.targetRef,
    before: request.expectedHead,
    after,
    changed: true,
    message: 'Canonical design-workflow mutation committed and pushed.',
  };
}

function prepareCommand(options) {
  const resultPath = resolve(options.result);
  try {
    const event = readJson(resolve(options.event));
    const request = parseCommandIssue(event);
    writeJson(resolve(options.request), request);
    writeJson(resultPath, {
      status: 'pending',
      command: request.command,
      targetRef: request.targetRef,
      before: request.expectedHead,
      message: 'Command accepted for execution.',
    });
    if (options['github-output']) {
      writeFileSync(resolve(options['github-output']), `target-ref=${request.targetRef}\n`, { flag: 'a' });
    }
    return 0;
  } catch (error) {
    writeJson(resultPath, { status: 'rejected', message: error.message });
    console.error(error.message);
    return 1;
  }
}

function executeCommand(options) {
  const resultPath = resolve(options.result);
  const request = readJson(resolve(options.request));
  try {
    if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== request.repository) {
      fail(`Caller repository ${process.env.GITHUB_REPOSITORY} does not match command repository ${request.repository}.`);
    }
    const result = executeRequest({
      request,
      project: options.project,
      cliPath: options.cli,
      toolkitRepository: options['toolkit-repository'],
      toolkitRevision: options['toolkit-revision'],
    });
    writeJson(resultPath, result);
    console.log(result.message);
    return 0;
  } catch (error) {
    writeJson(resultPath, {
      status: 'failed',
      command: request.command,
      targetRef: request.targetRef,
      before: request.expectedHead,
      message: error.message,
    });
    console.error(error.message);
    return 1;
  }
}

function reportBody(result, outcomes) {
  let normalized = result;
  if (result.status === 'pending') {
    const failedStep = ['checkout', 'execute'].find((step) => outcomes[step] && outcomes[step] !== 'success' && outcomes[step] !== 'skipped');
    normalized = {
      ...result,
      status: 'failed',
      message: failedStep ? `Remote execution infrastructure failed during ${failedStep}.` : 'Remote execution did not reach a terminal command result.',
    };
  }
  const lines = [
    `**design-workflow remote command: ${normalized.status}**`,
    '',
  ];
  if (normalized.command) lines.push(`- Command: \`${normalized.command}\``);
  if (normalized.targetRef) lines.push(`- Target ref: \`${normalized.targetRef}\``);
  if (normalized.before) lines.push(`- Expected head: \`${normalized.before}\``);
  if (normalized.after) lines.push(`- Result head: \`${normalized.after}\``);
  if (Number.isInteger(normalized.commandExitCode)) lines.push(`- Command exit code: \`${normalized.commandExitCode}\``);
  lines.push(`- Result: ${String(normalized.message ?? 'No result message.').replace(/[\r\n]+/g, ' ').slice(0, 2000)}`);
  if (normalized.output) {
    lines.push('', '<details><summary>Command output</summary>', '', '```text');
    lines.push(String(normalized.output).replace(/```/g, "''' ").slice(0, 12000));
    lines.push('```', '', '</details>');
  }
  return { normalized, body: lines.join('\n') };
}

async function githubRequest(url, token, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) fail(`GitHub API request failed (${response.status} ${response.statusText}).`);
  return response;
}

async function reportCommand(options) {
  const event = readJson(resolve(options.event));
  const repository = event.repository?.full_name;
  const issueNumber = event.issue?.number;
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  if (!repository || !issueNumber || !token) fail('Reporting requires repository, issue number, and GITHUB_TOKEN.');

  let result;
  try {
    result = readJson(resolve(options.result));
  } catch {
    result = { status: 'failed', message: 'Remote command ended without a readable result payload.' };
  }
  const { normalized, body } = reportBody(result, {
    prepare: options['prepare-outcome'],
    checkout: options['checkout-outcome'],
    execute: options['execute-outcome'],
  });

  const issueUrl = `${apiUrl}/repos/${repository}/issues/${issueNumber}`;
  await githubRequest(`${issueUrl}/comments`, token, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  await githubRequest(issueUrl, token, {
    method: 'PATCH',
    body: JSON.stringify({
      state: 'closed',
      state_reason: normalized.status === 'succeeded' ? 'completed' : 'not_planned',
    }),
  });
  return normalized.status === 'succeeded' ? 0 : 1;
}

function parseCliOptions(argv) {
  const [subcommand, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) fail(`Unexpected positional argument ${arg}.`);
    const name = arg.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) fail(`Option --${name} requires a value.`);
    options[name] = value;
    index += 1;
  }
  return { subcommand, options };
}

async function main() {
  const { subcommand, options } = parseCliOptions(process.argv.slice(2));
  if (subcommand === 'prepare') return prepareCommand(options);
  if (subcommand === 'execute') return executeCommand(options);
  if (subcommand === 'report') return reportCommand(options);
  fail('Usage: github-remote-command.mjs prepare|execute|report [options]');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
