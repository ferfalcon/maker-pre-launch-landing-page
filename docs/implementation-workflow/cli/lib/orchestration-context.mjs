import { dirname, relative, resolve } from 'node:path';
import { STAGES } from './workflow-model.mjs';
import { toolkitBindingFromRecord, toolkitPromptSource } from './toolkit-binding.mjs';
import { deriveNextAction, readyTask } from './workflow-actions.mjs';
import { workflowDiagnostics } from './workflow-diagnostics.mjs';
import { checkStage } from './stage-check.mjs';

export const STAGE_PROMPTS = [
  'prompts/00-intake.md',
  'prompts/01-audit.md',
  'prompts/02-requirements.md',
  'prompts/03-design.md',
  'prompts/04-specification.md',
  'prompts/05-document-review.md',
  'prompts/06-architecture.md',
  'prompts/07-plan.md',
  'prompts/08-plan-review.md',
  'prompts/09-task-decomposition.md',
  'prompts/10-implement-task.md',
  'prompts/11-implementation-review.md',
];

const GUIDELINES_BY_STAGE = new Map([
  [2, ['guidelines/REQUIREMENTS.md']],
  [3, ['guidelines/DESIGN.md']],
  [4, ['guidelines/SPEC.md']],
  [6, ['guidelines/ARCHITECTURE.md']],
  [7, ['guidelines/PLAN.md']],
  [8, ['guidelines/PLAN.md']],
]);

const TEMPLATE_BY_ARTIFACT_TYPE = new Map([
  ['WORKPACK', 'templates/WORKPACK.template.md'],
  ['SOURCE-BASELINE', 'templates/SOURCE-BASELINE.template.md'],
  ['PROJECT-CONTEXT', 'templates/PROJECT-CONTEXT.template.md'],
  ['WORKFLOW-STATE', 'templates/WORKFLOW-STATE.template.md'],
  ['DESIGN-AUDIT', 'templates/DESIGN-AUDIT.template.md'],
  ['IMPLEMENTATION-BRIEF', 'templates/IMPLEMENTATION-BRIEF.template.md'],
  ['REQUIREMENTS', 'templates/REQUIREMENTS.template.md'],
  ['DESIGN', 'templates/DESIGN.template.md'],
  ['SPEC', 'templates/SPEC.template.md'],
  ['DOCUMENT-REVIEW', 'templates/DOCUMENT-REVIEW.template.md'],
  ['ARCHITECTURE', 'templates/ARCHITECTURE.template.md'],
  ['PLAN', 'templates/PLAN.template.md'],
  ['PLAN-REVIEW', 'templates/PLAN-REVIEW.template.md'],
  ['TASKS-INDEX', 'templates/TASKS-INDEX.template.md'],
  ['TASK', 'templates/TASK.template.md'],
  ['IMPLEMENTATION-REVIEW', 'templates/IMPLEMENTATION-REVIEW.template.md'],
]);

const SOURCE_ADAPTER_CHOICES = [
  { format: 'figma', path: 'source-adapters/FIGMA.md' },
  { format: 'screenshots', path: 'source-adapters/SCREENSHOTS.md' },
  { format: 'pdf', path: 'source-adapters/PDF.md' },
  { format: 'existing-website', path: 'source-adapters/EXISTING-WEBSITE.md' },
  { format: 'mixed-sources', path: 'source-adapters/MIXED-SOURCES.md' },
];

export function stageTargets(record) {
  const profile = record.project.profile;
  const stage = record.state.stage;
  if (profile === 'Express') return ['WORKPACK'];
  if (stage === 0) return ['SOURCE-BASELINE', 'PROJECT-CONTEXT', 'WORKFLOW-STATE'];
  if (stage === 1) return ['DESIGN-AUDIT'];
  if (profile === 'Lite' && stage >= 2 && stage <= 8) return ['IMPLEMENTATION-BRIEF'];
  if (stage === 2) return ['REQUIREMENTS'];
  if (stage === 3) return ['DESIGN'];
  if (stage === 4) return ['SPEC'];
  if (stage === 5) return ['DOCUMENT-REVIEW'];
  if (stage === 6) {
    return record.state.architectureDecision?.result === 'Required' || profile === 'Full'
      ? ['ARCHITECTURE']
      : ['WORKFLOW-STATE'];
  }
  if (stage === 7) return ['PLAN'];
  if (stage === 8) return ['PLAN-REVIEW'];
  if (stage === 9) return profile === 'Lite' ? ['TASK'] : ['TASKS-INDEX', 'TASK'];
  if (stage === 10) return ['TASK'];
  if (stage === 11) return ['IMPLEMENTATION-REVIEW'];
  return [];
}

function resourceLocation(toolkit, path) {
  return toolkitPromptSource(toolkit, path);
}

function resourceDescriptor(toolkit, kind, path, extra = {}) {
  return {
    kind,
    path,
    location: resourceLocation(toolkit, path),
    ...extra,
  };
}

export function stageResources(record, toolkit = toolkitBindingFromRecord(record)) {
  const stage = record.state.stage;
  const prompt = STAGE_PROMPTS[stage] ?? null;
  const required = [];
  if (prompt) required.push(resourceDescriptor(toolkit, 'prompt', prompt));
  for (const path of GUIDELINES_BY_STAGE.get(stage) ?? []) {
    required.push(resourceDescriptor(toolkit, 'guideline', path));
  }

  const onDemand = [];
  const seenTemplates = new Set();
  for (const type of stageTargets(record)) {
    const path = TEMPLATE_BY_ARTIFACT_TYPE.get(type);
    if (path && !seenTemplates.has(path)) {
      seenTemplates.add(path);
      onDemand.push(resourceDescriptor(toolkit, 'template', path, {
        when: 'creating-or-restructuring-target-artifact',
      }));
    }
  }

  return {
    required,
    onDemand,
    conditional: [{
      kind: 'source-adapter',
      when: 'source-inspection-requires-format-specific-guidance',
      rule: 'Select only the adapter matching the actual source; do not browse or load the other adapters.',
      selectOneOf: SOURCE_ADAPTER_CHOICES.map((choice) => ({
        ...choice,
        location: resourceLocation(toolkit, choice.path),
      })),
    }],
  };
}

