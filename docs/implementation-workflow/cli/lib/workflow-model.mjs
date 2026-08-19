export const SCHEMA_VERSION = 2;
export const LEGACY_SCHEMA_VERSION = 1;

export const PROFILES = ['Express', 'Lite', 'Standard', 'Full'];
export const PROFILE_RANK = new Map(PROFILES.map((profile, index) => [profile, index]));
export const MODES = ['Gated', 'Continuous documentation', 'Task-by-task'];
export const WORKFLOW_STATUSES = ['Not started', 'In progress', 'Ready', 'Blocked', 'Complete'];
export const ARTIFACT_STATUSES = ['Draft', 'Reviewed', 'Approved', 'Superseded'];
export const TASK_STATUSES = ['Not started', 'Ready', 'In progress', 'Blocked', 'Complete'];
export const SNAPSHOT_ROLES = [
  'Input baseline', 'Supporting source', 'Task start', 'Implementation output',
  'Validation runtime', 'Historical reference',
];
export const PIN_STRENGTHS = ['Immutable', 'Versioned', 'Time-bound', 'Unverified'];
export const SNAPSHOT_STATUSES = ['Active', 'Superseded', 'Invalid', 'Unverified'];
export const VALIDATION_STATUSES = ['Passed', 'Failed', 'Blocked', 'Not executed', 'Not applicable'];
export const VALIDATION_KINDS = [
  'Build', 'Test', 'Accessibility', 'Responsive', 'Visual', 'Security',
  'Performance', 'Manual', 'Other',
];
export const VERIFICATION_RESULTS = [
  'Unchanged', 'Expected workflow output',
  'Unexpected upstream or concurrent change', 'Unavailable',
];
export const GATE_RESULTS = ['Passed', 'Passed with assumptions', 'Blocked', 'Must upgrade'];
export const FINAL_RESULTS = ['accepted', 'accepted-with-deviations', 'requires-corrections'];

export const STAGES = [
  'Establish source baseline and workflow control',
  'Audit pinned design evidence',
  'Define requirements',
  'Document design intent',
  'Define testable behavior',
  'Review documentation consistency',
  'Define or explicitly skip architecture',
  'Create the repository-aware implementation plan',
  'Challenge and approve the plan',
  'Create the implementation task set',
  'Implement and validate tasks',
  'Complete final implementation review',
];

export const ID_PATTERN_SOURCES = {
  snapshot: '^SRC-(DS|REPO|RUN|DOC|ASSET)-[0-9]{3,}$',
  repositorySnapshot: '^SRC-REPO-[0-9]{3,}$',
  task: '^P[0-9]{2}-T[0-9]{2}$',
  artifact: '^ART-[A-Z0-9-]+$',
  verification: '^VER-[0-9]{3,}$',
  gate: '^GATE-[0-9]{3,}$',
  profileTransition: '^PROFILE-[0-9]{3,}$',
  review: '^REVIEW-[0-9]{3,}$',
  domain: '^(EVD|AUD|AC|ADR|PLAN|DOC|PLANREV|IMPL)-[0-9]{3,}$|^REQ-(FR|BR|DR|NFR|AR|SEC|CON)-[0-9]{3,}$|^DES(-RWD|-INT)?-[0-9]{3,}$|^SPEC-(BEH|INT|VAL|ACC|DATA)-[0-9]{3,}$',
  commit: '^[0-9a-f]{40}$',
};

export const ID_PATTERNS = Object.fromEntries(
  Object.entries(ID_PATTERN_SOURCES).map(([name, source]) => [name, new RegExp(source)]),
);

export const ARTIFACT_FILES = {
  'SOURCE-BASELINE': ['SOURCE-BASELINE.md', 'SOURCE-BASELINE.template.md'],
  'PROJECT-CONTEXT': ['PROJECT-CONTEXT.md', 'PROJECT-CONTEXT.template.md'],
  'WORKFLOW-STATE': ['WORKFLOW-STATE.md', 'WORKFLOW-STATE.template.md'],
  'DESIGN-AUDIT': ['DESIGN-AUDIT.md', 'DESIGN-AUDIT.template.md'],
  WORKPACK: ['WORKPACK.md', 'WORKPACK.template.md'],
  'IMPLEMENTATION-BRIEF': ['IMPLEMENTATION-BRIEF.md', 'IMPLEMENTATION-BRIEF.template.md'],
  REQUIREMENTS: ['REQUIREMENTS.md', 'REQUIREMENTS.template.md'],
  DESIGN: ['DESIGN.md', 'DESIGN.template.md'],
  SPEC: ['SPEC.md', 'SPEC.template.md'],
  'DOCUMENT-REVIEW': ['DOCUMENT-REVIEW.md', 'DOCUMENT-REVIEW.template.md'],
  ARCHITECTURE: ['ARCHITECTURE.md', 'ARCHITECTURE.template.md'],
  PLAN: ['PLAN.md', 'PLAN.template.md'],
  'PLAN-REVIEW': ['PLAN-REVIEW.md', 'PLAN-REVIEW.template.md'],
  'TASKS-INDEX': ['TASKS-INDEX.md', 'TASKS-INDEX.template.md'],
  TASK: ['Phase-01--Task-01.md', 'TASK.template.md'],
  'IMPLEMENTATION-REVIEW': ['IMPLEMENTATION-REVIEW.md', 'IMPLEMENTATION-REVIEW.template.md'],
};

export const ARTIFACT_TYPES = Object.keys(ARTIFACT_FILES);

