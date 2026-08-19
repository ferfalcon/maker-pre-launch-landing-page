# Changelog

All notable changes to this workflow toolkit are documented here.

The format follows Keep a Changelog principles. Version numbers describe toolkit evolution, not project artifacts created with the workflow.

## [Unreleased]

### Added

- GitHub Issue command transport plus a pinned reusable Actions executor for connector-first preflight and canonical CLI-owned workflow mutations against exact expected heads and pinned toolkit revisions.
- Remote-execution regression coverage for requester permissions, command allowlisting, stale heads, rollback, runtime resolution, read-only preflight, shell/path injection boundaries, filesystem containment, and non-force mutation.
- Repository validation that rejects mutable external-action refs inside write-capable GitHub Actions workflows, protecting the privileged remote executor with immutable dependency pins.
- Workflow-validation architecture regression coverage that keeps the public validator facade small, domain boundaries explicit, and validation-module dependencies acyclic.
- Portable `.workflow/generated/AGENT-CONTEXT.json` routing projection for agents that can read implementation repositories through GitHub but cannot execute the workflow CLI.
- Focused portable-agent projection regression coverage for record integrity, stage/task routing, exact pinned toolkit resources, read-only mutation boundaries, and invalid-record repair routing.
- Entrypoint-authority regression coverage that keeps root human, agent, ChatGPT-host, contributor, and Figma launchers role-specific and prevents the README from becoming a second workflow handbook.
- Canonical workspace resolution for explicit `--record` paths, including project-root inference, outside-project invocation coverage, and local repository bindings that remain attached to the resolved workflow project.
- Packed-install provenance regression coverage that installs the toolkit tarball inside an unrelated Git repository and verifies the executing toolkit never inherits consumer repository identity.
- Release-metadata validation that keeps `LICENSE`, `package.json`, `package-lock.json`, and README licensing consistent.
- Command-ownership regression coverage that keeps core lifecycle execution in one engine and prevents `workflow-cli.mjs` from reintroducing shadow implementations.
- Conservative stale-lock recovery for parseable same-host workflow locks whose recorded process is demonstrably no longer running.
- Git working-tree policy tests covering strict task-start reproducibility, task-completion leftovers, workflow-managed narrative dirtiness, and mixed implementation/workflow commits.
- Task-start checkpoint regression coverage for committed planning state, workflow-control commits between tasks, rejection of unexpected committed implementation changes, and implementation changes that are later reverted before task start.
- Canonical schema-v2 invariant regression coverage for exact Task-start shape, current-task reciprocity, executable repository baselines, reciprocal output lineage, and latest output/runtime pointers.
- Replanning-transition regression coverage for Stage 10 rewind, stale-validation invalidation, task restart with historical checkpoint preservation, and profile-upgrade recovery.
- Sequential task-lineage regression coverage proving that a completed task output becomes the next task's effective repository baseline and that unrecognized repository changes block task start without mutation.
- Repository validation that requires the `package.json` version to have a dated changelog release entry and keeps the canonical agent-orchestration contract discoverable.
- Exclusive workflow-record mutation locks plus optimistic record-version checks that reject concurrent or stale writers before any transactional file changes.
- Dedicated concurrency regression coverage for stale prepared mutations, lock contention, byte-identical rejection, and lock cleanup after validation failures.
- Portable repository snapshot bindings with `design-workflow repository bind <snapshot-id> --path <checkout>` and a Git-ignored `.workflow/local.json` runtime mapping.
- Repository-portability regression tests covering canonical remote normalization, `project://` references, moved checkouts, local bindings, legacy absolute-path healing, identity mismatches, containment, and rejection of new non-portable snapshots.

### Changed

