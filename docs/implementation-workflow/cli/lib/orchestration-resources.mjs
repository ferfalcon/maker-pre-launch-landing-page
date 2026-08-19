import { toolkitBindingFromRecord, toolkitPromptSource } from './toolkit-binding.mjs';

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

export function resourceLocation(toolkit, path) {
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
