import {
  addArtifactCandidate, booleanOption, commandFailure, invalidateCurrentGate,
  nextArtifactId, now, optionString, parseValidationStatus, recordPathFor, taskById,
} from '../command-support.mjs';
import { taskCompletionGitFindings } from '../git-worktree-policy.mjs';
import { commitRecordCandidate, mutateRecord, prepareRecordMutation } from '../record-store.mjs';
import { verifyRepositoryCommit } from '../repository-binding.mjs';
import { startTaskAtCurrentHead } from '../task-lineage.mjs';
import {
  commaList, nextId, nextTaskId, normalizeChoice, values, write,
} from '../utils.mjs';
import { workflowDiagnostics } from '../workflow-diagnostics.mjs';
import {
  ID_PATTERNS, VALIDATION_KINDS, VALIDATION_STATUSES,
} from '../workflow-model.mjs';
import { projectRootForRecord } from '../workspace.mjs';

export function commandTask(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const path = recordPathFor(cwd, options);
    if (action === 'create') {
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.state.stage !== 9) {
        throw new Error('Tasks may be created only during Stage 9 decomposition.');
      }
      if (record.project.profile === 'Express' && record.tasks.length >= 1) {
        throw new Error('Express permits exactly one implementation task.');
      }
      const baseline = optionString(options, 'baseline')
        ?? record.state.latestOutput
        ?? [...record.state.activeInputs].reverse().find((id) => id.startsWith('SRC-REPO-'));
      if (!baseline) throw new Error('No repository baseline is available.');
      const id = optionString(options, 'id') ?? nextTaskId(record.tasks);
      if (record.tasks.some((item) => item.id === id)) {
        throw new Error(`Task ${id} already exists.`);
      }
      const prerequisites = commaList(options.prerequisites);
      if (record.project.profile === 'Express' && prerequisites.length) {
        throw new Error('Express tasks cannot have prerequisites.');
      }
      const references = commaList(options.references);
      record.tasks.push({
        id,
        status: 'Not started',
        baseline,
        prerequisites,
        references,
        output: null,
        blocker: null,
        validation: [],
      });
      const fileChanges = new Map();
      if (record.project.profile !== 'Express') {
        addArtifactCandidate(cwd, record, 'TASK', fileChanges, {
          id: nextArtifactId(record, 'TASK', id),
          taskId: id,
          taskTitle: optionString(options, 'title') ?? 'Implementation task',
          path: optionString(options, 'path'),
          baseline: [...new Set([...record.state.activeInputs, baseline])],
        });
      }
      invalidateCurrentGate(record);
      commitRecordCandidate({
        recordPath: path,
        currentRecord: prepared.record,
        candidate: record,
        fileChanges,
      });
      write(stdout, `Created task ${id}`);
      return 0;
    }
    if (action === 'validation' && positionals[2] === 'set') {
      const id = positionals[3];
      if (!id) throw new Error('Usage: design-workflow task validation set <task-id> ...');
      const name = optionString(options, 'name', { required: true });
      const kind = normalizeChoice(
        optionString(options, 'kind', { required: true }),
        VALIDATION_KINDS,
      );
      if (!kind) throw new Error(`Unknown validation kind. Choose: ${VALIDATION_KINDS.join(', ')}`);
      const status = parseValidationStatus(optionString(options, 'status', { required: true }));
      if (!status) {
        throw new Error(`Unknown validation status. Choose: ${VALIDATION_STATUSES.join(', ')}`);
      }
      const required = booleanOption(options.required, true);
      const expected = optionString(options, 'expected', { required: true });
      const evidence = values(options.evidence)
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean);
      const check = {
        name,
        kind,
        required,
        status,
        expected,
        ...(optionString(options, 'actual') ? { actual: optionString(options, 'actual') } : {}),
        ...(optionString(options, 'command') ? { command: optionString(options, 'command') } : {}),
        ...(optionString(options, 'environment')
          ? { environment: optionString(options, 'environment') }
          : {}),
        ...(optionString(options, 'executed-at')
          ? { executedAt: optionString(options, 'executed-at') }
          : {}),
        evidence,
        ...(optionString(options, 'reason') ? { reason: optionString(options, 'reason') } : {}),
        references: commaList(options.references),
      };
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) {
          throw new Error('Task validation may be recorded only during Stages 9 and 10.');
        }
        const task = taskById(record, id);
        const index = task.validation.findIndex((item) => (
          item.name.toLowerCase() === name.toLowerCase()
        ));
        if (index >= 0) task.validation[index] = check;
        else task.validation.push(check);
        invalidateCurrentGate(record);
      });
      write(stdout, `Set validation ${id}/${name}: ${status}`);
      return 0;
    }
    const id = positionals[2];
    if (!id) throw new Error('Task ID is required.');
    if (action === 'ready') {
      mutateRecord(path, (record) => {
        if (record.state.stage !== 9) {
          throw new Error('Tasks become Ready only during the Stage 9 exit.');
        }
        const task = taskById(record, id);
        if (task.status !== 'Not started') {
          throw new Error(`${id} must be Not started before Ready.`);
        }
        task.status = 'Ready';
        invalidateCurrentGate(record);
      });
      write(stdout, `${id} is Ready`);
      return 0;
    }
    if (action === 'start') {
      const start = startTaskAtCurrentHead(path, id);
      write(stdout, `Started ${id} from ${start.baseline} at HEAD ${start.commit}`);
      return 0;
    }
    if (action === 'block') {
      const reason = optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) {
          throw new Error('Tasks may be blocked only during Stages 9 and 10.');
        }
        const task = taskById(record, id);
        if (task.status === 'Blocked' || task.status === 'Complete') {
          throw new Error(`${id} cannot be blocked from ${task.status}.`);
        }
        task.blocker = { reason, previousStatus: task.status, recordedAt: now() };
        task.status = 'Blocked';
        if (record.state.currentTask === id) record.state.currentTask = null;
        for (const gate of record.gates) {
          if (gate.stage >= record.state.stage && gate.status === 'Active') {
            gate.status = 'Superseded';
          }
        }
        record.state.status = 'Blocked';
        invalidateCurrentGate(record, 'Blocked');
      });
      write(stdout, `Blocked ${id}`);
      return 0;
    }
    if (action === 'unblock') {
      mutateRecord(path, (record) => {
        if (![9, 10].includes(record.state.stage)) {
          throw new Error('Tasks may be unblocked only during Stages 9 and 10.');
        }
        const task = taskById(record, id);
        if (task.status !== 'Blocked' || !task.blocker) throw new Error(`${id} is not blocked.`);
        const previousStatus = task.blocker.previousStatus;
        if (previousStatus === 'In progress') {
          if (record.state.currentTask && record.state.currentTask !== id) {
            throw new Error(`${record.state.currentTask} is already in progress.`);
          }
          record.state.currentTask = id;
        }
        task.status = previousStatus;
        task.blocker = null;
        record.state.status = 'In progress';
        invalidateCurrentGate(record);
      });
      write(stdout, `Unblocked ${id}`);
      return 0;
    }
    if (action === 'complete') {
      const commit = optionString(options, 'commit', { required: true }).toLowerCase();
      if (!ID_PATTERNS.commit.test(commit)) {
        throw new Error('--commit must be a full 40-character Git SHA.');
      }
      const prepared = prepareRecordMutation(path);
      const currentTask = prepared.record.tasks.find((item) => item.id === id);
      const findings = [
        ...workflowDiagnostics(path, prepared.record).findings,
        ...(currentTask
          ? taskCompletionGitFindings(path, prepared.record, currentTask, commit)
          : []),
      ];
      if (findings.length > 0) throw new Error(findings.join('\n'));
      const record = prepared.candidate;
      if (record.state.stage !== 10) {
        throw new Error('Task completion is allowed only during Stage 10.');
      }
      const task = taskById(record, id);
      if (task.status !== 'In progress' || record.state.currentTask !== id) {
        throw new Error(`${id} must be the current In progress task before completion.`);
      }
      for (const pair of values(options.check)) {
        const separator = String(pair).indexOf('=');
        if (separator <= 0 || separator === String(pair).length - 1) {
          throw new Error(`Invalid --check value: ${pair}. Use name=evidence.`);
        }
        const name = String(pair).slice(0, separator).trim();
        const evidence = String(pair).slice(separator + 1).trim();
        const check = task.validation.find((item) => (
          item.name.toLowerCase() === name.toLowerCase()
        ));
        if (!check) {
          throw new Error(`--check cannot create undeclared validation "${name}". Use "task validation set" first.`);
        }
        check.status = 'Passed';
        check.actual = evidence;
        check.executedAt = now();
        check.evidence = [...new Set([...check.evidence, evidence])];
        delete check.reason;
      }
      if (task.validation.length === 0) {
        throw new Error('Task completion requires declared validation checks.');
      }
      const unresolved = task.validation.filter((check) => (
        check.required
          ? check.status !== 'Passed'
          : !['Passed', 'Not applicable'].includes(check.status)
      ));
      if (unresolved.length) {
        throw new Error(`Validation remains unresolved: ${unresolved.map((check) => check.name).join(', ')}`);
      }
      const baseline = record.snapshots.find((snapshot) => (
        snapshot.id === task.baseline && snapshot.id.startsWith('SRC-REPO-')
      ));
      if (!baseline) {
        throw new Error(`Task baseline ${task.baseline} does not reference a repository snapshot.`);
      }
      const verified = verifyRepositoryCommit(projectRootForRecord(path), baseline, commit);
      const outputId = optionString(options, 'output') ?? nextId(record.snapshots, 'SRC-REPO-');
      if (record.snapshots.some((snapshot) => snapshot.id === outputId)) {
        throw new Error(`Snapshot ${outputId} already exists.`);
      }
      record.snapshots.push({
        id: outputId,
        role: 'Implementation output',
        pinStrength: 'Immutable',
        status: 'Active',
        reference: verified.reference,
        commit,
        parent: task.baseline,
        task: id,
      });
      task.output = outputId;
      task.status = 'Complete';
      task.blocker = null;
      record.state.currentTask = null;
      record.state.latestOutput = outputId;
      record.state.status = 'Ready';
      invalidateCurrentGate(record);
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Completed ${id}; output ${outputId} at HEAD ${commit}`);
      return 0;
    }
    throw new Error('Usage: design-workflow task <create|ready|start|block|unblock|complete|validation set> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
