# Design Workflow CLI

The dependency-free CLI owns executable workflow state in `.workflow/workflow-record.json`. Schema-v2 mutations are validated and committed with their generated views and newly scaffolded artifacts as one rollback-capable file set.

See [`../workflow/State-Ownership.md`](../workflow/State-Ownership.md) for ownership rules and [`../schemas/README.md`](../schemas/README.md) for the record model.

## Run locally

```bash
node cli/design-workflow.mjs help
```

After packaging or installation:

```bash
npx @ferfalcon/design-workflow help
```

Node.js 22 or newer is required.

## Control modes

CLI-managed is the default and the only executable control mode:

```bash
design-workflow init \
  --name "Article preview component" \
  --profile Express \
  --mode Gated \
  --control cli-managed \
  --design "https://www.figma.com/design/..." \
  --repository .
```

Initialization creates a schema-v2 record and only the Stage 0 artifacts for the selected profile. Later artifacts are scaffolded atomically when a passing gate is advanced.

Markdown-only mode creates Stage 0 narrative artifacts without a record, generated views, lifecycle enforcement, or Markdown parsing:

```bash
design-workflow init --name "Documentation fixture" --profile Standard --control markdown-only
design-workflow artifact scaffold plan --control markdown-only --project "Documentation fixture" --profile Standard
```

## Generated views

CLI-managed projects receive deterministic projections under `.workflow/generated/`:

```text
WORKFLOW-STATUS.md
SOURCE-INDEX.md
ARTIFACT-INDEX.md
TASK-INDEX.md
TRACEABILITY.md
```

Every successful record mutation refreshes all views. Check or repair projections with:

```bash
design-workflow sync --check
design-workflow sync
design-workflow validate
```

## Schema-v1 migration

Schema-v1 records remain readable by `status`, `validate`, `sync`, and trace inspection, but are read-only:

```bash
design-workflow migrate --check
design-workflow migrate
```

`--check` reports the deterministic conversion without writing and exits non-zero when migration is required. Migration assigns artifact paths, infers optional trace definitions, converts legacy checks to structured `kind: Other` checks, and records a `legacyBoundary` at the current stage. A legacy Passed check without a trustworthy execution timestamp is preserved as evidence but changed to `Not executed` so it must be rerun before completion. Running `migrate` again is a no-op.

## Stage decisions

Direct stage assignment is intentionally disabled. `stage set` returns a compatibility error and does not mutate files.

```bash
design-workflow stage review \
  --result Passed \
  --evidence "Exit requirements and evidence reviewed" \
  --approved-by "Reviewer"

design-workflow stage advance
design-workflow stage rewind 4 --reason "New behavior invalidated the specification"
```

Gate results are `Passed`, `Passed with assumptions`, `Blocked`, and `Must upgrade`. Every Gated decision requires `--approved-by`. Advancement accepts only the current stage’s latest active passing gate. Rewind preserves history, supersedes decisions at and after the target, leaves narrative baselines unchanged, and returns the workflow to `In progress`.

Architecture is an explicit Stage 6 decision:

```bash
design-workflow architecture decide not-required --reason "No cross-cutting structural decision"
design-workflow architecture decide required --reason "Shared state and persistence are in scope"
```

Architecture-required Express and Lite work must upgrade. Full, and architecture-required Standard work, require an approved architecture artifact.

## Source lifecycle

```bash
design-workflow snapshot add --kind design --reference "Pinned Figma version" --activate
design-workflow snapshot add --kind repo --reference "https://github.com/owner/repository" --commit <40-character-sha> --activate

design-workflow snapshot verify SRC-DS-001 \
  --result Unchanged \
  --method "Named-version comparison" \
  --evidence "Version and scoped nodes matched"

design-workflow snapshot supersede SRC-DS-001 \
  --by SRC-DS-002 \
  --reason "Approved upstream revision"
```

Verification events are append-only. `Unexpected upstream or concurrent change` and `Unavailable` block active-input progression. Snapshot supersession never rewrites artifact baselines automatically.

### Repository identity and local bindings

`init --repository <path>` uses the local checkout only to discover Git identity and the pinned commit. The canonical workflow record does **not** keep that machine-specific path.

When possible, repository snapshots store a credential-free canonical remote identity such as `https://github.com/owner/repository`. A repository inside the workflow project with no usable remote falls back to `project://.` or `project://relative/path`.

If the workflow project and repository checkout live in different directories on a machine, bind the canonical snapshot to that checkout locally:

```bash
design-workflow repository bind SRC-REPO-001 --path ../implementation-repository
```

The command writes `.workflow/local.json`. That file is Git-ignored and is never part of snapshot identity. A binding is accepted only when the checkout contains the snapshot's pinned commit and does not present a conflicting remote identity.

Legacy schema-v2 records that already contain absolute repository paths remain readable. When a later successful mutation can resolve the same repository safely, the persisted reference is healed to a canonical remote or `project://` identity. New repository snapshots are rejected rather than persisting a new machine-specific path when no portable identity can be derived.

## Artifact lifecycle

New narrative files are rendered from the artifact body only, with real YAML frontmatter and substituted project values:

```bash
design-workflow artifact scaffold requirements --control cli-managed
design-workflow artifact adopt requirements --path REQUIREMENTS.md
design-workflow artifact review ART-REQUIREMENTS --evidence "Completeness review passed"
design-workflow artifact approve ART-REQUIREMENTS --evidence "Approved requirements" --approved-by "Owner"
design-workflow artifact reopen ART-REQUIREMENTS --evidence "New source changes behavior"
design-workflow artifact baseline ART-REQUIREMENTS --baseline SRC-DS-002,SRC-REPO-001
design-workflow artifact supersede ART-REQUIREMENTS --by ART-REQUIREMENTS-2 --reason "Replacement approved"
```

