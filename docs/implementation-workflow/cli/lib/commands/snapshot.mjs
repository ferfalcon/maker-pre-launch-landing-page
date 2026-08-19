import {
  commandFailure, invalidateCurrentGate, now, optionString, recordPathFor,
} from '../command-support.mjs';
import { mutateRecord } from '../record-store.mjs';
import { nextId, normalizeChoice, write } from '../utils.mjs';
import { SNAPSHOT_KINDS, VERIFICATION_RESULTS } from '../workflow-model.mjs';

export function commandSnapshot(cwd, stdout, stderr, positionals, options) {
  try {
    const action = positionals[1];
    const path = recordPathFor(cwd, options);
    if (action === 'add') {
      const kind = typeof options.kind === 'string'
        ? SNAPSHOT_KINDS[options.kind.toLowerCase()]
        : null;
      if (!kind) {
        throw new Error(`Unknown snapshot kind. Choose: ${Object.keys(SNAPSHOT_KINDS).join(', ')}`);
      }
      const reference = optionString(options, 'reference', { required: true });
      let createdId;
      mutateRecord(path, (record) => {
        const id = optionString(options, 'id') ?? nextId(record.snapshots, `SRC-${kind}-`);
        const commit = optionString(options, 'commit')?.toLowerCase();
        const role = optionString(options, 'role') ?? 'Input baseline';
        const snapshot = {
          id,
          role,
          pinStrength: optionString(options, 'pin') ?? (
            kind === 'REPO' && commit ? 'Immutable' : 'Time-bound'
          ),
          status: optionString(options, 'status') ?? 'Unverified',
          reference,
          ...(commit ? { commit } : {}),
          ...(optionString(options, 'parent') ? { parent: optionString(options, 'parent') } : {}),
          ...(optionString(options, 'task') ? { task: optionString(options, 'task') } : {}),
        };
        record.snapshots.push(snapshot);
        if (options.activate || role === 'Input baseline') {
          record.state.activeInputs = [...new Set([...record.state.activeInputs, id])];
        }
        invalidateCurrentGate(record);
        createdId = id;
      });
      write(stdout, `Added snapshot ${createdId}`);
      return 0;
    }
    if (action === 'verify') {
      const id = positionals[2];
      if (!id) {
        throw new Error('Usage: design-workflow snapshot verify <id> --result <result> --method <text> --evidence <text>');
      }
      const result = normalizeChoice(
        optionString(options, 'result', { required: true }),
        VERIFICATION_RESULTS,
      );
      if (!result) {
        throw new Error(`Unknown verification result. Choose: ${VERIFICATION_RESULTS.join(', ')}`);
      }
      const method = optionString(options, 'method', { required: true });
      const evidence = optionString(options, 'evidence', { required: true });
      let verificationId;
      mutateRecord(path, (record) => {
        const snapshot = record.snapshots.find((item) => item.id === id);
        if (!snapshot) throw new Error(`Snapshot ${id} does not exist.`);
        verificationId = nextId(record.verifications, 'VER-');
        record.verifications.push({
          id: verificationId,
          snapshot: id,
          result,
          method,
          evidence,
          checkedAt: now(),
        });
        invalidateCurrentGate(record);
        if (
          ['Unexpected upstream or concurrent change', 'Unavailable'].includes(result)
          && record.state.activeInputs.includes(id)
        ) {
          record.state.status = 'Blocked';
          for (const gate of record.gates) {
            if (gate.stage >= record.state.stage && gate.status === 'Active') {
              gate.status = 'Superseded';
            }
          }
        } else if (snapshot.status === 'Unverified') {
          snapshot.status = 'Active';
        }
      });
      write(stdout, `Recorded ${verificationId}: ${id} — ${result}`);
      return 0;
    }
    if (action === 'supersede') {
      const id = positionals[2];
      const replacementId = optionString(options, 'by', { required: true });
      const reason = optionString(options, 'reason', { required: true });
      mutateRecord(path, (record) => {
        const snapshot = record.snapshots.find((item) => item.id === id);
        const replacement = record.snapshots.find((item) => item.id === replacementId);
        if (!snapshot || !replacement) {
          throw new Error('Both the superseded snapshot and replacement must exist.');
        }
        if (id === replacementId) throw new Error('A snapshot cannot supersede itself.');
        if (snapshot.status === 'Superseded') throw new Error(`Snapshot ${id} is already superseded.`);
        snapshot.status = 'Superseded';
        snapshot.supersededBy = replacementId;
        if (replacement.status === 'Superseded') {
          throw new Error(`Replacement snapshot ${replacementId} is superseded.`);
        }
        record.state.activeInputs = record.state.activeInputs.map((item) => (
          item === id ? replacementId : item
        ));
        record.state.activeInputs = [...new Set(record.state.activeInputs)];
        record.verifications.push({
          id: nextId(record.verifications, 'VER-'),
          snapshot: id,
          result: 'Unexpected upstream or concurrent change',
          method: 'Snapshot supersession',
          evidence: reason,
          checkedAt: now(),
          replacement: replacementId,
        });
        for (const gate of record.gates) {
          if (gate.stage >= record.state.stage && gate.status === 'Active') {
            gate.status = 'Superseded';
          }
        }
        record.state.status = 'Blocked';
      });
      write(stdout, `Superseded ${id} by ${replacementId}; artifact baselines were not rewritten.`);
      return 0;
    }
    throw new Error('Usage: design-workflow snapshot <add|verify|supersede> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
