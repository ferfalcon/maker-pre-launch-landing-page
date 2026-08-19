# Agent Orchestration

This document defines how an AI design-engineering agent operates the executable workflow without becoming a second workflow engine.

## Boundary

The agent owns reasoning, source inspection, artifact prose, implementation decisions within approved scope, and evidence collection. The CLI owns executable state, stage/task legality, canonical registries, generated views, trace definitions, validation state, implementation lineage, the recorded workflow-toolkit dependency binding, and the canonical workflow-resource manifest for the current turn.

Never infer executable state from narrative Markdown when `.workflow/workflow-record.json` exists. Never manually edit generated views.

## Agent packet handshake

Begin every CLI-managed workflow turn with:

```bash
design-workflow agent-context --json
```

`design-workflow context --agent --json` is an equivalent alias. The materialized agent packet uses `protocolVersion: 3`; treat that independently from the workflow record `schemaVersion`.

The packet is the preferred agent bootstrap. It wraps the initialized protocol-v2 orchestration context and materializes its canonical `execution.resources` manifest; it does not introduce a second stage-to-resource resolver. The underlying context protocol is exposed as `contextProtocolVersion`.

The packet reports the implementation project workspace/profile/mode, toolkit dependency, current stage and execution kind, policy, active sources, target artifacts, the full current task, Ready-task summaries, stage preflight, the next action, required workflow resources, missing-artifact templates, and conditional source-adapter choices.

The lower-level compatibility handshake remains available:

```bash
design-workflow context --json
```

Initialized CLI-managed context payloads that expose the minimal resource manifest use protocol v2. Uninitialized/missing-record context remains a separate bootstrap path. Use context protocol v2 for diagnostics and existing integrations; use agent-packet protocol v3 for normal agent execution.

If no record exists, the agent packet embeds the intake prompt and instructs initialization. If the record is schema v1, migrate before mutation. If the packet reports `repair`, repair record/generated state before continuing. Migration and repair packets intentionally withhold ordinary stage resources.

### Toolkit dependency resolution

The workflow toolkit is an execution dependency, not part of the implementation project's source lineage. For projects that consume workflow resources from GitHub or another remote package source, pin the toolkit to an exact immutable revision rather than treating `main`, a branch, or a package version alone as operational identity.

A canonical CLI-managed binding lives at top-level `toolkit` in `.workflow/workflow-record.json`:

```json
{
  "toolkit": {
    "repository": "ferfalcon/figma-to-implementation-workflow",
    "revision": "<40-character-git-sha>"
  }
}
```

Inspect the current binding with:

```bash
design-workflow toolkit show --json
```

Pin an existing unpinned workflow with:

```bash
design-workflow toolkit pin \
  --repository ferfalcon/figma-to-implementation-workflow \
  --revision <40-character-sha>
```

`--commit` remains accepted as a compatibility alias for `--revision`.

When `toolkit.pinned` is `true`, all workflow prompts, guidelines, templates, adapters, and normative workflow documents used for the turn must come from `toolkit.repository` at exactly `toolkit.revision`. Never fall back to `main` or another mutable ref.

The packet enforces this boundary. If the installed toolkit runtime matches the recorded repository and revision, selected required resources and applicable templates return `resolution: embedded` with `content`. If it does not match, the packet returns `resolution: pinned-source-required` with the exact `source.repository`, `source.revision`, and `source.path` and does not embed potentially incorrect local content.

Records created by the short-lived snapshot model remain readable. When `toolkit.legacy` is `true`, or resources report `resolution: migrate-toolkit-binding`, run:

```bash
design-workflow toolkit migrate
```

Migration moves the toolkit identity into the dedicated top-level binding and removes the unreferenced legacy `toolkit+github://` snapshot from project lineage. Multiple legacy pins or referenced legacy toolkit snapshots require repair rather than silent migration.

Replacing a valid existing binding is not an ordinary mutation; toolkit upgrades must be explicit and preserve previous dependency identity.

## Minimal-read execution

For an initialized, healthy CLI-managed project, the packet is the workflow-reading boundary for the turn.

- `resources.required` materializes the canonical required resources from context `execution.resources.required`.
- `resources.stagePrompt` and `resources.guidance` are convenience views over those required resources.
- `resources.templates` contains only on-demand templates whose target artifact is not already registered; an existing task/artifact does not repeatedly carry its template.
- `resources.conditional` preserves conditional choices such as source adapters without eagerly loading all alternatives.
- `resources.manifest` preserves the underlying protocol-v2 resource manifest for traceability.