- GitHub remote read-only execution now accepts exit code `1` only for `stage check --json`; `validate` and `sync --check` require exit code `0` so failed checks cannot be reported as successful commands.
- The write-capable remote executor now pins external GitHub Actions dependencies to full commit SHAs while retaining human-readable release versions in comments.
- Workflow-record validation is decomposed into reusable primitives, domain validators, shared rules, and final cross-record invariants while preserving the public validation API and validation order.
- CLI lifecycle implementation is split into domain command modules while `commands-v2.mjs` remains the compatibility export surface and high-level router.
- Quickstart onboarding now requires selecting Express, Lite, Standard, or Full before initialization and treats Express as a worked example rather than the default general entry path.
- Stage-transition policy now separates substantive decision authority from preflight availability and transition execution capability through `policy.stageTransition`; the CLI context, agent packet, and portable projection contracts advance to protocol v3, protocol v4, and projection v2 respectively.
- Portable GitHub projections now expose a Git-verifiable workflow-record blob identity for freshness checks, advancing the projection contract to v3.
- Portable implementation policy now separates persisted current-task authorization from runtime/source integrity and makes GitHub-only code edits conditional on authoritative source verification, advancing the projection contract to v4.
- CLI agent context and GitHub-only agent projection now share extracted stage-target, execution-kind, implementation-permission, and workflow-resource routing helpers instead of maintaining parallel routing maps.
- README now routes people by role and task instead of duplicating profile, source, ownership, execution-mode, integrated-quality, and review contracts already owned by `workflow/` documents.
- The optional `AI-project-settings.md` ChatGPT Project host template is now discoverable from README and included in the published package without making it a workflow-state authority.
- The root Figma preparation launcher now delegates execution and reporting details directly to the canonical preparation procedure while preserving the preparation-only safety boundary.
- Active profile-upgrade reconciliation now takes precedence over the generic Blocked-state message when deriving the canonical next action.
- Core lifecycle commands now own canonical workflow diagnostics, task Git lineage, stage rewind, and profile-upgrade replanning directly; `workflow-cli.mjs` is limited to extension routing for toolkit, repository binding, orchestration context, stage preflight, initialization provenance, and task-ID convenience.
- Explicit `--record` execution now resolves one canonical project workspace across artifact paths, subject integrity, repository lookup, task lineage, local bindings, and agent context instead of mixing record-relative and invocation-relative roots.
- Task completion now resolves the output repository through the portable repository-binding layer instead of relying on a hydrated repository path as a second lineage implementation.
- Mutation-lock documentation now distinguishes rollback-capable handled failures from filesystem-wide crash atomicity and documents conservative stale-lock recovery.
- Git task documentation now distinguishes workflow-control files from the broader workflow-managed set, requires approved planning/task narratives to be committed before task start, and documents automatic Task-start checkpoints across workflow-only intervening history.
- Package metadata and README licensing now consistently declare the MIT License.
- GitHub Actions now validates the repository on Node.js 22 and 24 and verifies package provenance generation leaves no working-tree drift.
- `task start` now requires approved planning/task narratives to be committed while allowing canonical workflow-control files to remain dirty.
- `task start` now resolves the effective repository anchor against actual `HEAD`: exact matches reuse the planned baseline or latest Implementation output; descendant `HEAD` values are accepted only when every intervening commit touches workflow-managed paths, producing a new immutable Task start checkpoint when needed. Any implementation-scope path touched anywhere in the intervening history blocks task start for impact assessment, even if a later commit reverts it.
- When a task is restarted after replanning, the replaced Task-start checkpoint is preserved as a Superseded Historical reference pointing to the new checkpoint; the new checkpoint uses the prior executable parent or latest Implementation output rather than parenting a historical snapshot.
- Stage rewind and profile-upgrade start now reset a current implementation task to `Ready`, clear `currentTask`, and invalidate execution-time validation evidence so the task must be revalidated after replanning.
- Schema-v2 semantic validation now requires exact immutable Task-start checkpoints with reciprocal task baselines, executable immutable task baselines, reciprocal Implementation-output ownership, a single reciprocal `currentTask`/`In progress` relationship, Active latest-output/runtime pointers, Complete output producers, and runtime-to-output lineage.
- Schema-v1 migration derives `currentTask` from actual `In progress` task status and normalizes legacy unlineaged Task-start snapshots to Input baselines instead of fabricating missing parent/task lineage.
- Task completion continues to reject dirty implementation-scope paths while permitting workflow-managed narrative/control state to remain dirty outside the implementation commit.
- Recorded Implementation output commits reject workflow-managed files and parent the exact repository snapshot from which the task actually started.
- `workflow/Agent-Orchestration.md` remains discoverable through the README role-based entry points and reference map and is required by repository-contract validation.
- Repository snapshots persist repository identity instead of machine-specific checkout paths. CLI-managed mutations and Git working-tree checks resolve local workspaces at runtime and canonicalize repository references before serialization.

## [0.3.0] — 2026-08-18

### Added

