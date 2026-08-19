#!/usr/bin/env node

import { artifactDestination, renderArtifactTemplate } from '../cli/lib/artifact-renderer.mjs';
import {
  nextTaskId, normalizeTaskCreateArgs, normalizeTaskPhase, parseTaskId,
} from '../cli/lib/utils.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(callback, expected, message) {
  try {
    callback();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expected), `${message}: unexpected error ${error}`);
    return;
  }
  throw new Error(`${message}: expected an error`);
}

const parsed = parseTaskId('P02-T03');
assert(parsed?.phase === 2 && parsed.task === 3, 'Task ID parser did not expose numeric phase/task values');
assert(parsed?.phaseLabel === '02' && parsed.taskLabel === '03', 'Task ID parser did not preserve zero-padded labels');
assert(parseTaskId('P2-T3') === null, 'Task ID parser accepted a non-canonical ID');

assert(normalizeTaskPhase('2') === 2, 'Numeric phase option did not normalize');
assert(normalizeTaskPhase('02') === 2, 'Zero-padded phase option did not normalize');
assert(normalizeTaskPhase('P02') === 2, 'P-prefixed phase option did not normalize');
assertThrows(() => normalizeTaskPhase('100'), '--phase must be', 'Out-of-range phase was accepted');

const tasks = [
  { id: 'P01-T01' },
  { id: 'P01-T03' },
  { id: 'P02-T01' },
];
assert(nextTaskId([]) === 'P01-T01', 'Empty task set did not default to Phase 01');
assert(nextTaskId(tasks) === 'P02-T02', 'Automatic task ID did not continue in the highest existing phase');
assert(nextTaskId(tasks, 1) === 'P01-T04', 'Explicit phase did not increment within that phase');
assert(nextTaskId(tasks, 'P03') === 'P03-T01', 'Explicit new phase did not start at Task 01');
assertThrows(
  () => nextTaskId([{ id: 'P02-T99' }], 2),
  'already contains Task 99',
  'Task numbering overflow was not rejected',
);

const rendered = renderArtifactTemplate('TASK', {
  control: 'cli-managed',
  project: 'Phase fixture',
  profile: 'Standard',
  mode: 'Gated',
  date: '2026-08-18',
  taskId: 'P02-T03',
  taskTitle: 'Implement phase-aware task rendering',
});
assert(rendered.includes('id: P02-T03'), 'Task frontmatter did not use the requested task ID');
assert(
  rendered.includes('# Phase 02 — Task 03: Implement phase-aware task rendering'),
  'Task heading did not derive phase/task labels from the task ID',
);
const destination = artifactDestination('/tmp/phase-fixture', 'TASK', { taskId: 'P02-T03' });
assert(destination.endsWith('/Phase-02--Task-03.md'), 'Task filename did not derive phase/task labels from the task ID');
assertThrows(
  () => artifactDestination('/tmp/phase-fixture', 'TASK', { taskId: 'P2-T3' }),
  'Expected Pxx-Txx',
  'Renderer accepted a non-canonical task ID',
);

const normalizedArgs = normalizeTaskCreateArgs(
  ['task', 'create', '--phase', '3', '--title', 'Phase 3 task'],
  tasks,
);
assert(!normalizedArgs.includes('--phase'), 'Task create forwarding retained --phase');
const idIndex = normalizedArgs.indexOf('--id');
assert(idIndex >= 0 && normalizedArgs[idIndex + 1] === 'P03-T01', 'Task create did not translate --phase into the expected task ID');

const inlinePhaseArgs = normalizeTaskCreateArgs(
  ['task', 'create', '--phase=P02', '--title', 'Another phase 2 task'],
  tasks,
);
const inlineIdIndex = inlinePhaseArgs.indexOf('--id');
assert(inlineIdIndex >= 0 && inlinePhaseArgs[inlineIdIndex + 1] === 'P02-T02', 'Inline --phase syntax did not normalize correctly');

assertThrows(
  () => normalizeTaskCreateArgs(['task', 'create', '--phase', '2', '--id', 'P02-T09'], tasks),
  'cannot be combined with --id',
  'Conflicting phase and explicit task ID were accepted',
);
assertThrows(
  () => normalizeTaskCreateArgs(['task', 'create', '--phase', '2', '--phase', '3'], tasks),
  'may be specified only once',
  'Repeated phase option was accepted',
);

console.log('Multi-phase task ID, CLI phase selection, rendering, and filename tests passed.');
