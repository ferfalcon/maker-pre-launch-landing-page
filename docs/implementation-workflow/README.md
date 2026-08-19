# Design-to-Implementation Workflow

A structured, evidence-driven toolkit for turning a Figma file or another design source into a documented, planned, implemented, and validated web project.

The workflow supports AI-assisted and human-led work with explicit source baselines, proportional documentation, accessibility, responsive behavior, repository-aware planning, small implementation tasks, evidence-backed validation, and machine-checkable workflow control.

## Start here

1. [`QUICKSTART.md`](QUICKSTART.md)
2. [`workflow/Design-Implementation-Workflow.md`](workflow/Design-Implementation-Workflow.md)
3. [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md)
4. [`workflow/Source-Snapshots.md`](workflow/Source-Snapshots.md)
5. [`workflow/Source-Authority.md`](workflow/Source-Authority.md)
6. [`workflow/State-Ownership.md`](workflow/State-Ownership.md)
7. [`workflow/Agent-Orchestration.md`](workflow/Agent-Orchestration.md)
8. [`workflow/Identifier-Conventions.md`](workflow/Identifier-Conventions.md)
9. [`workflow/Validation-Rules.md`](workflow/Validation-Rules.md)
10. [`cli/README.md`](cli/README.md)
11. [`schemas/README.md`](schemas/README.md)
12. [`AGENTS-instructions.md`](AGENTS-instructions.md)

## Workflow overview

### Express path

```text
WORKPACK.md
  ├── control + Express eligibility
  ├── source baseline + scope
  ├── design evidence + findings
  ├── requirements + design intent + specification
  ├── repository-aware approach + one task
  ├── two review passes
  ├── implementation + output lineage
  └── validation + final review
```

Express is for one narrow, coherent implementation result with at most one task and no meaningful architecture, integration, persistence, authentication, migration, security, privacy, deployment, or unresolved product-decision risk.

### Lite, Standard, and Full path

```text
Stage 0 controls + optional workflow-record.json
    ↓
Pinned design-source audit
    ↓
Requirements → Design intent → Specification
    ↓
Documentation consistency gate
    ↓
Architecture, when applicable
    ↓
Implementation plan → Adversarial plan review
    ↓
Tasks → One-task-at-a-time implementation
    ↓
Pinned implementation output + validation runtime
    ↓
Final implementation review
```

Lite consolidates requirements, design intent, specification, and planning into separate sections of `IMPLEMENTATION-BRIEF.md`. Standard and Full use separate artifacts.

## Canonical workflow state

Projects may operate in either:

- **CLI-managed mode:** `.workflow/workflow-record.json` is canonical for mutable control state. The CLI generates status and index views under `.workflow/generated/`.
- **Markdown-only mode:** the normal Markdown artifacts remain the manually maintained control records.

Do not maintain the same mutable field in both modes. In CLI-managed mode, these generated files replace manually synchronized status tables:

```text
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
```

Every CLI mutation refreshes the generated views. Direct record edits require:

```bash
design-workflow sync
```

Freshness can be checked without modifying files:

```bash
design-workflow sync --check
```

See [`workflow/State-Ownership.md`](workflow/State-Ownership.md).

CLI-managed initialization creates only Stage 0 artifacts. Passing and advancing each gate scaffolds the next stage atomically. Existing schema-v1 records remain readable but require `design-workflow migrate` before mutation.

## Repository areas

### `workflow/`

Normative process rules for stages, profiles, execution modes, source snapshots, source authority, state ownership, identifiers, validation, acceptance, and the canonical AI-agent orchestration contract.

### `source-adapters/`

Inspection guidance for Figma, screenshots, PDFs, existing websites, and mixed-source projects. `source-adapters/FIGMA-PREPARATION.md` is the single normative Figma preparation procedure; `AGENTS-PROMPT-Figma-file-preparation.md` is only a thin launcher that delegates to it.

### `guidelines/`

Artifact-writing and review guidance for requirements, design, specification, architecture, and planning.

### `templates/`

Reusable structures for Express workpacks, Stage 0 controls, audits, Lite briefs, requirements, design, specifications, reviews, architecture, plans, tasks, and final implementation validation.

Templates distinguish CLI-managed state from Markdown-only fallback fields so mutable status is not maintained twice.

### `prompts/`

A consolidated Express prompt and one executable prompt per normal workflow stage.

### `cli/`

The dependency-free `design-workflow` CLI initializes Stage 0, records source verification and stage gates, manages artifact and task lifecycle, verifies Git lineage, enforces trace coverage, migrates schema-v1 records, and synchronizes generated views.

