# Workflow State Ownership

This document prevents executable state from being maintained independently in several files.

The workflow has two control modes:

- **CLI-managed:** `.workflow/workflow-record.json` is canonical. Files under `.workflow/generated/` are read-only projections of canonical state and routing.
- **Markdown-only:** no workflow record exists. Rendered fallback registries in the narrative artifacts are maintained manually. This mode is scaffolded but not executable.

Never mix ownership modes for the same field.

## Canonical ownership in CLI-managed mode

| Information | Canonical owner | Human/agent-readable projection |
|---|---|---|
| Profile and execution mode | `workflow-record.json` | `generated/WORKFLOW-STATUS.md` |
| Stage, workflow status, current task, latest output, and latest validation runtime | `workflow-record.json` | `generated/WORKFLOW-STATUS.md` |
| Current architecture decision | `workflow-record.json` | `generated/WORKFLOW-STATUS.md` |
| Portable agent routing, current target/task, next action, and workflow resource descriptors | Derived from `workflow-record.json` through canonical orchestration routing | `generated/AGENT-CONTEXT.json` |
| Snapshot registry and output lineage | `workflow-record.json` | `generated/SOURCE-INDEX.md` |
| Append-only source verification history | `workflow-record.json` | `generated/SOURCE-INDEX.md` |
| Artifact ID, type, narrative path, lifecycle state, baseline, and replacement | `workflow-record.json` | `generated/ARTIFACT-INDEX.md` |
| Stage-decision history and approval actors | `workflow-record.json` | `generated/WORKFLOW-STATUS.md` |
| Task state, blockers, dependencies, structured checks, and outputs | `workflow-record.json` | `generated/TASK-INDEX.md` |
| Canonical domain definitions, owners, required classification, and upstream graph | `workflow-record.json` | `generated/TRACEABILITY.md` |
| Downstream plan, task, and validation coverage | Derived from the record | `generated/TRACEABILITY.md` |
| Profile-upgrade and final-result history | `workflow-record.json` | Status and artifact projections |
| Detailed source scope, reproduction, authority, and limitations | `SOURCE-BASELINE.md`, `WORKPACK.md`, or the relevant narrative artifact | Not generated |
| Product, design, behavioral, architecture, and implementation rationale | Matching narrative artifact | Not generated |
| Human-readable blockers, assumptions, exceptions, and decision rationale beyond structured fields | `WORKFLOW-STATE.md` or `WORKPACK.md` | Not generated |
| Task objective, implementation steps, discoveries, risks, and completion narrative | Task file or `WORKPACK.md` | Not generated |

Generated files are never decision owners. `AGENT-CONTEXT.json` is a routing projection, not a second workflow record or a substitute for CLI-owned mutation, preflight, local Git checks, subject-integrity checks, or runtime validation.

## Generated views

The CLI renders:

```text
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
.workflow/generated/AGENT-CONTEXT.json
```

Every projection identifies the canonical workflow-record SHA-256 used to generate it. The Markdown views also include generated-file warnings and source-record metadata in comments; `AGENT-CONTEXT.json` carries equivalent metadata in its `generated` object. Object-key ordering does not affect the digest; meaningful array ordering does.

`AGENT-CONTEXT.json` exists so agents with repository read access but no executable CLI can resolve current routing without parsing the record or generated Markdown. It contains only portable persisted-state routing and resource descriptors. It intentionally excludes embedded toolkit resource bodies and local/runtime integrity results.

## Mutation contract

Every executable record mutation uses the same transaction boundary:

1. read and validate the current record;
2. clone it and apply the proposal in memory;
3. render the candidate record, all generated views, and new narrative files in memory;
4. validate the complete candidate;
5. write sibling temporary files, then replace each target with a same-filesystem rename;
6. restore original bytes and remove temporary files after any handled write failure.

Validation failure happens before target replacement. A rejected operation must leave the record, generated views, and narrative files byte-identical.