- Focused Figma preparation authority test that requires the root launcher to delegate to the canonical adapter and rejects duplicated numbered procedure sections.
- Deterministic agent-orchestration protocol with `design-workflow context --json` and `design-workflow stage check --json`.
- Shared executable action-eligibility checks for stage advancement and task start.
- `workflow/Agent-Orchestration.md` as the canonical AI-agent runtime contract.
- Profile-aware stage prompts for Express, Lite, Standard, and Full execution.
- Orchestration regression tests covering Stage 9/10 boundaries, Continuous-documentation stop behavior, profile targets, and architecture-triggered upgrades.
- End-to-end Express quickstart with an explicit automatically-enforced versus human-reviewed responsibility matrix.
- Canonical workflow-state ownership rules for CLI-managed and Markdown-only projects.
- Deterministic generated Markdown views for workflow status, sources, artifacts, and tasks.
- Canonical SHA-256 record digests embedded in generated views.
- `design-workflow sync` and `design-workflow sync --check` commands.
- Automatic generated-view synchronization after every CLI-managed record mutation.
- Stale or missing generated-view detection in CLI and repository validation.
- Focused generated-state tests covering key-order stability, record drift, manual edits, and repair.
- Dependency-free `design-workflow` CLI package and executable entry point.
- CLI commands for project initialization, status, next-action guidance, stage and mode control, source snapshots, artifact creation, task lifecycle, validation, and identifier tracing.
- Profile-aware artifact generation from the toolkit templates.
- Automatic repository commit pinning during CLI initialization.
- Automatic Implementation output snapshots when CLI-managed tasks complete.
- End-to-end CLI integration tests and package-content validation in GitHub Actions.
- Express profile for one narrow implementation result using one `WORKPACK.md` and at most one task.
- Express workpack template, execution prompt, and complete component example.
- Express profile support in source snapshots, identifier ownership, validation rules, intake guidance, and assistant instructions.
- Machine-readable workflow record schema and dependency-free semantic validator.
- Semantic checks for duplicate IDs, broken references, profile requirements, task cycles, output lineage, completion state, and validation evidence.
- Express semantic checks for one-workpack ownership, one-task limits, and profile-upgrade conditions.
- General, invalid, and Express workflow-record fixtures with validator self-tests.
- Profile-organized example entry points.
- Stage-specific prompt library.
- Source adapters for Figma, screenshots, PDFs, existing websites, and mixed-source projects.
- Source authority and validation rule documents.
- Repository structure and Markdown-link validation script.
- GitHub Actions validation workflow.
- Contribution guidance.

### Changed

- `source-adapters/FIGMA-PREPARATION.md` is now explicitly the single normative Figma preparation procedure, while `AGENTS-PROMPT-Figma-file-preparation.md` is a thin execution launcher that supplies scope and task boundaries without restating the procedure.
- Generated next-action guidance now requires Stage 9 advancement before a Ready task can start and explicitly stops Continuous-documentation mode before Stage 10.
- Express workpack rendering now preserves implementation discoveries/deviations as narrative while keeping structured validation and output lineage record-owned.
- Agent instructions now consume canonical orchestration context instead of reinterpreting workflow state from Markdown.
- `WORKFLOW-STATE.md`, `SOURCE-BASELINE.md`, and `TASKS-INDEX.md` templates now separate record-owned mutable state from narrative evidence, decisions, coverage, and history.
- Snapshot creation now uses the same synchronized save path as other CLI mutations.
- CLI status, next-action, and validation commands now detect generated-state drift.
- Repository validation now checks generated views for every discovered workflow record.
- Reorganized normative workflow documents into `workflow/`.
- Reorganized artifact-writing guidance into `guidelines/`.
- Moved source-specific Figma preparation into `source-adapters/`.
- Reorganized examples by Express, Lite, Standard, and Full profiles.
- Extended repository CI to validate schemas, fixtures, generated state, workflow CLI behavior, package contents, and discovered workflow records.
- Updated internal links and assistant instructions for the v2 structure and Express path.

### Removed

- Legacy root-level workflow and guideline paths after migration.

## [0.2.0] — 2026-08-06

### Added

- Stage 0 project context and workflow state.
- Lite, Standard, and Full workflow profiles.
- Global identifier namespaces.
- Source snapshot pinning and implementation-output lineage.
- Core requirements, design, specification, plan, and Lite brief templates.

### Changed

- Integrated accessibility, responsive behavior, state handling, errors, and testing into feature work.
- Clarified architecture-skip handling and interaction-pattern requirements.

## [0.1.0] — 2026-08-05

### Added

- Initial design-to-implementation workflow.
- Requirements, design, specification, architecture, and planning guidelines.
- Audit, review, architecture, task, and implementation-review templates.
- Figma preparation and normalization guidance.
