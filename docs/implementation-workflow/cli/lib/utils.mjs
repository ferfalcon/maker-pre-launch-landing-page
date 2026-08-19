import { execFileSync } from 'node:child_process';
import { ARTIFACT_ALIASES, ARTIFACT_FILES } from './constants.mjs';
export { resolveRecordPath } from './workspace.mjs';

export function write(stream, message = '') { stream.write(`${message}\n`); }
export function fail(stderr, message) { write(stderr, `Error: ${message}`); return 1; }

export function parseArgs(args) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) { positionals.push(token); continue; }
    const equalsIndex = token.indexOf('=');
    let key;
    let value;
    if (equalsIndex >= 0) {
      key = token.slice(2, equalsIndex);
      value = token.slice(equalsIndex + 1);
    } else {
      key = token.slice(2);
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('--')) { value = next; index += 1; }
      else value = true;
    }
    if (Object.hasOwn(options, key)) {
      options[key] = Array.isArray(options[key]) ? [...options[key], value] : [options[key], value];
    } else options[key] = value;
  }
  return { positionals, options };
}

export function values(option) {
  if (option === undefined) return [];
  return Array.isArray(option) ? option : [option];
}

export function commaList(option) {
  return values(option).flatMap((item) => String(item).split(','))
    .map((item) => item.trim()).filter(Boolean);
}

export function normalizeChoice(value, choices) {
  if (typeof value !== 'string') return null;
  return choices.find((choice) => choice.toLowerCase() === value.trim().toLowerCase()) ?? null;
}

export function nextId(items, prefix, field = 'id') {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`^${escaped}(\\d+)$`);
  const highest = items.reduce((max, item) => {
    const match = expression.exec(item?.[field] ?? '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

export function parseTaskId(value) {
  if (typeof value !== 'string') return null;
  const match = /^P(\d{2})-T(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return {
    id: `P${match[1]}-T${match[2]}`,
    phase: Number(match[1]),
    task: Number(match[2]),
    phaseLabel: match[1],
    taskLabel: match[2],
  };
}

export function normalizeTaskPhase(value) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const match = /^P?(\d{1,2})$/i.exec(text);
  if (!match) throw new Error('--phase must be a phase number from 0 to 99, optionally prefixed with P.');
  return Number(match[1]);
}

export function nextTaskId(tasks, phaseValue = null) {
  const parsed = tasks.map((task) => parseTaskId(task?.id)).filter(Boolean);
  const phase = phaseValue === null || phaseValue === undefined
    ? (parsed.length > 0 ? Math.max(...parsed.map((task) => task.phase)) : 1)
    : normalizeTaskPhase(phaseValue);
  const highest = parsed.reduce((max, task) => (
    task.phase === phase ? Math.max(max, task.task) : max
  ), 0);
  if (highest >= 99) {
    throw new Error(`Phase ${String(phase).padStart(2, '0')} already contains Task 99; choose another phase or an explicit task ID.`);
  }
  return `P${String(phase).padStart(2, '0')}-T${String(highest + 1).padStart(2, '0')}`;
}

function removeOption(args, name) {
  const result = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === `--${name}`) {
      const next = args[index + 1];
      if (next !== undefined && !next.startsWith('--')) index += 1;
      continue;
    }
    if (token.startsWith(`--${name}=`)) continue;
    result.push(token);
  }
  return result;
}

export function normalizeTaskCreateArgs(args, tasks, parsed = parseArgs(args)) {
  const { positionals, options } = parsed;
  if (positionals[0] !== 'task' || positionals[1] !== 'create' || options.phase === undefined) return [...args];
  if (Array.isArray(options.phase)) throw new Error('--phase may be specified only once.');
  if (options.id !== undefined) throw new Error('--phase cannot be combined with --id; choose one task-ID strategy.');
  const id = nextTaskId(tasks ?? [], options.phase);
  return [...removeOption(args, 'phase'), '--id', id];
}

export function artifactType(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replaceAll('_', '-');
  return ARTIFACT_ALIASES.get(normalized)
    ?? (Object.hasOwn(ARTIFACT_FILES, value.toUpperCase()) ? value.toUpperCase() : null);
}

export function artifactId(record, type, suffix = '') {
  const base = `ART-${type}${suffix ? `-${suffix}` : ''}`.replaceAll('_', '-');
  const existing = new Set(record.artifacts.map((item) => item.id));
  if (!existing.has(base)) return base;
  let number = 2;
  while (existing.has(`${base}-${number}`)) number += 1;
  return `${base}-${number}`;
}

export function relativeDisplay(cwd, path) {
  return path?.startsWith(cwd) ? path.slice(cwd.length + 1) : path;
}

export function gitCommit(repositoryPath) {
  try {
    return execFileSync('git', ['-C', repositoryPath, 'rev-parse', 'HEAD'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return null; }
}

export function printFindings(stdout, errors) {
  if (errors.length === 0) { write(stdout, 'Validation: passed'); return; }
  write(stdout, `Validation: ${errors.length} finding(s)`);
  errors.forEach((error) => write(stdout, `- ${error}`));
}
