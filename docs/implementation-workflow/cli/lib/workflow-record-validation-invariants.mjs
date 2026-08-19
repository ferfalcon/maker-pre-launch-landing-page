import {
  allowedTraceOwnerTypes, artifactTypesThroughStage,
} from './workflow-model.mjs';
import { findCycles, push } from './workflow-record-validation-primitives.mjs';

const EXECUTABLE_REPOSITORY_ROLES = ['Input baseline', 'Task start', 'Implementation output'];

export function validateSharedReferences(errors, record, snapshotsById, artifactsById, tasksById, { version = 2 } = {}) {
  for (const id of record.state?.activeInputs ?? []) {
    const snapshot = snapshotsById.get(id);
    if (!snapshot) push(errors, '$.state.activeInputs', `references missing snapshot ${id}`);
    else if (snapshot.status !== 'Active' && snapshot.status !== 'Unverified') {
      push(errors, '$.state.activeInputs', `active input ${id} is ${snapshot.status}`);
    }
  }

  const currentTask = record.state?.currentTask ? tasksById.get(record.state.currentTask) : null;
  if (record.state?.currentTask && !currentTask) {
    push(errors, '$.state.currentTask', `references missing task ${record.state.currentTask}`);
  }
  if (version === 2) {
    const inProgressTasks = [...tasksById.values()].filter((task) => task.status === 'In progress');
    if (inProgressTasks.length > 1) {
      push(errors, '$.tasks', `multiple In progress tasks exist: ${inProgressTasks.map((task) => task.id).join(', ')}`);
    }
    if (currentTask && currentTask.status !== 'In progress') {
      push(errors, '$.state.currentTask', `current task ${currentTask.id} must be In progress`);
    }
    if (!record.state?.currentTask && inProgressTasks.length === 1) {
      push(errors, '$.state.currentTask', `In progress task ${inProgressTasks[0].id} requires state.currentTask`);
    }
  }

  if (record.state?.latestOutput) {
    const output = snapshotsById.get(record.state.latestOutput);
    if (!output) push(errors, '$.state.latestOutput', `references missing snapshot ${record.state.latestOutput}`);
    else if (output.role !== 'Implementation output') push(errors, '$.state.latestOutput', 'must reference an Implementation output snapshot');
    else if (version === 2) {
      if (output.status !== 'Active') push(errors, '$.state.latestOutput', 'must reference an Active Implementation output snapshot');
      const producingTask = output.task ? tasksById.get(output.task) : null;
      if (producingTask && producingTask.output !== output.id) {
        push(errors, '$.state.latestOutput', `snapshot ${output.id} is not the recorded output of ${producingTask.id}`);
      }
      if (producingTask && producingTask.status !== 'Complete') {
        push(errors, '$.state.latestOutput', `snapshot ${output.id} must be produced by a Complete task`);
      }
    }
  }
  if (record.state?.latestValidationRuntime) {
    const runtime = snapshotsById.get(record.state.latestValidationRuntime);
    if (!runtime) push(errors, '$.state.latestValidationRuntime', `references missing snapshot ${record.state.latestValidationRuntime}`);
    else if (runtime.role !== 'Validation runtime') push(errors, '$.state.latestValidationRuntime', 'must reference a Validation runtime snapshot');
    else if (version === 2) {
      if (runtime.status !== 'Active') push(errors, '$.state.latestValidationRuntime', 'must reference an Active Validation runtime snapshot');
      if (record.state.latestOutput && runtime.parent !== record.state.latestOutput) {
        push(errors, '$.state.latestValidationRuntime', `must parent latest output ${record.state.latestOutput}`);
      }
    }
  }

  record.artifacts?.forEach((artifact, index) => {
    for (const snapshotId of artifact.baseline ?? []) {
      if (!snapshotsById.has(snapshotId)) push(errors, `$.artifacts[${index}].baseline`, `references missing snapshot ${snapshotId}`);
    }
    if (artifact.supersededBy && !artifactsById.has(artifact.supersededBy)) {
      push(errors, `$.artifacts[${index}].supersededBy`, `references missing artifact ${artifact.supersededBy}`);
    }
  });

  record.tasks?.forEach((task, index) => {
    const baseline = snapshotsById.get(task.baseline);
    if (!baseline) push(errors, `$.tasks[${index}].baseline`, `references missing snapshot ${task.baseline}`);
    else if (version === 2) {
      if (!EXECUTABLE_REPOSITORY_ROLES.includes(baseline.role)) {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} role ${baseline.role} is not an executable repository baseline`);
      }
      if (baseline.pinStrength !== 'Immutable') {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} must use Immutable pin strength`);
      }
      if (!baseline.commit) {
        push(errors, `$.tasks[${index}].baseline`, `snapshot ${task.baseline} must record a commit SHA`);
      }
      if (task.status !== 'Complete' && baseline.status !== 'Active') {
        push(errors, `$.tasks[${index}].baseline`, `incomplete task ${task.id} requires an Active repository baseline`);
      }
    }
    for (const prerequisite of task.prerequisites ?? []) {
      if (!tasksById.has(prerequisite)) push(errors, `$.tasks[${index}].prerequisites`, `references missing task ${prerequisite}`);
      if (prerequisite === task.id) push(errors, `$.tasks[${index}].prerequisites`, 'task cannot depend on itself');
    }
    if (task.output) {
      const output = snapshotsById.get(task.output);
      if (!output) push(errors, `$.tasks[${index}].output`, `references missing snapshot ${task.output}`);
      else {
        if (output.role !== 'Implementation output') push(errors, `$.tasks[${index}].output`, 'must reference an Implementation output snapshot');
        if (output.task !== task.id) push(errors, `$.tasks[${index}].output`, `snapshot ${task.output} is not attributed to ${task.id}`);
        if (output.parent !== task.baseline) push(errors, `$.tasks[${index}].output`, `snapshot ${task.output} parent must equal task baseline ${task.baseline}`);
      }
    }
    if (task.status === 'Complete') {
      if ((task.validation ?? []).length === 0) push(errors, `$.tasks[${index}].validation`, 'Complete task requires at least one declared validation check');
      if (!task.output) push(errors, `$.tasks[${index}].output`, 'Complete task requires an output snapshot');
      const unresolved = (task.validation ?? []).filter((check) => (
        check.required === false
          ? !['Passed', 'Not applicable'].includes(check.status)
          : check.status !== 'Passed'
      ));
      if (unresolved.length > 0) push(errors, `$.tasks[${index}].validation`, 'Complete task cannot contain failed, blocked, or unexecuted required validation');
    }
  });

  record.snapshots?.forEach((snapshot, index) => {
    const parent = snapshot.parent ? snapshotsById.get(snapshot.parent) : null;
    const task = snapshot.task ? tasksById.get(snapshot.task) : null;
    if (snapshot.parent && !parent) push(errors, `$.snapshots[${index}].parent`, `references missing snapshot ${snapshot.parent}`);
    if (snapshot.task && !task) push(errors, `$.snapshots[${index}].task`, `references missing task ${snapshot.task}`);
    if (snapshot.supersededBy && !snapshotsById.has(snapshot.supersededBy)) push(errors, `$.snapshots[${index}].supersededBy`, `references missing snapshot ${snapshot.supersededBy}`);
    if (version === 2 && ['Task start', 'Implementation output'].includes(snapshot.role) && parent) {
      if (!parent.id?.startsWith('SRC-REPO-') || !EXECUTABLE_REPOSITORY_ROLES.includes(parent.role)) {
        push(errors, `$.snapshots[${index}].parent`, `snapshot ${snapshot.parent} is not an executable repository parent`);
      }
    }
    if (version === 2 && snapshot.role === 'Task start' && task && task.baseline !== snapshot.id) {
      push(errors, `$.snapshots[${index}].task`, `Task start snapshot ${snapshot.id} must equal task ${task.id} baseline`);
    }
    if (version === 2 && snapshot.role === 'Implementation output' && task && task.output !== snapshot.id) {
      push(errors, `$.snapshots[${index}].task`, `Implementation output ${snapshot.id} must equal task ${task.id} output`);
    }
  });

  for (const cycle of findCycles(new Set(tasksById.keys()), (id) => tasksById.get(id)?.prerequisites ?? [])) {
    push(errors, '$.tasks', `dependency cycle detected: ${cycle.join(' -> ')}`);
  }
}

