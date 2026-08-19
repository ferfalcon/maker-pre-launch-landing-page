# Quickstart: Choose a Workflow Profile and Start

Start by selecting the workflow profile from the actual complexity and risk of the work. The profile is not a tutorial choice: it controls artifact granularity and must be selected before substantive documentation or implementation begins. [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) owns the canonical eligibility, artifact, and upgrade rules.

This quickstart initializes any profile, then uses Express as a concrete worked example. Do not choose Express only because the worked example is shorter.

## Prerequisites

- Node.js 22 or newer;
- a Git repository with at least one commit;
- a precisely identifiable design source or other input;
- the installed `design-workflow` command, or the repository CLI invoked with `node /path/to/cli/design-workflow.mjs`.

Run commands from the implementation repository root.

## 1. Choose a profile before initialization

Use these as routing cues; [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) remains authoritative when a boundary is unclear.

| Profile | Use when |
|---|---|
| **Express** | One narrow, coherent implementation result fits in one workpack and exactly one task, with no meaningful routing, shared state, persistence, authentication, authorization, external API, architecture, migration, deployment, security, privacy, rollback, or multi-contributor coordination concern. |
| **Lite** | An isolated component, small static page, or narrow change needs separate control, audit, task, or final-review artifacts, or more than one tightly related task, but still has no meaningful architecture, persistence, authentication, or complex integration decision. |
| **Standard** | A multi-page site, substantial UI feature, existing-application feature, or meaningful repository integration needs separate core artifacts while system-wide architectural risk remains limited. Architecture is conditional. |
| **Full** | Full-stack work, authentication, persistence, multiple services or packages, complex integrations, significant migrations, or high deployment, security, privacy, reliability, or operational risk is in scope. |

Express is an all-conditions profile: if any Express eligibility condition is false, do not initialize as Express. When choosing between adjacent profiles, use the lower profile only when its consolidation rules can preserve every material concern clearly; otherwise choose the higher profile. Upgrade as soon as new evidence crosses the selected profile's limits.

## 2. Initialize the selected profile

Replace `<selected-profile>` with `Express`, `Lite`, `Standard`, or `Full` based on Step 1:

```bash
design-workflow init \
  --name "Article preview card" \
  --profile "<selected-profile>" \
  --mode Gated \
  --design "https://www.figma.com/design/..." \
  --repository .
```

Initialization creates only the selected profile's Stage 0 artifacts plus the canonical CLI-managed workflow record and generated views. The CLI does not select a profile for you.

Check the initialized state before substantive work:

```bash
design-workflow status
```

If an AI agent is running the workflow, use the consumer bootstrap in [`AGENTS-instructions.md`](AGENTS-instructions.md); it resolves the current stage, profile, next action, and exact required resources without broad toolkit browsing.

## 3. Continue with the selected profile

- **Express:** continue with the worked example below.
- **Lite, Standard, or Full:** follow [`workflow/Design-Implementation-Workflow.md`](workflow/Design-Implementation-Workflow.md) for the normative stage sequence and [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) for the selected profile's artifact requirements. Use [`cli/README.md`](cli/README.md) for command reference.

Do not use Express artifact or task commands merely because they appear in the worked example. The selected profile owns the required artifact shape and upgrade conditions.

## Express worked example

From this point onward, the walkthrough assumes Step 1 selected **Express**. Express uses one `WORKPACK.md` and exactly one implementation task. Upgrade when the scope needs separate artifacts, multiple tasks, architecture, integration, persistence, authentication, migration, deployment planning, or a material unresolved product decision.

Express initialization creates the Stage 0 workpack and canonical controls:

```text
WORKPACK.md
.workflow/workflow-record.json
.workflow/generated/WORKFLOW-STATUS.md
.workflow/generated/SOURCE-INDEX.md
.workflow/generated/ARTIFACT-INDEX.md
.workflow/generated/TASK-INDEX.md
.workflow/generated/TRACEABILITY.md
.workflow/generated/AGENT-CONTEXT.json
```

`WORKPACK.md` contains evidence, rationale, expected behavior, planning, task detail, and review narrative. The record owns mutable status, snapshots, gates, task state, validation results, and trace definitions. Generated views must not be edited. `AGENT-CONTEXT.json` is the portable read-only routing projection used when an agent can inspect the project through GitHub but cannot execute `design-workflow`; it never replaces CLI-owned state transitions.

### 1. Verify inputs and approve the workpack

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

### 2. Complete consolidated documentation gates

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

### 3. Define traceability and the task

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

### 4. Implement against verified Git lineage

Before task start, commit the approved planning/task narrative. `task start` permits canonical record/generated control files to remain dirty, but it rejects dirty narrative or implementation-scope paths. For Express, for example:

```bash
git add WORKPACK.md
git commit -m "Record approved implementation plan"
```

Then start the task:

```bash
design-workflow task start P01-T01
```

The CLI verifies the actual repository `HEAD`. If committed history since the planned baseline contains only workflow-managed files, it records an immutable Task-start checkpoint at the real `HEAD`; unexpected implementation-scope history blocks execution for impact assessment.

Implement and commit only the task result. Do not include `.workflow/*` or active workflow narratives in the Implementation-output commit. Supply the real full `HEAD` SHA:

```bash
design-workflow task complete P01-T01 \
  --commit <current-head-sha> \
  --check "Build=Production build completed successfully"
```

The shorthand updates only the already-declared Build check and binds the executed result to the current implementation commit. Completion rejects an unknown check, missing commit, non-HEAD commit, stale validation subject, dirty implementation leftovers, or an Implementation-output commit containing workflow-managed files. On success it creates the Implementation-output snapshot.

Review and advance Stage 10:

```bash
design-workflow stage review \
  --result Passed \
  --evidence "Task complete, validation passed, and Git lineage verified" \
  --approved-by "Owner"

design-workflow stage advance
```

### 5. Reverify and accept

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

Commit remaining narrative, workflow-record, and generated-state changes as a separate workflow/documentation commit. Do not amend or replace the recorded Implementation-output commit merely to add workflow bookkeeping.

### Recovery and source change

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
