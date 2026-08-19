import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTIFACT_FILES } from './workflow-model.mjs';
import { parseTaskId } from './utils.mjs';
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ARTIFACT_START = '<!-- artifact:start -->';
const ARTIFACT_END = '<!-- artifact:end -->';
const CONTROL_VALUES = ['cli-managed', 'markdown-only'];

function markerPair(name) {
  return [`<!-- control:${name}:start -->`, `<!-- control:${name}:end -->`];
}

function extractSingleRegion(text, start, end, label) {
  const firstStart = text.indexOf(start);
  const lastStart = text.lastIndexOf(start);
  const firstEnd = text.indexOf(end);
  const lastEnd = text.lastIndexOf(end);
  if (firstStart < 0 || firstEnd < 0) throw new Error(`Template is missing ${label} markers.`);
  if (firstStart !== lastStart || firstEnd !== lastEnd) throw new Error(`Template contains duplicate ${label} markers.`);
  if (firstEnd < firstStart) throw new Error(`Template has malformed ${label} marker order.`);
  return text.slice(firstStart + start.length, firstEnd);
}

function selectControlBlocks(text, control) {
  let result = text;
  for (const value of CONTROL_VALUES) {
    const [start, end] = markerPair(value);
    let cursor = 0;
    let output = '';
    while (cursor < result.length) {
      const startIndex = result.indexOf(start, cursor);
      const endIndex = result.indexOf(end, cursor);
      if (startIndex < 0 && endIndex < 0) {
        output += result.slice(cursor);
        break;
      }
      if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
        throw new Error(`Template has malformed ${value} control markers.`);
      }
      output += result.slice(cursor, startIndex);
      if (value === control) output += result.slice(startIndex + start.length, endIndex);
      cursor = endIndex + end.length;
    }
    result = output;
  }
  if (/<!--\s*(?:artifact|control):/.test(result)) throw new Error('Template contains unresolved artifact control markers.');
  return result;
}

function unwrapFrontmatter(text) {
  const fenced = /^\s*```ya?ml\s*\n([\s\S]*?)\n```\s*/i.exec(text);
  if (fenced) {
    const yaml = fenced[1].trim();
    if (!yaml.startsWith('---') || !yaml.endsWith('---')) {
      throw new Error('Template YAML example must contain --- frontmatter delimiters.');
    }
    return `${yaml}\n\n${text.slice(fenced[0].length).trimStart()}`;
  }
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('---\n')) throw new Error('Artifact template must begin with YAML frontmatter.');
  const end = trimmed.indexOf('\n---', 4);
  if (end < 0) throw new Error('Artifact template has unterminated YAML frontmatter.');
  return trimmed;
}

function yamlScalar(value) {
  const text = String(value);
  const reserved = /^(?:null|~|true|false|yes|no|on|off|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)$/i;
  const safe = /^[A-Za-z0-9][A-Za-z0-9 _./-]*$/.test(text);
  return safe && !reserved.test(text) ? text : JSON.stringify(text);
}

