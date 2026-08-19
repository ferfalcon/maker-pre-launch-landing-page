# Executable Workflow Records

CLI-managed projects use `.workflow/workflow-record.json` as the canonical mutable control record. Markdown-only projects have no executable record and maintain the complete fallback registries rendered into their Stage 0 artifacts.

See [`../workflow/State-Ownership.md`](../workflow/State-Ownership.md) for ownership rules.

## Schema versions

- [`workflow-record.schema.json`](workflow-record.schema.json) is generated schema v2.
- [`workflow-record.v1.schema.json`](workflow-record.v1.schema.json) preserves the readable legacy shape.

The v2 schema is generated from the shared model in [`../cli/lib/workflow-model.mjs`](../cli/lib/workflow-model.mjs). CI checks freshness before other validation:

```bash
node scripts/generate-workflow-schema.mjs --check
```

Schema-v1 records may be inspected, validated, and synchronized, but mutations are rejected until explicit migration:

```bash
design-workflow migrate --check
design-workflow migrate
```

Migration is atomic and idempotent. It records the current stage as `legacyBoundary`, infers trace owners, leaves migrated trace definitions optional, and never fabricates execution timestamps.

## Schema-v2 collections

The root object is strict: all required keys must exist and unknown properties are rejected.

| Collection | Responsibility |
|---|---|
| `project` | Project name, selected profile, and execution mode |
| `state` | Current stage/status, active inputs, current task, latest output/runtime, and current architecture decision |
| `snapshots` | Source and output identities, roles, pin strength, status, references, and Git lineage |
| `verifications` | Append-only `VER-*` observations of source availability or change |
| `artifacts` | Narrative registration, type, path, lifecycle state, baseline, and replacement |
| `traceItems` | Canonical domain definitions, owner, required classification, upstream references, and replacement |
| `gates` | Append-only `GATE-*` stage decisions, evidence, baselines, verification IDs, artifacts, time, and approver |
| `tasks` | Task lifecycle, repository baseline, dependencies, trace references, blocker restoration, output, and structured validation |
| `profileTransitions` | Two-phase `PROFILE-*` upgrade history |
| `implementationReviews` | Append-only `REVIEW-*` final-result history |
| `legacyBoundary` | Optional v1-migration boundary for future gate and required-trace enforcement |

## Canonical identifiers

Concrete domain IDs are strict:

```text
REQ-(FR|BR|DR|NFR|AR|SEC|CON)-###
DES-###
DES-(RWD|INT)-###
SPEC-(BEH|INT|VAL|ACC|DATA)-###
EVD-###  AUD-###  AC-###  ADR-###
PLAN-### DOC-### PLANREV-### IMPL-###
```

Control namespaces include `SRC-*`, `ART-*`, `P##-T##`, `VER-*`, `GATE-*`, `PROFILE-*`, and `REVIEW-*`. Duplicate IDs, duplicate array values, unresolved references, incompatible owners, and graph cycles are semantic errors.

## Canonical execution invariants

Schema v2 treats task and repository lineage as reciprocal executable state rather than loose references.

- A **Task start** snapshot must be an Immutable `SRC-REPO-*` snapshot with a commit SHA, repository parent, and task attribution. That task must use the snapshot as its baseline.
- An **Implementation output** must be an Immutable repository snapshot with a commit SHA, repository parent, and producing task. The producing task must reference it as `output`.
- An executable task baseline must be an Immutable repository snapshot with a commit SHA and role `Input baseline`, `Task start`, or `Implementation output`. Incomplete tasks require an Active baseline; completed tasks may retain historical superseded baselines.
- `state.currentTask` is reciprocal with task status: the current task must be `In progress`, an `In progress` task requires `state.currentTask`, and more than one `In progress` task is invalid.
- `state.latestOutput` must reference an Active Implementation output whose producing task is Complete and points back to that output.
- `state.latestValidationRuntime`, when present, must reference an Active Validation runtime parented to the latest Implementation output. A final review runtime must likewise parent the exact reviewed output.

These are semantic-validator rules in addition to the generated JSON Schema shape. Schema-v1 compatibility remains unchanged until explicit migration.

## Structured validation

Each task check uses:

```text
name, kind, required, status, expected, actual,
command, environment, executedAt, evidence[], reason, references[]
```

`name`, `kind`, `required`, `status`, `expected`, `evidence`, and `references` are always present. A Passed check requires a non-empty actual result, ISO-8601 execution time, and evidence. Every non-passing state requires a reason. A required check cannot be `Not applicable`.

Completion also requires the CLI to verify the supplied output commit against the real repository: it must exist, equal `HEAD`, and descend from the task baseline commit.

Before task start, checkpoint inspection is history-aware: every commit between the effective repository anchor and `HEAD` is inspected. A task-start checkpoint is allowed only when all touched paths are workflow-managed. Any intervening implementation-scope touch requires impact assessment even when a later commit reverts it and the endpoint tree is clean.

## Gates and completion

Stage decisions are append-only. A new review supersedes the previous active decision for that stage. Rewind supersedes active gates at and after the target without deleting history or rewriting artifact baselines.

The validator enforces:

- a passing active decision for every crossed post-boundary stage;
- profile-aware artifact and approval exits;
- explicit architecture handling;
- execution-mode restrictions;
- reciprocal current-task and repository-lineage invariants;
- Ready task and required-trace coverage at the Stage 9 exit;
- completed tasks, resolved required validation, output lineage, and latest output at the Stage 10 exit;
- output re-verification, an approved review artifact, an active passing Stage 11 gate, accepted final-review history, runtime/output lineage when applicable, and validation coverage for final completion.

`state.status: Complete` is valid only at Stage 11 with an active passing Stage 11 gate and an active `accepted` or `accepted-with-deviations` review event. `requires-corrections` leaves the state Blocked.

## Generated views

The record renders deterministic files beside itself:

```text
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
```

Each contains a canonical SHA-256 record digest. `TRACEABILITY.md` shows every domain ID, kind, owner, classification, upstream references, downstream plans/tasks/checks, and graph or coverage findings.

```bash
design-workflow sync
design-workflow sync --check
design-workflow validate
```

Generated files are disposable projections and must never be edited manually.

## Transaction contract

Every executable record mutation uses one store:

1. read and validate the current record;
2. clone it and apply the proposed mutation in memory;
3. render the candidate record, generated views, and new artifact files in memory;
4. validate the complete candidate and registered narrative paths;
5. write sibling temporary files and rename the full file set;
6. roll back committed targets and remove temporary files if any write fails.

Validation failure happens before target writes. Existing unregistered narrative files stop scaffolding and must be explicitly adopted.

## Validation commands

Run the complete local and CI contract:

```bash
npm run validate
```

Focused commands are:

```bash
npm run test:records
npm run test:invariants
npm run test:state
npm run test:render
npm run test:cli
npm run test:package
```

Golden migration fixtures live in [`../tests/fixtures/workflow-record.migration.v1.json`](../tests/fixtures/workflow-record.migration.v1.json) and [`../tests/fixtures/workflow-record.migration.v2.json`](../tests/fixtures/workflow-record.migration.v2.json).
