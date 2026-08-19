# Workflow Profiles

Workflow profiles keep the process proportional to project risk and complexity without removing essential design, accessibility, source integrity, implementation, or validation concerns.

Select a profile before substantive documentation or implementation begins. When `.workflow/workflow-record.json` exists, it is canonical for the current profile, execution mode, stage, and other mutable control fields. Narrative artifacts retain profile rationale, eligibility evidence, decisions, and change history.

Follow [`State-Ownership.md`](State-Ownership.md). Do not maintain the same mutable state independently in the record and Markdown artifacts.

A profile controls artifact granularity. It does not permit unsupported assumptions, unpinned material sources, skipped validation, or implementation without evidence.

## Selection principles

Choose a profile from actual complexity, not only file count or visual size.

Consider:

- number and complexity of user flows;
- number of independent implementation results;
- routes, screens, and reusable patterns;
- persistence, APIs, and third-party integrations;
- authentication or authorization;
- shared state and data-flow complexity;
- architectural migration or compatibility work;
- deployment, security, privacy, or operational risk;
- number of contributors or implementation agents;
- cost of incorrect assumptions.

When uncertain, select the lower profile only when its consolidation rules can preserve every material concern. Upgrade as soon as the work exceeds those limits.

## Shared required controls

Every profile requires:

- pinned or honestly time-bound source records;
- stable project scope and quality expectations;
- active workflow state, blockers, and next action;
- source verification before material work;
- implementation-output lineage;
- evidence-backed final validation.

Express owns narrative controls inside `WORKPACK.md`. Lite, Standard, and Full use `SOURCE-BASELINE.md`, `PROJECT-CONTEXT.md`, and `WORKFLOW-STATE.md`.

In CLI-managed mode, the workflow record owns mutable control, source-registry, artifact-registry, and task-registry fields. Generated views under `.workflow/generated/` replace copied operational tables. The Markdown artifacts keep evidence, rationale, blockers, assumptions, decisions, coverage, and history.

Every downstream artifact or consolidated section must reference the snapshot IDs it actually used.

## Express profile

Use for one narrow, coherent implementation result that can be represented, implemented, and validated in one workpack.

Typical examples:

- correct one existing component;
- consolidate one repeated UI pattern;
- implement one isolated static component;
- make one bounded responsive or accessibility correction;
- perform one narrowly scoped design-source normalization change.

### Eligibility conditions

All conditions must be true:

- one clearly bounded design-source scope or source bundle;
- one coherent implementation result;
- at most one implementation task;
- no persistence, authentication, authorization, or external API work;
- no meaningful routing, shared-state, migration, deployment, security, privacy, or rollback decision;
- no unresolved product decision that materially changes expected behavior;
- no multi-contributor coordination requiring separate task ownership;
- the result can be independently validated without reconstructing a broader feature.

### Required artifact

- `WORKPACK.md`

Use [`../templates/WORKPACK.template.md`](../templates/WORKPACK.template.md) and [`../prompts/00-express-workpack.md`](../prompts/00-express-workpack.md).

`WORKPACK.md` owns, in clearly separated sections:

- profile eligibility rationale and narrative control information;
- source scope, authority, evidence, verification, and limitations;
- scope and constraints;
- design evidence and audit findings;
- requirements, design intent, specification, and acceptance criteria;
- repository-aware implementation approach;
- one implementation task's detailed objective and steps;
- two review passes;
- implementation discoveries and deviations;
- validation evidence and final implementation review.

Use the normal identifier namespaces inside the workpack. Consolidation does not merge the responsibilities of requirements, design intent, specification, planning, task execution, and validation.

Do not create separate `SOURCE-BASELINE.md`, `PROJECT-CONTEXT.md`, `WORKFLOW-STATE.md`, `DESIGN-AUDIT.md`, `IMPLEMENTATION-BRIEF.md`, requirements, design, specification, plan, task, or implementation-review artifacts while the work remains Express-eligible.

A machine-readable workflow record may accompany the workpack. When present, it is canonical for mutable profile, mode, stage, snapshot registry, artifact registry, task state, validation state, and output lineage. It is not a second normative product or design artifact.

### Upgrade triggers

Stop affected work and upgrade when inspection or implementation introduces:

- a second independent implementation result or task;
- connected routes, screens, or flows;
- shared state or cross-feature integration;
- persistence, authentication, authorization, or external APIs;
- architectural migration;
- meaningful deployment, security, privacy, reliability, or rollback risk;
- a material source conflict or unresolved product decision;
- enough uncertainty that one workpack cannot preserve clear ownership and review.

Upgrade to Lite for a still-small change that benefits from separate control, audit, task, and final-review artifacts. Upgrade to Standard or Full when the corresponding complexity or risk exists.

When upgrading, preserve stable IDs and source records. Split the workpack sections into their owning artifacts rather than rewriting confirmed content from scratch.

## Lite profile

Use for an isolated component, small static page, or narrow change that exceeds Express limits but has no meaningful architecture, persistence, authentication, or complex integration decisions.

Lite is appropriate when the work needs separate source control, audit, task tracking, or final review; contains more than one tightly related task; or carries enough uncertainty that one workpack would become difficult to maintain.

### Required artifacts

- `SOURCE-BASELINE.md`
- `PROJECT-CONTEXT.md`
- `WORKFLOW-STATE.md`
- `DESIGN-AUDIT.md`
- `IMPLEMENTATION-BRIEF.md`
- one task file, or `TASKS-INDEX.md` plus task files when more than one task is needed
- `IMPLEMENTATION-REVIEW.md`

### Consolidation rules

