import {
  commandFailure, invalidateCurrentGate, now, optionString, recordPathFor,
  requireCleanCurrent,
} from '../command-support.mjs';
import { commitRecordCandidate, prepareRecordMutation } from '../record-store.mjs';
import { nextId, normalizeChoice, write } from '../utils.mjs';

export function commandReview(cwd, stdout, stderr, positionals, options) {
  try {
    if (positionals[1] !== 'set-result' || !positionals[2]) {
      throw new Error('Usage: design-workflow review set-result <result> --artifact <id> --output <snapshot> --evidence <text> --approved-by <actor>');
    }
    const result = normalizeChoice(
      positionals[2],
      ['accepted', 'accepted-with-deviations', 'requires-corrections'],
    );
    if (!result) {
      throw new Error('Result must be accepted, accepted-with-deviations, or requires-corrections.');
    }
    const artifactIdValue = optionString(options, 'artifact', { required: true });
    const output = optionString(options, 'output', { required: true });
    const evidence = optionString(options, 'evidence', { required: true });
    const approvedBy = optionString(options, 'approved-by', { required: true });
    const runtime = optionString(options, 'runtime');
    const path = recordPathFor(cwd, options);
    const prepared = prepareRecordMutation(path);
    requireCleanCurrent(path, prepared.record, 'final acceptance');
    const record = prepared.candidate;
    if (record.state.stage !== 11) {
      throw new Error('Final review result can only be recorded at Stage 11.');
    }
    const finalGate = [...record.gates].reverse().find((item) => (
      item.stage === 11 && item.status === 'Active'
    ));
    if (
      result !== 'requires-corrections'
      && (!finalGate || !['Passed', 'Passed with assumptions'].includes(finalGate.result))
    ) {
      throw new Error('Final acceptance requires an active passing Stage 11 gate.');
    }
    const expectedArtifactType = record.project.profile === 'Express'
      ? 'WORKPACK'
      : 'IMPLEMENTATION-REVIEW';
    const artifact = record.artifacts.find((item) => item.id === artifactIdValue);
    if (!artifact || artifact.type !== expectedArtifactType || artifact.status !== 'Approved') {
      throw new Error(`Final review for ${record.project.profile} must reference an Approved ${expectedArtifactType} artifact.`);
    }
    if (record.state.latestOutput !== output) {
      throw new Error('Final review output must equal the Stage 10 latest implementation output.');
    }
    const snapshot = record.snapshots.find((item) => (
      item.id === output && item.role === 'Implementation output'
    ));
    if (!snapshot) throw new Error('Output must reference an Implementation output snapshot.');
    if (
      runtime
      && !record.snapshots.some((item) => (
        item.id === runtime && item.role === 'Validation runtime'
      ))
    ) {
      throw new Error('Runtime must reference a Validation runtime snapshot.');
    }
    for (const review of record.implementationReviews) {
      if (review.status === 'Active') review.status = 'Superseded';
    }
    const reviewId = nextId(record.implementationReviews, 'REVIEW-');
    record.implementationReviews.push({
      id: reviewId,
      status: 'Active',
      result,
      artifact: artifactIdValue,
      output,
      ...(runtime ? { runtime } : {}),
      evidence,
      recordedAt: now(),
      approvedBy,
      deviations: result === 'accepted-with-deviations' ? [evidence] : [],
    });
    record.state.latestOutput = output;
    if (runtime) record.state.latestValidationRuntime = runtime;
    record.state.status = result === 'requires-corrections' ? 'Blocked' : 'Complete';
    if (result === 'requires-corrections') invalidateCurrentGate(record, 'Blocked');
    commitRecordCandidate({ recordPath: path, currentRecord: prepared.record, candidate: record });
    write(stdout, `Recorded ${reviewId}: ${result}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}
