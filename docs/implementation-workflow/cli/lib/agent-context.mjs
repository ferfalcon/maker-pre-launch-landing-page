import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOrchestrationContext } from './orchestration-context.mjs';
import { runtimeToolkitPin } from './toolkit-binding.mjs';
import { relativeDisplay } from './utils.mjs';

export const AGENT_PROTOCOL_VERSION = 3;

const TOOLKIT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const NON_STAGE_EXECUTION_KINDS = new Set(['migration', 'repair']);

function localToolkitMatches(context) {
  if (!context.toolkit?.pinned) return true;
  if (context.toolkit.ambiguous || context.toolkit.invalid || context.toolkit.legacy) return false;
  const runtime = runtimeToolkitPin();
  return Boolean(
    runtime
    && runtime.repository === context.toolkit.repository
    && runtime.revision === context.toolkit.revision,
  );
}

function resourceResolution(context, embed) {
  if (embed) return 'embedded';
  if (context.toolkit?.ambiguous || context.toolkit?.invalid) return 'repair-toolkit-binding';
  if (context.toolkit?.legacy) return 'migrate-toolkit-binding';
  return 'pinned-source-required';
}

function materializeResource(context, descriptor) {
  const embed = localToolkitMatches(context);
  return {
    ...descriptor,
    source: descriptor.location ?? null,
    resolution: resourceResolution(context, embed),
    content: embed ? readFileSync(resolve(TOOLKIT_ROOT, descriptor.path), 'utf8') : null,
  };
}

function templateArtifactType(path) {
  const name = path.split('/').at(-1) ?? '';
  return name.endsWith('.template.md') ? name.slice(0, -'.template.md'.length) : null;
}

export function agentResourcesForContext(context) {
  if (NON_STAGE_EXECUTION_KINDS.has(context.execution.kind)) {
    return {
      required: [],
      stagePrompt: null,
      guidance: [],
      templates: [],
      conditional: [],
      manifest: context.execution.resources ?? null,
    };
  }

  const manifest = context.execution.resources ?? { required: [], onDemand: [], conditional: [] };
  const required = (manifest.required ?? []).map((resource) => materializeResource(context, resource));
  const stagePrompt = required.find((resource) => resource.kind === 'prompt') ?? null;
  const guidance = required.filter((resource) => resource.kind === 'guideline');
  const registeredTypes = new Set(context.execution.artifacts.map((artifact) => artifact.type));
  const templates = (manifest.onDemand ?? [])
    .filter((resource) => resource.kind === 'template')
    .filter((resource) => {
      const type = templateArtifactType(resource.path);
      return !type || !registeredTypes.has(type);
    })
    .map((resource) => materializeResource(context, resource));

  return {
    required,
    stagePrompt,
    guidance,
    templates,
    conditional: manifest.conditional ?? [],
    manifest,
  };
}

function fullCurrentTask(record) {
  if (!record.state.currentTask) return null;
  return record.tasks.find((task) => task.id === record.state.currentTask) ?? null;
}

export function composeAgentContext(context, record) {
  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    contextProtocolVersion: context.protocolVersion,
    initialized: true,
    control: context.control,
    project: context.project,
    toolkit: context.toolkit,
    workflow: context.workflow,
    state: {
      profile: context.project.profile,
      mode: context.project.executionMode,
      stage: context.stage.number,
      stageName: context.stage.name,
      stageStatus: context.stage.status,
      executionKind: context.execution.kind,
      architectureDecision: context.stage.architectureDecision,
      profileTransition: context.profileTransition,
    },
    policy: context.policy,
    task: {
      instruction: context.nextAction,
      artifactTypes: context.execution.primaryArtifactTypes,
      artifacts: context.execution.artifacts,
      current: fullCurrentTask(record),
      ready: context.tasks.ready,
      nextReady: context.tasks.nextReady,
    },
    sources: context.sources,
    stageCheck: context.stageCheck,
    resources: {
      ...agentResourcesForContext(context),
      sourceAdapterPolicy: context.execution.sourceAdapterPolicy,
    },
    nextAction: context.nextAction,
  };
}

export function buildAgentContext(recordPath, record, { cwd }) {
  const context = buildOrchestrationContext(recordPath, record, { cwd });
  return composeAgentContext(context, record);
}

export function buildAgentContextWhenMissing(recordPath, { cwd }) {
  const nextAction = 'Initialize the workflow before auditing, planning, or implementation.';
  const descriptor = { kind: 'prompt', path: 'prompts/00-intake.md', location: null };
  const initializationContext = {
    toolkit: {
      pinned: false, repository: null, revision: null,
      legacy: false, snapshot: null, ambiguous: false,
    },
  };
  const stagePrompt = materializeResource(initializationContext, descriptor);

  return {
    protocolVersion: AGENT_PROTOCOL_VERSION,
    contextProtocolVersion: null,
    initialized: false,
    control: {
      mode: null,
      schemaVersion: null,
      readOnly: false,
      record: relativeDisplay(cwd, recordPath),
    },
    project: null,
    toolkit: initializationContext.toolkit,
    workflow: { valid: true, findings: [] },
    state: {
      profile: null,
      mode: null,
      stage: null,
      stageName: null,
      stageStatus: 'Not initialized',
      executionKind: 'initialization',
      architectureDecision: null,
      profileTransition: null,
    },
    policy: {
      workflowMutation: 'initialize-first',
      implementation: 'forbidden',
      codeEdits: 'forbidden',
      stageDecision: 'not-applicable',
      generatedViews: 'not-initialized',
      workflowReads: 'initialization-only',
    },
    task: {
      instruction: nextAction,
      artifactTypes: [],
      artifacts: [],
      current: null,
      ready: [],
      nextReady: null,
    },
    sources: { active: [], latestOutput: null, latestValidationRuntime: null },
    stageCheck: null,
    resources: {
      required: [stagePrompt],
      stagePrompt,
      guidance: [],
      templates: [],
      conditional: [],
      manifest: { required: [descriptor], onDemand: [], conditional: [] },
      sourceAdapterPolicy: 'Select the matching source adapter after the actual design source is identified.',
    },
    nextAction,
  };
}