The multi-file write set is rollback-capable for handled I/O failures, but it is not a filesystem-wide atomic commit. An abrupt process or machine failure can interrupt the rename sequence. After abnormal termination, run `design-workflow validate` and `design-workflow sync --check` before continuing; repair stale projections if required.

Record mutations use an exclusive sibling lock. A parseable same-host lock whose recorded PID is demonstrably no longer running is recovered automatically. Active locks, malformed locks, locks from another host, and locks whose process state cannot be established safely remain blockers and require inspection rather than automatic deletion.

The current record must be clean before advancement, task execution, or acceptance. A command specifically intended to repair state may commit only when the resulting finding set is strictly smaller and contains no new finding.

## Git working-tree and commit roles

CLI-managed task execution distinguishes **workflow-control files**, **workflow-managed files**, and **implementation scope**.

Workflow-control files are the canonical record and its generated projections:

```text
.workflow/workflow-record.json
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
.workflow/generated/AGENT-CONTEXT.json
```

Workflow-managed files are the workflow-control set plus every **active** narrative artifact path registered in `workflow-record.json`, such as `WORKPACK.md`, `REQUIREMENTS.md`, `DESIGN.md`, `SPEC.md`, `PLAN.md`, `TASKS-INDEX.md`, and task files. Superseded artifact paths are no longer automatically exempt. No unrelated file or directory is implicitly exempt, including other files under `.workflow/`.

Task Git boundaries are enforced as follows:

- before `task start`, every dirty path outside the **workflow-control** set blocks execution; approved planning and task narratives must already be committed;
- canonical record/generated control files may remain dirty before task start because stage and lifecycle commands update them without changing the approved narrative subject;
- committed history between the planned baseline and task start is accepted only when every touched path is workflow-managed; when needed, the CLI records a new immutable Task-start checkpoint at the actual `HEAD`;
- before `task complete`, every dirty path outside the broader **workflow-managed** set blocks completion, including staged, unstaged, and untracked implementation-scope files;
- the commit recorded as the task's Implementation output must not itself modify workflow-managed files;
- `task complete` verifies the output first, then updates workflow-control state, so those files are expected to remain or become dirty after successful completion.

This creates two distinct commit roles:

- **Implementation-output commit:** code, tests, assets, configuration, or other task deliverables. This is the commit pinned by the Implementation output snapshot and must not modify workflow-managed files.
- **Workflow/documentation commit:** canonical control state, generated projections, and narrative workflow artifacts. This records workflow bookkeeping and documentation and is never the task's Implementation output.

Recommended sequence:

1. commit approved planning/task narratives before task start; only canonical workflow-control files may remain dirty;
2. run `design-workflow task start <task-id>` so the CLI verifies or checkpoints the exact repository `HEAD`;
3. implement the task and stage only implementation-scope paths;
4. commit the implementation work without workflow-managed files;
5. run `design-workflow task complete <task-id> --commit <implementation-head> ...`;
6. before a following task, commit any narrative changes that must persist; workflow-control files may remain dirty;
7. run the next `task start`; if intervening committed history contains only workflow-managed paths, the CLI records the exact Task-start checkpoint automatically;
8. commit accumulated workflow-control state at a suitable documentation boundary without mixing it into an Implementation-output commit.

Do not use a broad `git add .` for an implementation-output commit when workflow-managed files are dirty. Stage task deliverables explicitly or otherwise exclude those paths. Any intervening commit that touches implementation-scope paths is not treated as workflow bookkeeping and requires impact assessment before the next task can start.

## Narrative-file rules

Templates contain explicit artifact and control-mode markers. Rendering extracts only the artifact body, converts fenced example YAML into real frontmatter, substitutes project values, and removes record-owned sections in CLI-managed mode.

When CLI-managed mode is active:

