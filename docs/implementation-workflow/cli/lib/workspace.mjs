import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

export const DEFAULT_RECORD_RELATIVE_PATH = join('.workflow', 'workflow-record.json');

export function resolveRecordPath(cwd, option) {
  const invocationRoot = resolve(cwd);
  if (typeof option === 'string') {
    return isAbsolute(option) ? resolve(option) : resolve(invocationRoot, option);
  }
  return resolve(invocationRoot, DEFAULT_RECORD_RELATIVE_PATH);
}

export function projectRootForRecord(recordPath) {
  const recordDirectory = dirname(resolve(recordPath));
  return basename(recordDirectory) === '.workflow'
    ? dirname(recordDirectory)
    : recordDirectory;
}

export function resolveWorkflowWorkspace(cwd, recordOption) {
  const invocationRoot = resolve(cwd);
  const recordPath = resolveRecordPath(invocationRoot, recordOption);
  const projectRoot = projectRootForRecord(recordPath);
  return {
    invocationRoot,
    projectRoot,
    recordPath,
    controlRoot: dirname(recordPath),
  };
}

export function workspaceDisplayPath(workspace, path) {
  const value = relative(workspace.projectRoot, resolve(path)).split('\\').join('/');
  return value || '.';
}

export function normalizeRecordArgs(args, recordPath) {
  const normalized = [];
  let replaced = false;
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--record') {
      normalized.push('--record', recordPath);
      replaced = true;
      if (args[index + 1] !== undefined && !args[index + 1].startsWith('--')) index += 1;
      continue;
    }
    if (token.startsWith('--record=')) {
      normalized.push(`--record=${recordPath}`);
      replaced = true;
      continue;
    }
    normalized.push(token);
  }
  return replaced ? normalized : args;
}