function rewriteFrontmatter(text, context) {
  const end = text.indexOf('\n---', 4);
  const yaml = text.slice(4, end).split('\n');
  const replacements = {
    artifact: context.artifact,
    project: context.project,
    profile: context.profile,
    execution_mode: context.mode,
    created: context.date,
    updated: context.date,
  };
  const recordOwned = new Set([
    'status', 'current_stage', 'current_status', 'baseline', 'active_inputs',
    'current_task', 'latest_output', 'snapshot_registry', 'task_state',
    'validation_state', 'lineage',
  ]);
  const seen = new Set();
  const rendered = [];
  for (const line of yaml) {
    const match = /^([a-zA-Z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (!match) {
      rendered.push(line);
      continue;
    }
    const key = match[1];
    seen.add(key);
    if (context.control === 'cli-managed' && recordOwned.has(key)) continue;
    if (Object.hasOwn(replacements, key) && replacements[key] !== undefined) {
      rendered.push(`${key}: ${yamlScalar(replacements[key])}`);
      continue;
    }
    if (key === 'id' && context.taskId) {
      rendered.push(`id: ${yamlScalar(context.taskId)}`);
      continue;
    }
    rendered.push(line);
  }
  for (const key of ['artifact', 'project', 'profile', 'execution_mode', 'created', 'updated']) {
    if (!seen.has(key) && replacements[key] !== undefined) rendered.push(`${key}: ${yamlScalar(replacements[key])}`);
  }
  return `---\n${rendered.join('\n')}\n---${text.slice(end + 4)}`;
}

function removeRecordOwnedSections(text) {
  const ownedHeading = /^#{2,6}\s+(?:(?:[0-9]+|[A-Z][0-9]+)\.\s*)?(?:Control state|Workflow state|State ownership mode|Status|Source snapshot registry|Snapshot registry|Artifact registry|Task state|Validation state|Output lineage|Implementation record and output lineage|Lineage)\s*$/i;
  const lines = text.split('\n');
  const kept = [];
  for (let index = 0; index < lines.length;) {
    const match = /^(#{2,6})\s+/.exec(lines[index]);
    if (!match || !ownedHeading.test(lines[index])) {
      kept.push(lines[index]);
      index += 1;
      continue;
    }
    const depth = match[1].length;
    index += 1;
    while (index < lines.length) {
      const next = /^(#{1,6})\s+/.exec(lines[index]);
      if (next && next[1].length <= depth) break;
      index += 1;
    }
  }
  return kept.filter((line) => !/^- (?:Status|Current stage|Current status|Execution mode|Selected profile|Active inputs?|Current task|Latest output|Task status|Validation status|Parent task-start snapshot|Implementation output snapshot|Output commit SHA|Produced by task):/i.test(line)).join('\n');
}

function substitute(text, context) {
  const values = {
    '{{artifact}}': context.artifact,
    '{{project}}': context.project,
    '{{profile}}': context.profile,
    '{{mode}}': context.mode,
    '{{date}}': context.date,
    '{{task.id}}': context.taskId,
    '{{task.title}}': context.taskTitle,
  };
  let rendered = text;
  for (const [token, value] of Object.entries(values)) {
    if (value !== undefined) rendered = rendered.replaceAll(token, String(value));
  }
  const task = context.taskId ? parseTaskId(context.taskId) : null;
  if (context.taskId && !task) throw new Error(`Invalid task ID: ${context.taskId}. Expected Pxx-Txx.`);
  if (task) rendered = rendered.replaceAll('P01-T01', task.id);
  if (task || context.taskTitle) {
    const phaseLabel = task?.phaseLabel ?? '01';
    const taskLabel = task?.taskLabel ?? '01';
    const title = context.taskTitle ?? 'Task title';
    rendered = rendered.replace('# Phase 01 — Task 01: Task title', `# Phase ${phaseLabel} — Task ${taskLabel}: ${title}`);
  }
  rendered = rendered.replaceAll('YYYY-MM-DD', context.date);
  const unresolved = rendered.match(/{{[^}\n]+}}|YYYY-MM-DD|<UNRESOLVED:[^>]+>/g);
  if (unresolved) throw new Error(`Artifact contains unresolved placeholders: ${[...new Set(unresolved)].join(', ')}`);
  return rendered;
}

export function renderArtifactTemplate(type, options) {
  const mapping = ARTIFACT_FILES[type];
  if (!mapping) throw new Error(`Unknown artifact type: ${type}`);
  const control = options.control ?? 'cli-managed';
  if (!CONTROL_VALUES.includes(control)) throw new Error(`Unknown control mode: ${control}`);
  const templatePath = join(packageRoot, 'templates', mapping[1]);
  const template = readFileSync(templatePath, 'utf8');
  let body = extractSingleRegion(template, ARTIFACT_START, ARTIFACT_END, 'artifact');
  body = selectControlBlocks(body, control);
  body = unwrapFrontmatter(body);
  body = rewriteFrontmatter(body, {
    artifact: type,
    project: options.project,
    profile: options.profile,
    mode: options.mode,
    date: options.date ?? new Date().toISOString().slice(0, 10),
    taskId: options.taskId,
    control,
  });
  body = substitute(body, {
    artifact: type,
    project: options.project,
    profile: options.profile,
    mode: options.mode,
    date: options.date ?? new Date().toISOString().slice(0, 10),
    taskId: options.taskId,
    taskTitle: options.taskTitle,
  });
  if (control === 'cli-managed') body = removeRecordOwnedSections(body);
  return `${body.trim()}\n`;
}

export function artifactDestination(cwd, type, options = {}) {
  const mapping = ARTIFACT_FILES[type];
  if (!mapping) throw new Error(`Unknown artifact type: ${type}`);
  let filename = mapping[0];
  if (type === 'TASK' && options.taskId) {
    const task = parseTaskId(options.taskId);
    if (!task) throw new Error(`Invalid task ID: ${options.taskId}. Expected Pxx-Txx.`);
    filename = `Phase-${task.phaseLabel}--Task-${task.taskLabel}.md`;
  }
  return options.path
    ? (isAbsolute(options.path) ? options.path : resolve(cwd, options.path))
    : join(cwd, filename);
}

export function renderArtifactFile(cwd, type, options) {
  const path = artifactDestination(cwd, type, options);
  return {
    path,
    content: renderArtifactTemplate(type, options),
  };
}