Use a resource's embedded `content` when `resolution` is `embedded`. When `resolution` is `pinned-source-required`, load the exact returned pinned `source`. Do not reconstruct GitHub paths or mutable refs.

Do not recursively inspect the toolkit or read `README.md`, `QUICKSTART.md`, `cli/README.md`, broad `workflow/` documentation, unrelated prompts, unrelated guidelines, unrelated templates, or every source adapter to rediscover how the workflow works.

Broader workflow reads are permitted only for initialization, migration/repair, an explicit reference from a required resource, toolkit development, or an explicit user request to inspect/modify the workflow toolkit.

The goal is deterministic startup: permanent agent contract → `agent-context --json` → resolved current resources → work.

## Stage-local execution

Perform only the responsibility of the current stage described by `resources.stagePrompt`. Use `task.artifactTypes` and `task.artifacts` as the current targets.

- Express keeps all narrative reasoning in `WORKPACK.md`.
- Lite uses `IMPLEMENTATION-BRIEF.md` for consolidated Stages 2–8 and separate source/audit/task/final-review artifacts.
- Standard uses separate core artifacts and conditional architecture.
- Full uses the complete separate artifact set including architecture.

The prompt determines what reasoning belongs in the target artifact. The workflow record remains the owner of mutable status, registry, validation-result, and lineage fields.

Use stage-specific guidelines only when returned in `resources.required`. Use templates only when returned in `resources.templates`. Select the relevant source adapter from `resources.conditional` based on the actual source; do not browse every adapter.

## Stage preflight

Before proposing a stage decision, run:

```bash
design-workflow stage check --json
```

`stage check` is read-only. It evaluates whether a structurally valid stage decision can be recorded and whether an already-recorded passing decision can advance.

- `Passed` means the structural exit contract can be satisfied.
- `Must upgrade` is recommended when the current profile cannot legally continue, such as Express/Lite with required architecture.
- `Passed with assumptions` is never selected automatically; an agent or human must explicitly justify the assumption.
- A Gated workflow still requires a real human approval actor before a passing decision is recorded.

Do not treat preflight success as evidence that the narrative or design reasoning is substantively correct. The agent must perform the required two review passes first.

## Execution modes

### Gated

Complete the current stage and preflight it. Stop for explicit human approval before recording a passing gate or advancing. Never invent `--approved-by` or treat agent confidence as human approval.

### Continuous documentation

Continue through documentation, consistency review, architecture decision, planning, plan review, and task decomposition while unblocked. Stop at Stage 9. The CLI must not enter Stage 10 in this mode.

### Task-by-task

Use only after task decomposition. At Stage 10 select one unblocked Ready task whose prerequisites are complete, start it through the CLI, implement only that task, run required validation, commit, complete the task, and stop before beginning another task unless the workflow/user explicitly continues.

## Code-edit boundary

Implementation code may be edited only when the agent packet reports:

```text
policy.codeEdits = allowed-with-current-task-scope
```

This requires Stage 10, a structurally clean schema-v2 workflow, and an execution mode that permits implementation. Outside Stage 10, source/repository inspection is allowed but implementation edits are not.

## Source and lineage safety

Verify relevant active snapshots before stage closure and before task execution. Unexpected material upstream/concurrent changes block affected work and require a new snapshot or explicit impact assessment. Expected previous-task outputs advance repository lineage without replacing the original project input baseline.

The toolkit dependency is separate from implementation-source lineage. Do not add toolkit identity to artifact or task baselines. `SRC-*` remains reserved for design, document, runtime, and implementation-project source history.

## Narrative ownership during implementation

Task/workpack Markdown owns:

- implementation discoveries;
- deviations and their rationale;
- affected-file/behavior narrative;
- risks and follow-up documentation changes.

The workflow record owns:

- current task status;
- structured validation result/status/evidence fields;
- output snapshot identity;
- output commit SHA;
- task/output parent lineage.

Do not duplicate record-owned mutable values in CLI-managed narrative sections.

## Completion loop

After every meaningful workflow mutation, the CLI updates generated views transactionally. Before claiming readiness or completion, run the relevant preflight plus `design-workflow validate` or `design-workflow sync --check` as required.

Final acceptance remains Stage 11 work against exact source snapshots, approved narrative artifacts, implementation-output snapshot/commit, and validation runtime when applicable.