export function validateProfileRules(errors, record, artifactsById, { legacy = false } = {}) {
  const profile = record.project?.profile;
  const stage = record.state?.stage;
  const activeArtifacts = [...artifactsById.values()].filter((artifact) => artifact.status !== 'Superseded');
  const activeTypes = new Set(activeArtifacts.map((artifact) => artifact.type));
  const requiredTypes = legacy
    ? artifactTypesThroughStage(profile, 11, profile === 'Full' ? { result: 'Required' } : record.state?.architectureDecision)
    : artifactTypesThroughStage(profile, Number.isInteger(stage) ? stage : 0, record.state?.architectureDecision);
  for (const type of requiredTypes) {
    if (!activeTypes.has(type)) push(errors, '$.artifacts', `${profile} profile requires ${type}`);
  }
  if (profile === 'Express') {
    for (const artifact of activeArtifacts) {
      if (artifact.type !== 'WORKPACK') push(errors, '$.artifacts', `Express profile must consolidate ${artifact.type} responsibility in WORKPACK`);
    }
    if ((record.tasks?.length ?? 0) > 1) push(errors, '$.tasks', 'Express profile permits at most one implementation task');
    record.tasks?.forEach((task, index) => {
      if ((task.prerequisites ?? []).length > 0) push(errors, `$.tasks[${index}].prerequisites`, 'Express task cannot have task prerequisites');
    });
    const stageNineClosed = stage > 9 || record.gates?.some((gate) => gate.stage === 9 && gate.status === 'Active' && ['Passed', 'Passed with assumptions'].includes(gate.result));
    if (stageNineClosed && record.tasks?.length !== 1) push(errors, '$.tasks', 'Express profile requires exactly one task by the Stage 9 exit');
  }
  if (profile === 'Lite' && ['REQUIREMENTS', 'DESIGN', 'SPEC', 'PLAN'].some((type) => activeTypes.has(type))) {
    push(errors, '$.artifacts', 'Lite profile should consolidate requirements, design, specification, and planning in IMPLEMENTATION-BRIEF');
  }
  const activeTransition = record.profileTransitions?.some((transition) => transition.status === 'In progress');
  if (!activeTransition && profile === 'Lite' && activeTypes.has('WORKPACK')) {
    push(errors, '$.artifacts', 'Lite profile must supersede the Express WORKPACK after upgrade reconciliation');
  }
  if (!activeTransition && ['Standard', 'Full'].includes(profile)) {
    for (const type of ['WORKPACK', 'IMPLEMENTATION-BRIEF']) {
      if (activeTypes.has(type)) push(errors, '$.artifacts', `${profile} profile must supersede consolidated ${type} after upgrade reconciliation`);
    }
  }
  if (record.project?.executionMode === 'Task-by-task' && Number.isInteger(stage) && stage < 9) {
    push(errors, '$.state.stage', 'Task-by-task mode requires task decomposition to be reached');
  }
  if (!legacy && record.project?.executionMode === 'Continuous documentation' && Number.isInteger(stage) && stage >= 10) {
    push(errors, '$.state.stage', 'Continuous-documentation mode cannot enter Stage 10');
  }
}

