# Quickstart: Complete an Express Workflow

This walkthrough takes one narrow design-to-implementation result through the executable schema-v2 workflow. Express uses one `WORKPACK.md` and exactly one implementation task. Upgrade when the scope needs separate artifacts, multiple tasks, architecture, integration, persistence, authentication, migration, deployment planning, or a material unresolved product decision.

## Prerequisites

- Node.js 22 or newer;
- a Git repository with at least one commit;
- a precisely identifiable design source or other input;
- the installed `design-workflow` command, or the repository CLI invoked with `node /path/to/cli/design-workflow.mjs`.

Run commands from the implementation repository root.

## 1. Initialize Stage 0

```bash
design-workflow init \
  --name "Article preview card" \
  --profile Express \
  --mode Gated \
  --design "https://www.figma.com/design/..." \
  --repository .
```

This creates only the Express Stage 0 artifact and canonical controls:

```text
WORKPACK.md
.workflow/workflow-record.json
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
```

`WORKPACK.md` contains evidence, rationale, expected behavior, planning, task detail, and review narrative. The record owns mutable status, snapshots, gates, task state, validation results, and trace definitions. Generated views must not be edited.

## 2. Verify inputs and approve the workpack

Complete the Stage 0 source and scope narrative, then record actual verification:

```bash
design-workflow snapshot verify SRC-DS-001 \
  --result Unchanged \
  --method "Named-version comparison" \
  --evidence "File version and scoped nodes matched"

design-workflow snapshot verify SRC-REPO-001 \
  --result Unchanged \
  --method "Git rev-parse" \
  --evidence "Recorded commit matched repository HEAD"
```

Move the workpack through its explicit lifecycle:

```bash
design-workflow artifact review ART-WORKPACK --evidence "Completeness review passed"
design-workflow artifact approve ART-WORKPACK --evidence "Stage 0 workpack approved" --approved-by "Owner"
```

Record and advance the Stage 0 decision:

```bash
design-workflow stage review --result Passed --evidence "Stage 0 exit requirements met" --approved-by "Owner"
design-workflow stage advance
```

## 3. Complete consolidated documentation gates

For Express, Stages 1–5 and 7–8 are reviewed against the appropriate workpack sections. Each transition is a decision followed by an advance:

```bash
design-workflow stage review --result Passed --evidence "Current stage reviewed" --approved-by "Owner"
design-workflow stage advance
```

Repeat after completing each current stage. At Stage 6, record the architecture decision first:

```bash
design-workflow architecture decide not-required \
  --reason "One isolated component; no shared state, persistence, integration, or operational decision"

design-workflow stage review --result Passed --evidence "Architecture skip is supported" --approved-by "Owner"
design-workflow stage advance
```

If architecture is required, Express cannot pass Stage 6. Start a profile upgrade instead:

```bash
design-workflow profile upgrade start Standard \
  --resume-stage 2 \
  --reason "The discovered architecture concern requires separate documentation"
```

## 4. Define traceability and the task

After entering Stage 9, define the canonical chain before marking its upstream requirement required:

```bash
design-workflow trace define REQ-FR-001 --owner ART-WORKPACK
design-workflow trace define SPEC-BEH-001 --owner ART-WORKPACK --references REQ-FR-001
design-workflow trace define AC-001 --owner ART-WORKPACK --references SPEC-BEH-001
design-workflow trace define PLAN-001 --owner ART-WORKPACK --references AC-001
design-workflow trace update REQ-FR-001 --required true
```

Create the one Express task and declare validation before completion:

```bash
design-workflow task create \
  --title "Implement article preview card" \
  --references PLAN-001

design-workflow task validation set P01-T01 \
  --name Build \
  --kind Build \
  --required true \
  --status "Not executed" \
  --expected "Production build succeeds" \
  --reason "Pending implementation" \
  --references PLAN-001

design-workflow task ready P01-T01
design-workflow stage review --result Passed --evidence "Task is Ready and required trace coverage resolves" --approved-by "Owner"
design-workflow stage advance
```

## 5. Implement against verified Git lineage

```bash
design-workflow task start P01-T01
```

Implement and commit the result. Supply the real full `HEAD` SHA:

```bash
design-workflow task complete P01-T01 \
  --commit <current-head-sha> \
  --check "Build=Production build completed successfully"
```

The shorthand updates only the already-declared Build check. Completion rejects an unknown check, missing commit, non-HEAD commit, or commit that does not descend from the task baseline. On success it creates the Implementation-output snapshot.

Review and advance Stage 10:

```bash
design-workflow stage review \
  --result Passed \
  --evidence "Task complete, validation passed, and Git lineage verified" \
  --approved-by "Owner"

design-workflow stage advance
```

## 6. Reverify and accept

Reverify the exact output before final acceptance:

```bash
design-workflow snapshot verify SRC-REPO-002 \
  --result "Expected workflow output" \
  --method "Git and final implementation comparison" \
  --evidence "Reviewed result remained at the recorded output commit"
```

Review Stage 11 after the output is reverified and the final-review artifact is approved:

```bash
design-workflow stage review \
  --result Passed \
  --evidence "Output reverified and final-review artifact approved" \
  --approved-by "Owner"
```

Express uses the approved workpack as its final-review artifact:

```bash
design-workflow review set-result accepted \
  --artifact ART-WORKPACK \
  --output SRC-REPO-002 \
  --evidence "Final implementation review passed" \
  --approved-by "Owner"
```

Only this command sets final completion. Finish by checking the complete record and projections:

```bash
design-workflow validate
design-workflow sync --check
design-workflow status
```

Commit the implementation, narrative artifact, workflow record, and generated views together.

## Recovery and source change

An active-input verification of `Unexpected upstream or concurrent change` or `Unavailable` blocks progression. Create or register the replacement snapshot, record impact, and use explicit supersession. Snapshot supersession does not silently rewrite artifact baselines.

If a destination narrative already exists, stage advancement stops without changing any workflow file. Register the file, then retry:

```bash
design-workflow artifact adopt requirements --path REQUIREMENTS.md
```

Schema-v1 projects must migrate before any mutation:

```bash
design-workflow migrate --check
design-workflow migrate
```

A passing validator proves that the recorded control relationships are consistent; it does not replace competent design, accessibility, implementation, or evidence review.