export const PROFILE_STAGE_ARTIFACTS = {
  Express: {
    0: ['WORKPACK'],
  },
  Lite: {
    0: ['SOURCE-BASELINE', 'PROJECT-CONTEXT', 'WORKFLOW-STATE'],
    1: ['DESIGN-AUDIT'],
    2: ['IMPLEMENTATION-BRIEF'],
    11: ['IMPLEMENTATION-REVIEW'],
  },
  Standard: {
    0: ['SOURCE-BASELINE', 'PROJECT-CONTEXT', 'WORKFLOW-STATE'],
    1: ['DESIGN-AUDIT'],
    2: ['REQUIREMENTS'],
    3: ['DESIGN'],
    4: ['SPEC'],
    5: ['DOCUMENT-REVIEW'],
    7: ['PLAN'],
    8: ['PLAN-REVIEW'],
    9: ['TASKS-INDEX'],
    11: ['IMPLEMENTATION-REVIEW'],
  },
  Full: {
    0: ['SOURCE-BASELINE', 'PROJECT-CONTEXT', 'WORKFLOW-STATE'],
    1: ['DESIGN-AUDIT'],
    2: ['REQUIREMENTS'],
    3: ['DESIGN'],
    4: ['SPEC'],
    5: ['DOCUMENT-REVIEW'],
    6: ['ARCHITECTURE'],
    7: ['PLAN'],
    8: ['PLAN-REVIEW'],
    9: ['TASKS-INDEX'],
    11: ['IMPLEMENTATION-REVIEW'],
  },
};

export function artifactTypesForStage(profile, stage, architectureDecision = null) {
  const configured = [...(PROFILE_STAGE_ARTIFACTS[profile]?.[stage] ?? [])];
  if (
    stage === 6
    && profile === 'Standard'
    && architectureDecision?.result === 'Required'
    && !configured.includes('ARCHITECTURE')
  ) configured.push('ARCHITECTURE');
  return configured;
}

export function artifactTypesThroughStage(profile, stage, architectureDecision = null) {
  const result = [];
  for (let candidate = 0; candidate <= stage; candidate += 1) {
    for (const type of artifactTypesForStage(profile, candidate, architectureDecision)) {
      if (!result.includes(type)) result.push(type);
    }
  }
  return result;
}

export const PROFILE_ARTIFACTS = Object.fromEntries(
  PROFILES.map((profile) => [profile, artifactTypesThroughStage(profile, 11, (
    profile === 'Full' ? { result: 'Required' } : null
  ))]),
);

export const ARTIFACT_ALIASES = new Map([
  ['source-baseline', 'SOURCE-BASELINE'], ['source', 'SOURCE-BASELINE'],
  ['project-context', 'PROJECT-CONTEXT'], ['context', 'PROJECT-CONTEXT'],
  ['workflow-state', 'WORKFLOW-STATE'], ['state', 'WORKFLOW-STATE'],
  ['design-audit', 'DESIGN-AUDIT'], ['audit', 'DESIGN-AUDIT'],
  ['workpack', 'WORKPACK'], ['implementation-brief', 'IMPLEMENTATION-BRIEF'],
  ['brief', 'IMPLEMENTATION-BRIEF'], ['requirements', 'REQUIREMENTS'],
  ['design', 'DESIGN'], ['spec', 'SPEC'], ['specification', 'SPEC'],
  ['document-review', 'DOCUMENT-REVIEW'], ['architecture', 'ARCHITECTURE'],
  ['plan', 'PLAN'], ['plan-review', 'PLAN-REVIEW'],
  ['tasks-index', 'TASKS-INDEX'], ['task', 'TASK'],
  ['implementation-review', 'IMPLEMENTATION-REVIEW'], ['review', 'IMPLEMENTATION-REVIEW'],
]);

export const SNAPSHOT_KINDS = {
  design: 'DS', repo: 'REPO', repository: 'REPO', runtime: 'RUN',
  documentation: 'DOC', doc: 'DOC', asset: 'ASSET', assets: 'ASSET',
};

const TRACE_OWNER_TYPES = [
  [/^(EVD|AUD)-/, ['DESIGN-AUDIT', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^REQ-/, ['REQUIREMENTS', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^DES(-RWD|-INT)?-/, ['DESIGN', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^(SPEC-|AC-)/, ['SPEC', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^ADR-/, ['ARCHITECTURE']],
  [/^PLAN-/, ['PLAN', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^DOC-/, ['DOCUMENT-REVIEW', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^PLANREV-/, ['PLAN-REVIEW', 'IMPLEMENTATION-BRIEF', 'WORKPACK']],
  [/^IMPL-/, ['IMPLEMENTATION-REVIEW', 'WORKPACK']],
];

export function allowedTraceOwnerTypes(id) {
  return TRACE_OWNER_TYPES.find(([pattern]) => pattern.test(id))?.[1] ?? [];
}

export function domainKind(id) {
  if (!ID_PATTERNS.domain.test(id)) return null;
  if (id.startsWith('REQ-')) return 'Requirement';
  if (id.startsWith('DES-')) return 'Design';
  if (id.startsWith('SPEC-')) return 'Specification';
  if (id.startsWith('AC-')) return 'Acceptance criterion';
  if (id.startsWith('EVD-')) return 'Evidence';
  if (id.startsWith('AUD-')) return 'Audit finding';
  if (id.startsWith('ADR-')) return 'Architecture decision';
  if (id.startsWith('PLANREV-')) return 'Plan-review finding';
  if (id.startsWith('PLAN-')) return 'Plan item';
  if (id.startsWith('DOC-')) return 'Documentation-review finding';
  if (id.startsWith('IMPL-')) return 'Implementation finding';
  return null;
}