function latestActive(items, predicate) {
  return [...items].reverse().find((item) => item.status === 'Active' && predicate(item));
}

function traceAncestors(traceById, id, seen = new Set()) {
  if (seen.has(id)) return seen;
  seen.add(id);
  const item = traceById.get(id);
  for (const reference of item?.references ?? []) {
    if (traceById.has(reference)) traceAncestors(traceById, reference, seen);
  }
  return seen;
}

function validateStageExit(errors, record, stage, gate, maps) {
  const activeArtifacts = [...maps.artifactsById.values()].filter((item) => item.status !== 'Superseded');
  const artifactsOfType = (type, status = 'Approved') => activeArtifacts.some((item) => item.type === type && item.status === status);
  const approved = (...types) => types.some((type) => artifactsOfType(type));
  const reviewed = (...types) => types.some((type) => activeArtifacts.some((item) => item.type === type && ['Reviewed', 'Approved'].includes(item.status)));
  const profile = record.project.profile;
  const consolidated = profile === 'Express' ? 'WORKPACK' : profile === 'Lite' ? 'IMPLEMENTATION-BRIEF' : null;
  const gatePath = `$.gates[${record.gates.indexOf(gate)}]`;
  const requireCondition = (condition, message) => { if (!condition) push(errors, gatePath, message); };
  const blockedInput = record.state.activeInputs.find((id) => {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
    return verification && ['Unexpected upstream or concurrent change', 'Unavailable'].includes(verification.result);
  });
  requireCondition(!blockedInput, blockedInput ? `Snapshot ${blockedInput} has a blocking verification result` : 'Source verification is clear');
  if (gate.result.startsWith('Passed')) {
    const unverifiedInput = record.state.activeInputs.find((id) => {
      const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
      return !verification || !['Unchanged', 'Expected workflow output'].includes(verification.result);
    });
    requireCondition(!unverifiedInput, unverifiedInput ? `Snapshot ${unverifiedInput} requires a passing verification` : 'Active inputs are verified');
  }
  const unrecordedInput = record.state.activeInputs.find((id) => !gate.baseline.includes(id));
  requireCondition(!unrecordedInput, unrecordedInput ? `Gate baseline omits active input ${unrecordedInput}` : 'Gate baseline records active inputs');
  const missingVerification = record.state.activeInputs.find((id) => {
    const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
    return verification && !gate.verifications.includes(verification.id);
  });
  requireCondition(!missingVerification, missingVerification ? `Gate omits the latest verification for ${missingVerification}` : 'Gate records current source verifications');
  const omittedArtifact = activeArtifacts.find((artifact) => !gate.artifacts.includes(artifact.id));
  requireCondition(!omittedArtifact, omittedArtifact ? `Gate omits active artifact ${omittedArtifact.id}` : 'Gate records active artifacts');

  if (stage === 0) {
    const verifiedInputs = record.state.activeInputs.every((id) => {
      const verification = [...record.verifications].reverse().find((item) => item.snapshot === id);
      return verification && ['Unchanged', 'Expected workflow output'].includes(verification.result);
    });
    requireCondition(record.state.activeInputs.length > 0 && verifiedInputs, 'Stage 0 requires every active input to have a passing verification');
    const controlRegistered = profile === 'Express'
      ? activeArtifacts.some((item) => item.type === 'WORKPACK')
      : artifactsOfType('SOURCE-BASELINE') && artifactsOfType('PROJECT-CONTEXT') && activeArtifacts.some((item) => item.type === 'WORKFLOW-STATE');
    requireCondition(controlRegistered, 'Stage 0 requires the profile control artifacts to be registered and source/context approvals where separate');
  }
  if (stage === 1 && profile !== 'Express') requireCondition(approved('DESIGN-AUDIT'), 'Stage 1 requires an approved DESIGN-AUDIT');
  if (stage === 2 && !consolidated) requireCondition(approved('REQUIREMENTS'), 'Stage 2 requires approved REQUIREMENTS');
  if (stage === 3 && !consolidated) requireCondition(approved('DESIGN'), 'Stage 3 requires approved DESIGN');
  if (stage === 4 && !consolidated) requireCondition(approved('SPEC'), 'Stage 4 requires approved SPEC');
  if (stage === 5) requireCondition(consolidated ? reviewed(consolidated) : approved('DOCUMENT-REVIEW'), 'Stage 5 requires reviewed consolidated documentation or approved DOCUMENT-REVIEW');
  if (stage === 6) {
    requireCondition(record.state.architectureDecision !== null, 'Stage 6 requires an architecture decision');
    const required = record.state.architectureDecision?.result === 'Required';
    if (required && ['Express', 'Lite'].includes(profile)) requireCondition(gate.result === 'Must upgrade', 'Architecture-required Express or Lite work must upgrade');
    if (profile === 'Full' || (required && profile === 'Standard')) requireCondition(approved('ARCHITECTURE'), 'Stage 6 requires an approved ARCHITECTURE artifact');
  }
  if (stage === 7) requireCondition(consolidated ? gate.result.startsWith('Passed') : reviewed('PLAN'), 'Stage 7 requires a reviewed plan or consolidated planning gate');
  if (stage === 8) requireCondition(profile === 'Express' ? reviewed('WORKPACK') : profile === 'Lite' ? approved('IMPLEMENTATION-BRIEF') : approved('PLAN') && approved('PLAN-REVIEW'), 'Stage 8 plan artifacts must be approved');
  if (stage === 9) {
    if (!consolidated) requireCondition(approved('TASKS-INDEX'), 'Stage 9 requires an approved TASKS-INDEX');
    if (profile !== 'Express') {
      const unapprovedTask = record.tasks.find((task) => !activeArtifacts.some((artifact) => (
        artifact.type === 'TASK' && artifact.status === 'Approved' && artifact.id.includes(task.id)
      )));
      requireCondition(!unapprovedTask, unapprovedTask ? `Stage 9 requires an approved TASK artifact for ${unapprovedTask.id}` : 'Task artifacts are approved');
    }
    requireCondition(record.tasks.length > 0 && record.tasks.every((task) => task.status === 'Ready'), 'Stage 9 requires every task to be Ready');
  }
  if (stage === 10) {
    requireCondition(record.tasks.length > 0 && record.tasks.every((task) => task.status === 'Complete'), 'Stage 10 requires every task to be Complete');
    requireCondition(Boolean(record.state.latestOutput), 'Stage 10 requires the latest implementation output');
  }
  if (stage === 11) {
    const latestOutput = record.state.latestOutput;
    const outputVerification = latestOutput && [...record.verifications].reverse().find((verification) => verification.snapshot === latestOutput);
    const verifiedOutput = outputVerification && ['Unchanged', 'Expected workflow output'].includes(outputVerification.result);
    requireCondition(verifiedOutput, 'Stage 11 requires the latest output to be reverified');
    if (outputVerification) {
      requireCondition(
        gate.verifications.includes(outputVerification.id),
        'Stage 11 gate must record the latest output verification',
      );
    }
    requireCondition(approved(profile === 'Express' ? 'WORKPACK' : 'IMPLEMENTATION-REVIEW'), 'Stage 11 requires an approved final review artifact');
  }
}

