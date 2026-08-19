import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { renderArtifactFile } from '../artifact-renderer.mjs';
import {
  addArtifactCandidate, artifactBySelector, commandFailure, date,
  invalidateCurrentGate, nextArtifactId, now, optionString, recordPathFor,
  relativeArtifactPath, writeNewNarratives,
} from '../command-support.mjs';
import { commitRecordCandidate, mutateRecord, prepareRecordMutation } from '../record-store.mjs';
import {
  artifactType, commaList, normalizeChoice, relativeDisplay, write,
} from '../utils.mjs';

export function commandArtifact(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const selector = positionals[2];
    if (action === 'scaffold' || action === 'create') {
      const type = artifactType(selector);
      if (!type) throw new Error(`Unknown artifact type: ${selector ?? ''}`);
      const control = normalizeChoice(
        options.control ?? (action === 'create' ? 'cli-managed' : null),
        ['cli-managed', 'markdown-only'],
      );
      if (!control) throw new Error('--control must be cli-managed or markdown-only.');
      if (control === 'markdown-only') {
        const rendered = renderArtifactFile(cwd, type, {
          control,
          project: optionString(options, 'project') ?? cwd.split(/[\\/]/).filter(Boolean).at(-1),
          profile: optionString(options, 'profile') ?? 'Standard',
          mode: optionString(options, 'mode') ?? 'Gated',
          date: date(),
          taskId: optionString(options, 'task-id'),
          taskTitle: optionString(options, 'title'),
          path: optionString(options, 'path'),
        });
        writeNewNarratives(new Map([[rendered.path, rendered.content]]));
        write(stdout, `Scaffolded Markdown-only ${type}: ${relativeDisplay(cwd, rendered.path)}`);
        return 0;
      }
      const path = recordPathFor(cwd, options);
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.project.profile === 'Express' && type !== 'WORKPACK') {
        throw new Error('Express consolidates artifact ownership in WORKPACK; upgrade the profile first.');
      }
      const fileChanges = new Map();
      const artifact = addArtifactCandidate(cwd, record, type, fileChanges, {
        path: optionString(options, 'path'),
        id: optionString(options, 'id'),
        taskId: optionString(options, 'task-id'),
        taskTitle: optionString(options, 'title'),
        baseline: options.baseline ? commaList(options.baseline) : undefined,
      });
      if (fileChanges.size === 0) {
        throw new Error(`An active ${type} artifact already exists as ${artifact.id}.`);
      }
      invalidateCurrentGate(record);
      commitRecordCandidate({
        recordPath: path,
        currentRecord: prepared.record,
        candidate: record,
        fileChanges,
      });
      write(stdout, `Scaffolded ${artifact.id}: ${artifact.path}`);
      return 0;
    }
    if (action === 'adopt') {
      const type = artifactType(selector);
      if (!type) throw new Error(`Unknown artifact type: ${selector ?? ''}`);
      const narrative = optionString(options, 'path', { required: true });
      const absolute = isAbsolute(narrative) ? narrative : resolve(cwd, narrative);
      if (!existsSync(absolute)) throw new Error(`Narrative file does not exist: ${absolute}`);
      const path = recordPathFor(cwd, options);
      let id;
      mutateRecord(path, (record) => {
        const taskId = optionString(options, 'task-id');
        id = optionString(options, 'id') ?? nextArtifactId(record, type, taskId ?? '');
        const artifactPath = relativeArtifactPath(cwd, absolute);
        const conflict = record.artifacts.find((item) => (
          item.status !== 'Superseded'
          && (
            item.id === id
            || item.path === artifactPath
            || (type !== 'TASK' && item.type === type)
          )
        ));
        if (conflict) throw new Error(`Narrative conflicts with active artifact ${conflict.id}.`);
        record.artifacts.push({
          id,
          type,
          path: artifactPath,
          status: 'Draft',
          baseline: options.baseline ? commaList(options.baseline) : [...record.state.activeInputs],
        });
        invalidateCurrentGate(record);
      });
      write(stdout, `Adopted ${narrative} as ${id}`);
      return 0;
    }
    const path = recordPathFor(cwd, options);
    if (['review', 'approve', 'reopen'].includes(action)) {
      if (!selector) {
        throw new Error(`Usage: design-workflow artifact ${action} <artifact-id|type> --evidence <text>`);
      }
      const evidence = optionString(options, 'evidence', { required: true });
      const actor = optionString(options, 'approved-by') ?? optionString(options, 'by');
      let id;
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        if (!artifact) throw new Error(`Artifact ${selector} does not exist.`);
        const expected = action === 'review' ? 'Draft' : action === 'approve' ? 'Reviewed' : null;
        const next = action === 'review' ? 'Reviewed' : action === 'approve' ? 'Approved' : 'Draft';
        if (expected && artifact.status !== expected) {
          throw new Error(`${artifact.id} must be ${expected} before ${action}.`);
        }
        if (action === 'reopen' && !['Reviewed', 'Approved'].includes(artifact.status)) {
          throw new Error(`${artifact.id} must be Reviewed or Approved before reopen.`);
        }
        if (action === 'approve' && record.project.executionMode === 'Gated' && !actor) {
          throw new Error('--approved-by is required to approve an artifact in Gated mode.');
        }
        artifact.status = next;
        artifact.statusChangedAt = now();
        artifact.statusEvidence = evidence;
        if (actor) artifact.statusBy = actor;
        invalidateCurrentGate(record);
        if (action === 'reopen') {
          for (const gate of record.gates) {
            if (gate.stage >= record.state.stage && gate.status === 'Active') {
              gate.status = 'Superseded';
            }
          }
          record.state.status = 'In progress';
        }
        id = artifact.id;
      });
      write(stdout, `${id} is now ${action === 'review' ? 'Reviewed' : action === 'approve' ? 'Approved' : 'Draft'}`);
      return 0;
    }
    if (action === 'supersede') {
      const replacement = optionString(options, 'by', { required: true });
      optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        const by = artifactBySelector(record, replacement);
        if (!artifact || !by) throw new Error('Both artifacts must exist.');
        if (artifact.id === by.id) throw new Error('An artifact cannot supersede itself.');
        invalidateCurrentGate(record);
        artifact.status = 'Superseded';
        artifact.supersededBy = by.id;
        artifact.statusChangedAt = now();
        artifact.statusEvidence = options.reason;
      });
      write(stdout, `Superseded ${selector} by ${replacement}`);
      return 0;
    }
    if (action === 'baseline') {
      const baseline = commaList(options.baseline ?? options.snapshot);
      if (baseline.length === 0) throw new Error('--baseline or --snapshot is required.');
      let reopened = false;
      mutateRecord(path, (record) => {
        const artifact = artifactBySelector(record, selector);
        if (!artifact) throw new Error(`Artifact ${selector} does not exist.`);
        const changed = JSON.stringify(artifact.baseline) !== JSON.stringify(baseline);
        artifact.baseline = baseline;
        if (changed) {
          invalidateCurrentGate(record);
          record.state.status = 'In progress';
        }
        if (changed && artifact.status === 'Approved') {
          artifact.status = 'Draft';
          artifact.statusChangedAt = now();
          artifact.statusEvidence = 'Approved baseline changed; artifact reopened.';
          for (const gate of record.gates) {
            if (gate.stage >= record.state.stage && gate.status === 'Active') {
              gate.status = 'Superseded';
            }
          }
          record.state.status = 'In progress';
          reopened = true;
        }
      });
      write(stdout, `Updated ${selector} baseline.${reopened ? ' Approved artifact reopened to Draft.' : ''}`);
      return 0;
    }
    throw new Error('Usage: design-workflow artifact <adopt|scaffold|review|approve|reopen|supersede|baseline> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
