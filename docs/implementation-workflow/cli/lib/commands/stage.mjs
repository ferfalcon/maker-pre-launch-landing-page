import {
  addArtifactCandidate, commandFailure, invalidateCurrentGate, latestVerificationIds,
  now, optionString, recordPathFor, requireCleanCurrent,
} from '../command-support.mjs';
import { commitRecordCandidate, mutateRecord, prepareRecordMutation } from '../record-store.mjs';
import { fail, nextId, normalizeChoice, write } from '../utils.mjs';
import { stageAdvanceFindings } from '../workflow-actions.mjs';
import {
  GATE_RESULTS, MODES, STAGES, artifactTypesForStage,
} from '../workflow-model.mjs';
import {
  rewindStageForReplanning, startProfileUpgradeForReplanning,
} from '../workflow-transitions.mjs';

export function commandStage(cwd, stdout, stderr, positionals, options) {
  const action = positionals[1];
  if (action === 'set') {
    return fail(stderr, '"stage set" is non-mutating compatibility syntax. Use "stage review", "stage advance", or "stage rewind".');
  }
  if (action === 'rewind') {
    return rewindStageForReplanning(cwd, stdout, stderr, positionals, options);
  }
  try {
    const path = recordPathFor(cwd, options);
    if (action === 'review') {
      const result = normalizeChoice(optionString(options, 'result', { required: true }), GATE_RESULTS);
      if (!result) throw new Error(`Unknown gate result. Choose: ${GATE_RESULTS.join(', ')}`);
      const evidence = optionString(options, 'evidence', { required: true });
      const approvedBy = optionString(options, 'approved-by');
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      if (record.project.executionMode === 'Gated' && !approvedBy) {
        throw new Error('--approved-by is required for every Gated stage decision.');
      }
      for (const gate of record.gates) {
        if (gate.stage === record.state.stage && gate.status === 'Active') gate.status = 'Superseded';
      }
      const gate = {
        id: nextId(record.gates, 'GATE-'),
        stage: record.state.stage,
        status: 'Active',
        result,
        baseline: [...record.state.activeInputs],
        verifications: latestVerificationIds(record),
        artifacts: record.artifacts.filter((item) => item.status !== 'Superseded').map((item) => item.id),
        evidence,
        recordedAt: now(),
        ...(approvedBy ? { approvedBy } : {}),
      };
      record.gates.push(gate);
      record.state.status = result.startsWith('Passed') ? 'Ready' : 'Blocked';
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Recorded ${gate.id}: Stage ${gate.stage} — ${result}`);
      return 0;
    }
    if (action === 'advance') {
      const prepared = prepareRecordMutation(path);
      requireCleanCurrent(path, prepared.record, 'stage advancement');
      const record = prepared.candidate;
      const findings = stageAdvanceFindings(record);
      if (findings.length > 0) throw new Error(findings.join('\n'));
      const nextStage = record.state.stage + 1;
      record.state.stage = nextStage;
      record.state.status = 'In progress';
      const fileChanges = new Map();
      const scaffolded = [];
      for (const type of artifactTypesForStage(
        record.project.profile,
        nextStage,
        record.state.architectureDecision,
      )) {
        if (!record.artifacts.some((item) => item.type === type && item.status !== 'Superseded')) {
          addArtifactCandidate(cwd, record, type, fileChanges);
          scaffolded.push(type);
        }
      }
      commitRecordCandidate({
        recordPath: path,
        currentRecord: prepared.record,
        candidate: record,
        fileChanges,
      });
      write(stdout, `Advanced to Stage ${nextStage} — ${STAGES[nextStage]}`);
      if (scaffolded.length) write(stdout, `Scaffolded: ${scaffolded.join(', ')}`);
      return 0;
    }
    throw new Error('Usage: design-workflow stage <review|advance|rewind>');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandArchitecture(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'decide' || !positionals[2]) {
      throw new Error('Usage: design-workflow architecture decide <required|not-required> --reason <text>');
    }
    const normalized = positionals[2].toLowerCase();
    const result = normalized === 'required'
      ? 'Required'
      : normalized === 'not-required'
        ? 'Not required'
        : null;
    if (!result) throw new Error('Architecture decision must be required or not-required.');
    const reason = optionString(options, 'reason', { required: true });
    const path = recordPathFor(cwd, options);
    const prepared = prepareRecordMutation(path);
    const record = prepared.candidate;
    invalidateCurrentGate(record);
    record.state.architectureDecision = { result, reason, recordedAt: now() };
    const fileChanges = new Map();
    if (
      result === 'Required'
      && record.project.profile === 'Standard'
      && record.state.stage >= 6
      && !record.artifacts.some((artifact) => (
        artifact.type === 'ARCHITECTURE' && artifact.status !== 'Superseded'
      ))
    ) {
      addArtifactCandidate(cwd, record, 'ARCHITECTURE', fileChanges);
    }
    if (result === 'Required' && ['Express', 'Lite'].includes(record.project.profile)) {
      record.state.status = 'Blocked';
    }
    commitRecordCandidate({
      recordPath: path,
      currentRecord: prepared.record,
      candidate: record,
      fileChanges,
    });
    write(stdout, `Architecture decision recorded: ${result}`);
    if (fileChanges.size > 0) write(stdout, 'Scaffolded: ARCHITECTURE');
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandMode(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'set' || !positionals[2]) {
      throw new Error('Usage: design-workflow mode set <mode>');
    }
    const mode = normalizeChoice(positionals.slice(2).join(' '), MODES);
    if (!mode) throw new Error(`Unknown execution mode. Choose: ${MODES.join(', ')}`);
    const path = recordPathFor(cwd, options);
    mutateRecord(path, (record) => {
      if (mode === 'Task-by-task' && record.state.stage < 9) {
        throw new Error('Task-by-task mode requires Stage 9 or later.');
      }
      if (mode === 'Continuous documentation' && record.state.stage >= 10) {
        throw new Error('Continuous-documentation mode cannot be selected at Stage 10 or later.');
      }
      invalidateCurrentGate(record);
      record.project.executionMode = mode;
    });
    write(stdout, `Execution mode set to ${mode}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandProfile(cwd, stdout, stderr, positionals, options) {
  if (positionals[1] !== 'upgrade') {
    return fail(stderr, 'Usage: design-workflow profile upgrade <start|finish> ...');
  }
  const action = positionals[2];
  if (action === 'start') {
    return startProfileUpgradeForReplanning(cwd, stdout, stderr, positionals, options);
  }
  try {
    const path = recordPathFor(cwd, options);
    if (action === 'finish') {
      const evidence = optionString(options, 'evidence', { required: true });
      const approvedBy = optionString(options, 'approved-by');
      const prepared = prepareRecordMutation(path);
      const record = prepared.candidate;
      const transition = record.profileTransitions.find((item) => item.status === 'In progress');
      if (!transition) throw new Error('No profile upgrade is in progress.');
      if (record.project.executionMode === 'Gated' && !approvedBy) {
        throw new Error('--approved-by is required to finish a Gated profile upgrade.');
      }
      const unreconciled = transition.targetArtifacts.filter((id) => {
        const artifact = record.artifacts.find((item) => item.id === id);
        return !artifact || !['Reviewed', 'Approved'].includes(artifact.status);
      });
      if (unreconciled.length > 0) {
        throw new Error(`Target artifacts are not reconciled: ${unreconciled.join(', ')}`);
      }
      const obsoleteOwnerIds = new Set(transition.sourceArtifacts.filter((id) => {
        const artifact = record.artifacts.find((candidate) => candidate.id === id);
        return artifact && ['WORKPACK', 'IMPLEMENTATION-BRIEF'].includes(artifact.type);
      }));
      const unreconciledTrace = record.traceItems.filter((item) => (
        item.status === 'Active' && obsoleteOwnerIds.has(item.owner)
      ));
      if (unreconciledTrace.length > 0) {
        throw new Error(`Trace owners must be reconciled before profile finish: ${unreconciledTrace.map((item) => item.id).join(', ')}. Use "trace update --owner".`);
      }
      transition.status = 'Complete';
      transition.completedAt = now();
      transition.evidence = evidence;
      if (approvedBy) transition.approvedBy = approvedBy;
      const replacement = transition.targetArtifacts[0];
      for (const id of transition.sourceArtifacts) {
        const artifact = record.artifacts.find((item) => item.id === id);
        if (
          artifact
          && ['WORKPACK', 'IMPLEMENTATION-BRIEF'].includes(artifact.type)
          && replacement
        ) {
          artifact.status = 'Superseded';
          artifact.supersededBy = replacement;
        }
      }
      record.state.status = 'In progress';
      commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
      write(stdout, `Finished ${transition.id}: profile is now ${transition.to}`);
      return 0;
    }
    throw new Error('Usage: design-workflow profile upgrade <start|finish> ...');
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