- `WORKFLOW-STATE.md` contains narrative blockers, assumptions, exceptions, and decision history without copying current stage, profile, task, output, or registries.
- `SOURCE-BASELINE.md` contains source scope, evidence, reproduction, authority, limitations, and rebaseline impact without copying the mutable snapshot registry.
- `TASKS-INDEX.md` contains phase rationale, coverage, coordination, and cross-cutting concerns without copying mutable task status or output tables.
- task artifacts contain objectives, scope, implementation detail, acceptance criteria, risks, and discoveries without copying record-owned validation result or output-lineage state.
- any narrative may cite canonical IDs but must not redefine their current record-owned fields.

The CLI never overwrites an existing unregistered narrative. If a stage destination exists, use `artifact adopt` before advancement.

Markdown-only rendering includes the complete fallback registries. No record, generated views, parser, or lifecycle enforcement is introduced.

## Lifecycle history

- Verification, gate, and implementation-review events are append-only.
- A new active stage decision supersedes the previous active decision without deleting it.
- Rewind supersedes active gates at and after the target while preserving artifact baselines.
- Snapshot supersession records replacement but never rewrites narrative baselines.
- Artifact supersession records a replacement; reopening preserves history and returns the artifact to Draft.
- Profile upgrades are two-phase and downgrade is unsupported.
- Task blocking stores the previous status so unblocking restores it.
- Final completion is set only by an accepted final-review event.

## Schema-v1 boundary

Schema-v1 records remain readable but are mutation-locked. Explicit migration assigns the v2 collections and records the existing stage as `legacyBoundary`. Historical gates are not fabricated. Inferred trace definitions remain visible and optional until classified.

```bash
design-workflow migrate --check
design-workflow migrate
```

## Synchronization commands

Normal mutations synchronize every projection automatically, including `AGENT-CONTEXT.json`.

Direct edits to `.workflow/workflow-record.json` are unsupported in CLI-managed projects. `design-workflow sync` is not a record-mutation path and does not authorize, validate, or normalize manual canonical-state changes. It only reconciles generated projections with the current canonical record.

Use synchronization as a recovery path when generated views are stale or missing after an interrupted write or another abnormal condition. Run the non-writing checks first:

```bash
design-workflow validate
design-workflow sync --check
```

If the findings are limited to missing or stale projections, repair them and revalidate:

```bash
design-workflow sync
design-workflow validate
design-workflow sync --check
```

If the canonical record itself has findings, use the supported CLI repair or migration path before synchronization; do not hand-edit the record. A stale or missing view is a validation failure, never an alternative source of truth. A GitHub-only agent must not regenerate a stale projection by hand.

Commit the canonical record and generated views together whenever a supported CLI mutation changes them. Projection-only recovery may update generated views without changing the canonical record.

## Review checklist

- [ ] The workflow uses exactly one control mode.
- [ ] Every executable field has one canonical owner.
- [ ] CLI-managed canonical state is mutated only through supported `design-workflow` commands.
- [ ] The record is schema v2 before mutation.
- [ ] Generated views, including `AGENT-CONTEXT.json`, match the current record digest.
- [ ] No generated file contains manual decisions or rationale.
- [ ] The agent projection is used only for portable read-side routing, not CLI mutation or runtime-integrity claims.
- [ ] CLI-managed artifacts omit record-owned status, registries, validation results, and output lineage.
- [ ] Markdown-only artifacts retain complete fallback registries.
- [ ] Snapshot, artifact, gate, task, profile, and final-review history is preserved rather than rewritten.
- [ ] Trace definitions have active compatible owners and required coverage.
- [ ] Task start has no dirty narrative or implementation-scope paths; only workflow-control files may remain dirty.
- [ ] Task completion has no dirty implementation-scope paths.
- [ ] The recorded Implementation output commit excludes workflow-managed files.
- [ ] Workflow/documentation changes are kept distinct from implementation-output commits.
- [ ] Sequential tasks checkpoint workflow-only intervening history and reject unexplained implementation history.
- [ ] CI detects schema drift, stale generated views, broken packaged links, invalid records, and package/runtime provenance regressions.