Transitions are `Draft → Reviewed → Approved`. Reopen is explicit. Changing an approved baseline reopens the artifact. The CLI never overwrites an unregistered existing narrative; register it with `artifact adopt` and retry the stage advance.

## Canonical traceability

```bash
design-workflow trace define REQ-FR-001 --owner ART-REQUIREMENTS --required true
design-workflow trace define SPEC-BEH-001 --owner ART-SPEC --references REQ-FR-001
design-workflow trace define AC-001 --owner ART-SPEC --references SPEC-BEH-001
design-workflow trace define PLAN-001 --owner ART-PLAN --references AC-001

design-workflow trace update REQ-FR-001 --required true
design-workflow trace supersede REQ-FR-001 --by REQ-FR-002
design-workflow trace show REQ-FR-001
design-workflow trace REQ-FR-001
```

The last form is an alias for `trace show`. References and owners must resolve, owner types must be compatible with the profile, and the domain graph must remain acyclic. `.workflow/generated/TRACEABILITY.md` reports owners, upstream definitions, downstream plans, tasks, validation checks, unresolved references, orphans, cycles, and coverage gaps.

## Tasks and validation

Task lifecycle is explicit:

```bash
design-workflow task create --title "Implement article card" --references PLAN-001
design-workflow task ready P01-T01
design-workflow task start P01-T01
design-workflow task block P01-T01 --reason "Waiting for approved copy"
design-workflow task unblock P01-T01
```

Task IDs use `Pxx-Txx`. With no phase or explicit ID, creation starts at `P01-T01` and continues in the highest existing phase. Use `--phase` to start or continue a specific phase; use `--id` only when the exact canonical task ID is intentional. The two options are mutually exclusive:

```bash
design-workflow task create --phase 2 --title "Build the second-phase interaction"
# Creates P02-T01 when Phase 02 has no tasks.

design-workflow task create --phase P02 --title "Add the second-phase validation"
# Creates P02-T02 next.

design-workflow task create --id P03-T05 --title "Create an explicitly numbered task"
```

CLI-managed task artifacts derive their filename and heading from the same ID, so `P02-T03` renders as `Phase-02--Task-03.md` with a `Phase 02 — Task 03` heading.

Declare structured checks before completion:

```bash
design-workflow task validation set P01-T01 \
  --name Build \
  --kind Build \
  --required true \
  --status "Not executed" \
  --expected "Production build succeeds" \
  --reason "Pending implementation" \
  --references PLAN-001
```

A Passed result requires `--actual`, `--executed-at`, and at least one `--evidence`. Required checks cannot be `Not applicable`.

Completion accepts the existing `--check name=evidence` shorthand only for checks already declared on the task:

```bash
design-workflow task complete P01-T01 \
  --commit <current-head-sha> \
  --check "Build=Production build completed successfully"
```

Task start resolves the effective baseline against the actual local `HEAD`, including the latest approved Implementation output when appropriate. Completion resolves the task baseline's local checkout from its portable identity, project-relative location, or local binding, then verifies that the commit exists in that repository, equals `HEAD`, and descends from the recorded baseline commit. Only then does it create the Implementation-output snapshot, again using a portable repository identity. Task-by-task execution cannot begin before Stage 9, and Continuous-documentation mode cannot enter Stage 10.

## Profile upgrades

Profile changes are two-phase and upgrade-only:

```bash
design-workflow profile upgrade start Standard \
  --resume-stage 2 \
  --reason "Separate requirements, design, and specification are required"

# Reconcile the scaffolded target artifacts through the resume stage.

design-workflow profile upgrade finish \
  --evidence "Target artifacts reconciled" \
  --approved-by "Reviewer"
```

`start` selects the higher profile, rewinds, blocks advancement, and scaffolds missing target artifacts—including compatible owner artifacts for active trace items. Before `finish`, reconcile those artifacts and move active trace items off any obsolete Workpack or Implementation Brief with `trace update --owner`. `finish` then supersedes obsolete consolidated artifacts. Downgrades are rejected.

## Final review

Stage 11 completion is set only through a final-result event:

```bash
design-workflow snapshot verify SRC-REPO-002 \
  --result "Expected workflow output" \
  --method "Git and runtime comparison" \
  --evidence "Reviewed output still matches HEAD"

design-workflow stage review \
  --result Passed \
  --evidence "Output reverified and final-review artifact approved" \
  --approved-by "Reviewer"

design-workflow review set-result accepted \
  --artifact ART-IMPLEMENTATION-REVIEW \
  --output SRC-REPO-002 \
  --runtime SRC-RUN-001 \
  --evidence "Acceptance review passed" \
  --approved-by "Reviewer"
```

Results are `accepted`, `accepted-with-deviations`, and `requires-corrections`. Accepted-with-deviations uses the supplied evidence as explicit deviation evidence. Requires-corrections leaves Stage 11 Blocked.

## Safety contract

- The current record must be clean before advancement, task execution, or acceptance.
- A candidate record, all generated views, and new artifact files are rendered and validated before any target is replaced.
- Repository snapshot identities are canonicalized before record serialization; local checkout bindings remain outside the committed workflow state.
- Writes use sibling temporary files and rollback on an I/O failure.
- Rejected mutations leave the record, generated views, and narrative files byte-identical.
- Existing unregistered narrative files are never overwritten.
- Use `--record path/to/workflow-record.json` to override the default record location.