function executionKind(record, diagnostics) {
  if (record.schemaVersion === 1) return 'migration';
  if (!diagnostics.valid) return 'repair';
  if ((record.profileTransitions ?? []).some((item) => item.status === 'In progress')) return 'profile-upgrade';
  if (record.state.status === 'Blocked') return 'blocker';
  if (record.state.stage === 9) return 'task-decomposition';
  if (record.state.stage === 10) return 'implementation-task';
  if (record.state.stage === 11) return 'final-review';
  return 'stage';
}

function latestVerification(record, snapshotId) {
  return [...(record.verifications ?? [])].reverse().find((item) => item.snapshot === snapshotId) ?? null;
}

function taskSummary(task) {
  return {
    id: task.id,
    status: task.status,
    baseline: task.baseline,
    prerequisites: task.prerequisites,
    references: task.references,
    output: task.output,
    validation: (task.validation ?? []).map((check) => ({
      name: check.name,
      kind: check.kind,
      required: check.required,
      status: check.status,
      subject: check.subject ?? null,
      references: check.references,
    })),
  };
}

function projectRootDisplay(recordPath, cwd) {
  const projectRoot = resolve(dirname(recordPath), '..');
  return relative(cwd, projectRoot).split('\\').join('/') || '.';
}

export function canEditImplementation(record, diagnostics, currentTask) {
  return (
    diagnostics.valid
    && record.schemaVersion === 2
    && record.state.stage === 10
    && record.project.executionMode !== 'Continuous documentation'
    && currentTask?.status === 'In progress'
    && record.state.currentTask === currentTask.id
  );
}

export function buildOrchestrationContext(recordPath, record, { cwd }) {
  const diagnostics = workflowDiagnostics(recordPath, record);
  const stage = record.state.stage;
  const targets = stageTargets(record);
  const activeArtifacts = record.artifacts.filter((artifact) => artifact.status !== 'Superseded');
  const targetArtifacts = activeArtifacts.filter((artifact) => targets.includes(artifact.type));
  const currentTask = record.state.currentTask
    ? record.tasks.find((task) => task.id === record.state.currentTask) ?? null
    : null;
  const nextReadyTask = readyTask(record) ?? null;
  const check = checkStage(recordPath, record);
  const implementationAllowed = canEditImplementation(record, diagnostics, currentTask);
  const toolkit = toolkitBindingFromRecord(record);
  const prompt = STAGE_PROMPTS[stage] ?? null;
  const resources = stageResources(record, toolkit);

  return {
    protocolVersion: 2,
    initialized: true,
    control: {
      mode: 'cli-managed',
      schemaVersion: record.schemaVersion,
      readOnly: record.schemaVersion !== 2,
      record: relative(cwd, recordPath).split('\\').join('/'),
    },
    project: {
      name: record.project.name,
      profile: record.project.profile,
      executionMode: record.project.executionMode,
      root: projectRootDisplay(recordPath, cwd),
    },
    toolkit,
    workflow: diagnostics,
    stage: {
      number: stage,
      name: STAGES[stage] ?? 'Unknown stage',
      status: record.state.status,
      architectureDecision: record.state.architectureDecision,
    },
    execution: {
      kind: executionKind(record, diagnostics),
      prompt,
      promptSource: resourceLocation(toolkit, prompt),
      resources,
      primaryArtifactTypes: targets,
      artifacts: targetArtifacts.map((artifact) => ({
        id: artifact.id,
        type: artifact.type,
        path: artifact.path,
        status: artifact.status,
        baseline: artifact.baseline,
        approvedRevision: artifact.approvedRevision ?? null,
      })),
      sourceAdapterPolicy: 'Select the matching source adapter from execution.resources.conditional using the actual source; source format is not canonical record state in schema v2.',
    },
    sources: {
      active: record.state.activeInputs.map((id) => {
        const snapshot = record.snapshots.find((item) => item.id === id);
        return snapshot ? { ...snapshot, latestVerification: latestVerification(record, id) } : { id, missing: true };
      }),
      latestOutput: record.state.latestOutput,
      latestValidationRuntime: record.state.latestValidationRuntime,
    },
    tasks: {
      current: currentTask ? taskSummary(currentTask) : null,
      ready: record.tasks.filter((task) => task.status === 'Ready').map(taskSummary),
      nextReady: nextReadyTask ? nextReadyTask.id : null,
    },
    profileTransition: record.profileTransitions.find((item) => item.status === 'In progress') ?? null,
    stageCheck: check,
    policy: {
      workflowMutation: record.schemaVersion === 2 && diagnostics.valid ? 'allowed' : 'repair-or-migration-required',
      implementation: implementationAllowed ? 'allowed-with-current-task-scope' : 'forbidden',
      codeEdits: implementationAllowed ? 'allowed-with-current-task-scope' : 'forbidden',
      stageDecision: record.project.executionMode === 'Gated' ? 'human-approval-required' : 'agent-permitted-when-evidence-supports-it',
      generatedViews: 'read-only-projections',
      workflowReads: 'context-resource-manifest-only',
    },
    nextAction: deriveNextAction(record),
  };
}