export function validateV2CrossRecord(errors, record, maps) {
  const {
    snapshotsById, artifactsById, tasksById, traceById, activeGateByStage,
  } = maps;

  validateSharedReferences(errors, record, snapshotsById, artifactsById, tasksById, { version: 2 });
  validateProfileRules(errors, record, artifactsById);

  for (const [id, item] of traceById) {
    const index = record.traceItems.indexOf(item);
    const owner = artifactsById.get(item.owner);
    if (!owner) push(errors, `$.traceItems[${index}].owner`, `references missing artifact ${item.owner}`);
    else {
      if (owner.status === 'Superseded' && item.status === 'Active') push(errors, `$.traceItems[${index}].owner`, 'active trace item owner must be active');
      if (!allowedTraceOwnerTypes(id).includes(owner.type)) push(errors, `$.traceItems[${index}].owner`, `${id} cannot be owned by ${owner.type}`);
    }
    for (const reference of item.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, `$.traceItems[${index}].references`, `unresolved trace reference ${reference}`);
      else if (item.status === 'Active' && referenced.status !== 'Active') push(errors, `$.traceItems[${index}].references`, `active trace item references superseded item ${reference}`);
    }
    if (item.supersededBy && !traceById.has(item.supersededBy)) push(errors, `$.traceItems[${index}].supersededBy`, `references missing trace item ${item.supersededBy}`);
  }
  for (const cycle of findCycles(new Set(traceById.keys()), (id) => traceById.get(id)?.references ?? [])) push(errors, '$.traceItems', `trace cycle detected: ${cycle.join(' -> ')}`);
  for (const task of record.tasks ?? []) {
    for (const reference of task.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, '$.tasks', `task ${task.id} has unresolved trace reference ${reference}`);
      else if (referenced.status !== 'Active') push(errors, '$.tasks', `task ${task.id} references superseded trace item ${reference}`);
    }
    for (const check of task.validation ?? []) for (const reference of check.references ?? []) {
      const referenced = traceById.get(reference);
      if (!referenced) push(errors, '$.tasks', `validation ${task.id}/${check.name} has unresolved trace reference ${reference}`);
      else if (referenced.status !== 'Active') push(errors, '$.tasks', `validation ${task.id}/${check.name} references superseded trace item ${reference}`);
    }
  }

  const gateBoundary = record.legacyBoundary?.gatesRequiredFromStage ?? 0;
  const currentStage = Number.isInteger(record.state?.stage) ? record.state.stage : 0;
  for (let stage = gateBoundary; stage < currentStage; stage += 1) {
    const gate = activeGateByStage.get(stage);
    if (!gate || !['Passed', 'Passed with assumptions'].includes(gate.result)) push(errors, '$.gates', `Stage ${stage} requires an active passing gate before Stage ${currentStage}`);
  }
  for (const gate of activeGateByStage.values()) {
    if (gate.stage === currentStage && ['Passed', 'Passed with assumptions', 'Must upgrade'].includes(gate.result)) validateStageExit(errors, record, gate.stage, gate, { snapshotsById, artifactsById, tasksById });
  }
  if ((record.profileTransitions ?? []).some((item) => item.status === 'In progress') && currentStage > record.profileTransitions.find((item) => item.status === 'In progress').resumeStage) push(errors, '$.state.stage', 'profile upgrade blocks advancement until finish');

  const enforcePlanCoverage = currentStage > 8 || ['Passed', 'Passed with assumptions'].includes(activeGateByStage.get(8)?.result);
  const enforceTaskCoverage = currentStage > 9 || ['Passed', 'Passed with assumptions'].includes(activeGateByStage.get(9)?.result);
  const requiredItems = [...traceById.values()].filter((item) => item.status === 'Active' && item.required);
  const activeTrace = [...traceById.values()].filter((item) => item.status === 'Active');
  for (const required of requiredItems) {
    const downstreamTrace = activeTrace.filter((candidate) => traceAncestors(traceById, candidate.id).has(required.id));
    if (enforcePlanCoverage && !downstreamTrace.some((item) => item.id.startsWith('PLAN-') || item.id.startsWith('AC-'))) push(errors, '$.traceItems', `required item ${required.id} does not reach an active plan or acceptance criterion`);
    const downstreamIds = new Set(downstreamTrace.map((item) => item.id));
    if (enforceTaskCoverage && !(record.tasks ?? []).some((task) => ['Ready', 'In progress', 'Blocked', 'Complete'].includes(task.status) && task.references.some((id) => downstreamIds.has(id)))) push(errors, '$.traceItems', `required item ${required.id} does not reach a Ready task`);
    const acceptedReview = latestActive(record.implementationReviews ?? [], (item) => ['accepted', 'accepted-with-deviations'].includes(item.result));
    if (acceptedReview && !(record.tasks ?? []).some((task) => task.validation.some((check) => check.required && check.status === 'Passed' && check.references.some((id) => downstreamIds.has(id))))) push(errors, '$.traceItems', `required item ${required.id} does not reach a Passed required validation check`);
  }

  const activeReview = latestActive(record.implementationReviews ?? [], () => true);
  if (record.state?.status === 'Complete') {
    if (currentStage !== 11) push(errors, '$.state.stage', 'Complete workflow must be at Stage 11');
    if (!activeReview || !['accepted', 'accepted-with-deviations'].includes(activeReview.result)) push(errors, '$.implementationReviews', 'Complete workflow requires an accepted active final-review event');
    const finalGate = activeGateByStage.get(11);
    if (!finalGate || !['Passed', 'Passed with assumptions'].includes(finalGate.result)) push(errors, '$.gates', 'Final acceptance requires an active passing Stage 11 gate');
    if (activeReview) {
      if (activeReview.output !== record.state.latestOutput) push(errors, '$.implementationReviews', 'Active final-review output must equal the latest implementation output');
      if (activeReview.runtime && activeReview.runtime !== record.state.latestValidationRuntime) push(errors, '$.implementationReviews', 'Active final-review runtime must equal the latest validation runtime');
      const outputVerification = [...record.verifications].reverse().find((item) => item.snapshot === activeReview.output);
      if (!outputVerification || !['Unchanged', 'Expected workflow output'].includes(outputVerification.result)) push(errors, '$.verifications', 'Final acceptance requires the reviewed output to be reverified');
      const reviewArtifact = artifactsById.get(activeReview.artifact);
      if (!reviewArtifact || reviewArtifact.status !== 'Approved') push(errors, '$.implementationReviews', 'Final acceptance requires an approved review artifact');
    }
    if ((record.tasks ?? []).some((task) => task.status !== 'Complete')) push(errors, '$.tasks', 'Complete workflow cannot contain incomplete tasks');
  }
  if (activeReview?.result === 'requires-corrections' && record.state?.status !== 'Blocked') push(errors, '$.state.status', 'requires-corrections final result must leave Stage 11 Blocked');
}