### `schemas/`

Machine-readable workflow control definitions. In CLI-managed mode the workflow record is the canonical mutable control source, while Markdown retains product, design, technical, evidence, and decision rationale.

### `examples/`

Non-normative examples organized by Express, Lite, Standard, and Full profiles.

### `scripts/`

Repository integrity, semantic validation, generated-state checks, and CLI integration tests.

Run:

```bash
npm run validate
npm run test:figma-preparation
npm run test:records
npm run test:state
npm run test:render
npm run test:repository
npm run test:package
npm run test:cli
```

## Source snapshots

A URL alone is not a reliable baseline. Figma files, websites, branches, shared documents, and preview environments can change without changing address.

All profiles use stable IDs:

```text
SRC-DS-001      Design source
SRC-REPO-001    Repository state
SRC-RUN-001     Runtime or deployment
SRC-DOC-001     Documentation
SRC-ASSET-001   Asset bundle or file
```

Pin strength:

- `Immutable` — commit SHA, checksum-backed file, immutable deployment ID;
- `Versioned` — named or numbered revision;
- `Time-bound` — inspected at a known time but still mutable;
- `Unverified` — identity or revision could not be confirmed.

Repository snapshots keep portable repository identity and commit pins in canonical state; machine-specific checkout paths belong only to local runtime bindings.

Approved task commits are expected Implementation outputs. Unexpected upstream design, documentation, asset, runtime, or concurrent repository changes require new snapshot IDs and impact assessment.

## Workflow profiles

### Express

For one narrow implementation result with one workpack and at most one task. Use [`templates/WORKPACK.template.md`](templates/WORKPACK.template.md) and [`prompts/00-express-workpack.md`](prompts/00-express-workpack.md).

### Lite

For isolated components, small static pages, and narrow changes that exceed Express limits but do not carry meaningful architecture or integration risk.

### Standard

For multi-page sites, substantial UI features, or meaningful repository integration. Architecture remains conditional.

### Full

For full-stack applications, authentication, persistence, complex integrations, multiple services, migrations, or high security, privacy, deployment, or operational risk.

## Execution modes

- `Gated` — stop after each stage or consolidated checkpoint until explicitly advanced.
- `Continuous documentation` — continue through documentation and task decomposition while unblocked, then stop before implementation.
- `Task-by-task` — implement one unblocked task at a time after planning approval. Express has exactly one task.

## Ownership summary

| Owner | Responsibility |
|---|---|
| Workflow record | Mutable profile, mode, stage, architecture decision, snapshots and verifications, artifact lifecycle, gates, trace definitions, tasks and structured validation, profile upgrades, final reviews, and output lineage |
| Generated views | Deterministic human-readable projections of record-owned state and trace coverage; never edited manually |
| `WORKPACK.md` | Express scope, evidence, rationale, expected behavior, plan, task detail, decisions, and final review |
| `SOURCE-BASELINE.md` | Detailed source scope, evidence, reproduction, authority, limitations, and rebaseline impact |
| `WORKFLOW-STATE.md` | Blockers, assumptions, decisions, exceptions, and narrative history not represented by the record |
| `TASKS-INDEX.md` | Phase rationale, coverage, coordination, blockers, and cross-cutting concerns |
| Requirements, design, specification, architecture, and plan artifacts | Their normal product, design, behavioral, structural, and implementation responsibilities |

## Repository structure

```text
.
├── README.md
├── QUICKSTART.md
├── package.json
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
├── AGENTS-instructions.md
├── AGENTS-PROMPT-Figma-file-preparation.md
├── workflow/
├── source-adapters/
├── guidelines/
├── templates/
├── prompts/
├── schemas/
├── cli/
├── examples/
├── scripts/
├── tests/
└── .github/workflows/
```

## Integrated quality

Accessibility, responsiveness, states, errors, and tests must be implemented with the behavior they affect. A final phase may verify them but must not introduce them for the first time.

Select breakpoints from pinned design evidence, actual layout failure, and repository conventions—not a familiar device number by default.

Identify interaction patterns before prescribing focus behavior. Disclosures, menus, drawers, and modal dialogs do not share identical keyboard rules.

## Two-pass reviews

1. Completeness and correctness.
2. Consistency, traceability, source and output-lineage integrity, risks, and uncertainty after first-pass corrections.

Both reviews are required in every profile. Express records them inside `WORKPACK.md`.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Structural changes must pass the repository validator.

## License

Licensed under the MIT License. See [`LICENSE`](LICENSE).
