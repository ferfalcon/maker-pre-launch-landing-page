import {
  booleanOption, commandFailure, invalidateCurrentGate, loadRecord, optionString,
  recordPathFor,
} from '../command-support.mjs';
import { mutateRecord } from '../record-store.mjs';
import { commaList, write } from '../utils.mjs';
import { ID_PATTERNS } from '../workflow-model.mjs';

export function commandTrace(cwd, stdout, stderr, positionals, options) {
  try {
    let action = positionals[1];
    let id = positionals[2];
    if (action && !['define', 'update', 'supersede', 'show'].includes(action)) {
      id = action;
      action = 'show';
    }
    if (!action || !id) {
      throw new Error('Usage: design-workflow trace <define|update|supersede|show> <domain-id> ...');
    }
    const path = recordPathFor(cwd, options);
    if (action === 'show') {
      const { record } = loadRecord(cwd, options);
      const item = record.traceItems?.find((candidate) => candidate.id === id);
      const matches = [];
      if (item) {
        matches.push(`Definition: owner ${item.owner}, ${item.required ? 'required' : 'optional'}, ${item.status}; upstream: ${item.references.join(', ') || 'none'}`);
      }
      for (const task of record.tasks) {
        if (task.references.includes(id)) matches.push(`Task ${task.id} (${task.status})`);
        for (const check of task.validation) {
          if (check.references?.includes(id)) {
            matches.push(`Validation ${task.id}/${check.name} (${check.status})`);
          }
        }
      }
      if (matches.length === 0) throw new Error(`No traceability references found for ${id}.`);
      write(stdout, `Traceability for ${id}:`);
      matches.forEach((match) => write(stdout, `- ${match}`));
      return 0;
    }
    if (!ID_PATTERNS.domain.test(id)) throw new Error(`Invalid canonical domain ID: ${id}`);
    if (action === 'define') {
      const owner = optionString(options, 'owner', { required: true });
      mutateRecord(path, (record) => {
        if (record.traceItems.some((item) => item.id === id)) {
          throw new Error(`Trace item ${id} already exists.`);
        }
        record.traceItems.push({
          id,
          owner,
          status: 'Active',
          required: booleanOption(options.required, false),
          references: commaList(options.references),
        });
        invalidateCurrentGate(record);
      });
      write(stdout, `Defined ${id}`);
      return 0;
    }
    if (action === 'update') {
      mutateRecord(path, (record) => {
        const item = record.traceItems.find((candidate) => candidate.id === id);
        if (!item) throw new Error(`Trace item ${id} does not exist.`);
        if (options.owner !== undefined) {
          item.owner = optionString(options, 'owner', { required: true });
        }
        if (options.required !== undefined) item.required = booleanOption(options.required);
        if (options.references !== undefined) item.references = commaList(options.references);
        invalidateCurrentGate(record);
      });
      write(stdout, `Updated ${id}`);
      return 0;
    }
    if (action === 'supersede') {
      const replacement = optionString(options, 'by', { required: true });
      mutateRecord(path, (record) => {
        const item = record.traceItems.find((candidate) => candidate.id === id);
        const by = record.traceItems.find((candidate) => candidate.id === replacement);
        if (!item || !by) throw new Error('Both trace definitions must exist.');
        if (id === replacement) throw new Error('A trace item cannot supersede itself.');
        invalidateCurrentGate(record);
        for (const candidate of record.traceItems) {
          if (candidate.status === 'Active') {
            candidate.references = candidate.references.map((reference) => (
              reference === id ? replacement : reference
            ));
            candidate.references = [...new Set(candidate.references)];
          }
        }
        for (const task of record.tasks) {
          task.references = task.references.map((reference) => (
            reference === id ? replacement : reference
          ));
          task.references = [...new Set(task.references)];
          for (const check of task.validation) {
            check.references = check.references.map((reference) => (
              reference === id ? replacement : reference
            ));
            check.references = [...new Set(check.references)];
          }
        }
        item.status = 'Superseded';
        item.supersededBy = replacement;
      });
      write(stdout, `Superseded ${id} by ${replacement}`);
      return 0;
    }
    throw new Error('Unknown trace action.');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