`IMPLEMENTATION-BRIEF.md` may consolidate the responsibilities of `REQUIREMENTS.md`, `DESIGN.md`, `SPEC.md`, and `PLAN.md`, but it must keep those concerns in clearly separated sections and use their normal identifier namespaces.

The brief must include:

- baseline snapshot references;
- product outcomes and constraints;
- visual, responsive, content, and interaction intent;
- precise, testable behavior and acceptance criteria;
- repository-aware implementation approach;
- integrated accessibility, responsive, state, error, and validation work;
- two distinct review passes.

A separate `DOCUMENT-REVIEW.md`, `ARCHITECTURE.md`, or `PLAN-REVIEW.md` is not required unless findings justify upgrading the profile.

### Upgrade triggers

Upgrade to Standard or Full when the work introduces:

- multiple connected flows or routes;
- significant shared state;
- persistence, authentication, authorization, or external APIs;
- architectural migration;
- non-trivial deployment, security, privacy, or rollback concerns;
- enough uncertainty that consolidated ownership becomes unclear.

## Standard profile

Use for multi-page sites, substantial UI features, existing application features, or work with meaningful repository integration but limited system-wide architectural risk.

### Required artifacts

- `SOURCE-BASELINE.md`
- `PROJECT-CONTEXT.md`
- `WORKFLOW-STATE.md`
- `DESIGN-AUDIT.md`
- `REQUIREMENTS.md`
- `DESIGN.md`
- `SPEC.md`
- `DOCUMENT-REVIEW.md`
- `PLAN.md`
- `PLAN-REVIEW.md`
- `TASKS-INDEX.md` and task files
- `IMPLEMENTATION-REVIEW.md`

`ARCHITECTURE.md` remains conditional. When skipped, follow the architecture-skip rules in [`Design-Implementation-Workflow.md`](Design-Implementation-Workflow.md).

## Full profile

Use for full-stack applications, authentication, persistence, multiple services or packages, complex integrations, significant migrations, or high deployment, security, privacy, or reliability risk.

Use the complete Standard artifact set plus `ARCHITECTURE.md` and any architecture decision records required for independently reviewable structural decisions.

Full-profile work should explicitly cover, when applicable:

- runtime and trust boundaries;
- state and data ownership;
- APIs, persistence, and migrations;
- authentication and authorization;
- security and privacy controls;
- build, deployment, rollback, and recovery;
- reliability, observability, and testing architecture.

## Profile comparison

| Concern | Express | Lite | Standard | Full |
|---|---|---|---|---|
| Normative Markdown artifacts | One `WORKPACK.md` | Separate controls, audit, brief, task, and final review | Separate core artifacts | Complete artifact set |
| Source baseline, context, and state | Consolidated narrative in workpack | Required separately | Required separately | Required separately |
| Mutable operational state in CLI-managed mode | Workflow record + generated views | Workflow record + generated views | Workflow record + generated views | Workflow record + generated views |
| Design audit | Workpack section | Required | Required | Required |
| Requirements, design, and specification | Separate workpack sections | Consolidated in brief | Separate artifacts | Separate artifacts |
| Documentation consistency gate | Two workpack reviews | In brief | Separate artifact | Separate artifact |
| Separate architecture | Not allowed; upgrade instead | No, unless upgraded | Conditional | Normally required |
| Plan and adversarial review | Workpack sections | Consolidated | Separate artifacts | Separate artifacts |
| Task decomposition | Exactly one task in workpack | Proportional | Required | Required |
| Final implementation review | Workpack section | Required separately | Required separately | Required separately |

## Execution modes

In CLI-managed mode, record the current execution mode in the workflow record. In Markdown-only mode, record it in `WORKPACK.md` for Express or `WORKFLOW-STATE.md` for other profiles.

### Gated

- Stop after every stage or consolidated checkpoint.
- Advance only after an explicit user request or approval.
- Use when decisions require close review or the scope is still changing.

For Express, reasonable checkpoints are source and evidence capture, expected result and plan readiness, implementation, and final validation.

### Continuous documentation

- Continue through permitted documentation, review, planning, and task-decomposition work while no blocker exists.
- Stop before implementation.
- Do not treat silence as approval for unresolved product, design, architectural, or source-baseline decisions.

For Express, complete the workpack through implementation readiness and stop before editing code.

### Task-by-task

- Use only after documentation and planning gates pass.
- Implement one unblocked task at a time.
- Verify relevant snapshots before implementation when a source may have changed.
- Run validation and update workflow state before selecting the next task.
- Do not silently combine unrelated tasks.

Express has exactly one task. Discovery of a second independent task requires a profile upgrade.

## Changing profiles, modes, or baselines

A profile or execution mode may change when new evidence changes project complexity or risk. A source baseline changes through the rebaseline protocol in [`Source-Snapshots.md`](Source-Snapshots.md).

When Express upgrades:

1. record the trigger and target profile in `WORKPACK.md`;
2. preserve source IDs, evidence IDs, domain IDs, task IDs, decisions, and history;
3. update the workflow record and generated views when CLI-managed mode is active;
4. create the target profile's required narrative artifacts;
5. move or copy each workpack section into its owning artifact without changing meaning;
6. mark the workpack as Superseded after the new artifact set is internally consistent;
7. resume at the earliest affected stage.

When Lite, Standard, or Full changes profile or mode:

1. update `PROJECT-CONTEXT.md` when the profile decision changes materially;
2. update the workflow record and run `design-workflow sync` in CLI-managed mode, or update `WORKFLOW-STATE.md` in Markdown-only mode;
3. record the reason and effective stage in the narrative history;
4. create any newly required artifacts before advancing;
5. do not discard stable IDs or approved decisions.

When a source changes, create new `SRC-*` IDs and assess affected artifacts rather than silently replacing the existing baseline.
