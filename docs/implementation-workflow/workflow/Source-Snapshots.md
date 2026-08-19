# Source Snapshots

Source snapshots make project artifacts reproducible by recording the exact design, repository, runtime, documentation, and asset baselines used to create them.

A source URL by itself is not a snapshot. Many URLs point to mutable content. Record either an immutable revision or enough time-bound evidence to describe what was actually inspected.

## Core model

Express records source snapshots in the Source baseline section of `WORKPACK.md` from [`../templates/WORKPACK.template.md`](../templates/WORKPACK.template.md).

Lite, Standard, and Full create `SOURCE-BASELINE.md` during Stage 0 from [`../templates/SOURCE-BASELINE.template.md`](../templates/SOURCE-BASELINE.template.md).

The active baseline owner defines snapshot identity and details. Other artifacts or consolidated sections reference snapshot IDs instead of copying mutable URLs, dates, or commits throughout the documentation set.

Example artifact metadata:

```yaml
---
artifact: SPEC
status: Draft
baseline:
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime: []
  documentation:
    - SRC-DOC-001
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Use an empty list when a category does not apply. Do not insert an undefined placeholder ID.

## Snapshot namespaces

- `SRC-DS-*` — Figma, screenshots, images, PDFs, websites used as design evidence;
- `SRC-REPO-*` — repository input baselines, task-start commits, and implementation outputs;
- `SRC-RUN-*` — production, preview, staging, or local runtime observations;
- `SRC-DOC-*` — product, API, legal, design-system, or technical documentation;
- `SRC-ASSET-*` — asset bundles, fonts, images, icons, or other implementation inputs.

Each ID is defined once in the active baseline owner and never reused.

## Snapshot roles

Identity category and workflow role are separate.

Use one role for each snapshot:

- **Input baseline** — an upstream source used to define expected work;
- **Supporting source** — additional evidence or documentation;
- **Task start** — repository state from which a task begins;
- **Implementation output** — repository state produced by approved implementation work;
- **Validation runtime** — deployed or local runtime used for validation;
- **Historical reference** — preserved prior state no longer active.

A repository commit produced by an approved task is an Implementation output, not an unexpected upstream source change.

## Pin strength

### Immutable

Content cannot change without receiving a different identity.

Examples: Git commit SHA, content-addressed object, checksum-backed file, immutable deployment ID.

### Versioned

The source provides a stable named or numbered revision, but immutability cannot be independently guaranteed.

Examples: named Figma version, versioned API specification, document revision.

### Time-bound

The source was inspected at a recorded time, but the original location may change later.

Examples: live Figma file without a named version, existing website, shared document without revision access.

Time-bound snapshots must state reproducibility limitations and should include exported evidence when practical.

### Unverified

Identity or revision could not be confirmed. A material Unverified source may block later stages.

## Required fields

Every snapshot record must include:

- snapshot ID;
- role;
- source category and type;
- title or purpose;
- canonical reference;
- exact included scope;
- captured or inspected timestamp with timezone;
- pin strength;
- immutable revision, version, checksum, or deployment ID when available;
- captured evidence location when available;
- access and reproduction instructions;
- known limitations;
- status: Active / Superseded / Invalid / Unverified.

Do not claim immutability when only a timestamp or mutable URL is available.

## Source-specific rules

### Figma

Record file URL and key, page and node scope, named version when available, timestamp, access mode, library dependencies, exports when practical, role, pin strength, and limitations.

A normal Figma design URL is mutable. Without a named version or checksum-backed export, classify it as Time-bound.

See [`../source-adapters/FIGMA.md`](../source-adapters/FIGMA.md).

### Screenshots, images, and PDFs

Record file name, format, size when available, SHA-256 checksum when tooling permits, exact page or region scope, acquisition date, storage reference, and transformations already applied.

A checksum pins the supplied file, not its unseen original source.

See [`../source-adapters/SCREENSHOTS.md`](../source-adapters/SCREENSHOTS.md) and [`../source-adapters/PDF.md`](../source-adapters/PDF.md).

### Existing websites

Record exact URLs, timestamp, viewports, browser and environment, authentication or personalization state, screenshots or recordings, dynamic data, and limitations.

A live website observation is normally Time-bound even when its URL is stable.

See [`../source-adapters/EXISTING-WEBSITE.md`](../source-adapters/EXISTING-WEBSITE.md).

### Repositories

Record repository URL, commit SHA, role, branch for context, relevant package or directory, lockfile or submodule state, uncommitted patch when applicable, and access limitations.

Use the commit SHA as the pin. A branch name alone is mutable and insufficient.

The canonical repository snapshot must describe repository **identity**, not one machine's checkout location. Never intentionally persist paths such as `/Users/name/project`, `C:\work\project`, or a temporary CI workspace as the repository reference.

For CLI-managed records:

- prefer a credential-free canonical remote identity such as `https://github.com/owner/repository` when the checkout has a usable Git remote;
- when the repository is inside the workflow project but has no remote, use the portable `project://.` or `project://relative/path` form;
- keep the local checkout path outside the canonical record;
- use `.workflow/local.json` only as a local, Git-ignored binding when the canonical repository and workflow project live in different directories;
- preserve older absolute-path records for compatibility, but rewrite them to a portable identity on a later successful mutation when the same repository can be resolved safely.

Repository binding and repository identity are deliberately separate. The canonical reference answers **which repository?**; the local binding answers **where is its checkout on this machine?**. A local binding must never change snapshot identity or bypass the recorded commit pin.

Repository snapshot roles typically progress as:

```text
Input baseline → Task start → Implementation output → Next task start
```

A task's executable repository baseline must be an Immutable repository snapshot with a commit SHA and role Input baseline, Task start, or Implementation output. Incomplete tasks must not execute from Superseded, Invalid, or Unverified repository state.

A schema-v2 **Task start** snapshot is an exact checkpoint, not a loose label. It must be an Immutable `SRC-REPO-*` snapshot with a commit SHA, an executable repository-snapshot parent, and the task ID. The task must point back to the current Task-start snapshot as its baseline. An **Implementation output** likewise points to its producing task, and the task points back to that output.

A single commit may serve as both one task's Implementation output and the next task's Task start. Reference the same snapshot ID rather than duplicating it.

Before task start, approved planning and task narratives must be committed so the implementation instructions are reproducible. The canonical record and generated projections may remain dirty because the CLI updates those control files while recording workflow state. Any other staged, unstaged, or untracked path blocks task start.

At task start, compare repository `HEAD` with the effective repository comparison anchor: the latest active Implementation output when it belongs to the same repository and is an ancestor of `HEAD`, otherwise the task's planned repository baseline.

- when `HEAD` equals that anchor, reuse the existing repository snapshot;
- when `HEAD` descends from the anchor, inspect **every intervening commit** from the comparison anchor through `HEAD`; only when every touched path is workflow-managed planning/control state may the CLI create a new immutable **Task start** snapshot at the actual `HEAD`;
- normally the new Task start parents the comparison anchor;
- when replanning restarts the same task from a previous Task-start checkpoint, compare history from that previous start commit, preserve the previous start as a Superseded Historical reference that points to the replacement, and parent the replacement to the previous start's executable parent or the latest applicable Implementation output;
- when any intervening commit touches an implementation-scope path, block task start and require impact assessment instead of silently rebasing the task—even if a later commit reverts that implementation change and the endpoint tree appears clean.

The history-level rule is intentional. Task-start lineage records not only the final tree difference but whether implementation-scope work occurred between the approved repository anchor and the exact task start.

This permits legitimate committed workflow bookkeeping between tasks without losing exact lineage. For example:

```text
Input baseline → Task start → Implementation output → Task start → Implementation output
```

A rewind or profile upgrade discovered during Stage 10 invalidates the current execution attempt: the task returns to `Ready`, `state.currentTask` is cleared, and execution-time validation evidence is reset to `Not executed`. Replanning does not silently reuse prior Passed evidence. A later restart establishes or reuses an exact repository checkpoint under the rules above.

Task completion has a different cleanliness boundary. Workflow-managed narrative/control files may remain dirty, but implementation-scope files may not. The commit pinned as an Implementation output must not modify workflow-managed files; stage and commit implementation deliverables separately.

Express permits one task and therefore normally has one current Task start and one Implementation output; superseded restart checkpoints may remain visible as Historical references.

### Runtime deployments

Record environment and URL, deployment or release ID, associated repository snapshot, timestamp, configuration or feature-flag state, test data, authentication state, captured evidence, and environment differences.

When a Validation runtime is used for final review, parent it to the exact Implementation output being reviewed. The active `latestValidationRuntime` pointer must reference that Active runtime rather than a superseded or unrelated environment.

### Documentation

Record path or URL, authority, revision or checksum, exact sections used, access limitations, and normative, informative, or historical status.

## Artifact baseline references

Every workflow artifact or consolidated ownership section created after baseline capture must identify the snapshot IDs it relies on.

Metadata or workpack sections should reference design snapshots used for visual evidence, repository snapshots used for current-state claims, documentation snapshots used for requirements, runtime snapshots used for observed behavior, and asset snapshots used as implementation inputs.

Reference only sources actually used.

## Active input baseline and implementation lineage

Express distinguishes active inputs, the task-start repository snapshot, the Implementation output, and the validation runtime inside `WORKPACK.md`.

Lite, Standard, and Full use `WORKFLOW-STATE.md` to distinguish:

- active upstream input snapshots;
- current task-start repository snapshot;
- latest approved implementation-output snapshot;
- current validation-runtime snapshot.

In CLI-managed schema v2, `state.currentTask` and task status are reciprocal: no task may be `In progress` without being the current task, the current task must be `In progress`, and more than one `In progress` task is invalid.

An artifact remains valid against the snapshots in its metadata after the active baseline changes. It becomes stale only when a newer upstream input affects its scope or conclusions.

## Expected workflow outputs

Approved implementation naturally changes the repository and runtime.

When a task completes successfully:

1. confirm no implementation-scope path remains dirty;
2. confirm the recorded output commit does not modify workflow-managed files;
3. create a new `SRC-REPO-*` record with role Implementation output;
4. record the output commit SHA;
5. connect it to the exact Task start snapshot and task ID;
6. update the active baseline owner, task record, and control state;
7. use that output as the next task's repository anchor when applicable;
8. if workflow-managed changes are committed before the next task, capture their resulting `HEAD` as a new Task start checkpoint rather than pretending the next task began from the older output;
9. reject the next task start if **any commit** between the prior repository comparison anchor and that task start touched implementation scope, including changes that were later reverted;
10. do not roll the workflow back merely because the approved task changed the repository.

For Express, the same lineage semantics apply even though the narrative evidence is consolidated in `WORKPACK.md`. A second independent next task requires an upgrade.

When the output is deployed for validation:

1. create a `SRC-RUN-*` record with role Validation runtime;
2. connect it to the implementation repository snapshot through the runtime parent;
3. record environment differences and capture conditions.

Expected outputs require lineage and validation, not an upstream rebaseline impact assessment.

## Detecting changes

Before a stage or consolidated checkpoint, after a meaningful pause, before a task, and before final acceptance:

1. compare available source identity with the referenced snapshot;
2. classify the difference as unchanged, expected workflow output, or unexpected upstream/concurrent change;
3. record the check in the active control record;
4. do not silently use newer content under an older ID.

For Time-bound sources, a new inspection time alone does not require rebasing when relevant content is demonstrably unchanged. Record the method.

Unexpected concurrent repository changes within task scope require impact assessment. Approved commits produced by the workflow do not.

## Rebaseline protocol

Use this protocol when a material upstream input changes unexpectedly or an approved source revision is intentionally replaced:

1. create a new snapshot ID;
2. preserve the previous record and mark it Superseded when appropriate;
3. record reason, detected changes, and effective date;
4. perform an impact assessment across artifacts or workpack sections;
5. identify the earliest affected stage;
6. move the active control state back when correction is required;
7. update affected artifacts or sections only after review;
8. preserve stable requirement, design, specification, architecture, plan, and task IDs unless genuinely replaced;
9. record superseded decisions and changed criteria;
10. rerun required gates.

Never edit an existing snapshot ID to point silently to different content.

## Impact assessment

| New snapshot | Previous snapshot | Change summary | Affected artifacts or sections | Earliest affected stage | Action | Status |
|---|---|---|---|---:|---|---|
| `SRC-DS-002` | `SRC-DS-001` | ... | Design evidence, design intent, specification | 1 | Re-audit affected nodes | Open |

A change does not require rewriting unaffected artifacts or sections. Record why an area is unaffected when not obvious.

A rebaseline that expands Express beyond one coherent result is also a profile-upgrade trigger.

## Final baseline integrity check

Before final acceptance, verify:

- every referenced snapshot ID exists in the active baseline owner;
- no artifact or workpack section silently depends on newer input content;
- the original repository input baseline is identified;
- every implemented task identifies the repository snapshot from which it actually started;
- each current Task start checkpoint is immutable, committed, parented to an executable repository anchor, and attributed reciprocally to its task;
- superseded task-start attempts remain visible as Historical references rather than being repointed or deleted;
- the implementation commit is a pinned `SRC-REPO-*` Implementation output parented to that Task start snapshot;
- every Implementation output and producing task reference each other consistently;
- the latest output pointer references an Active output produced by a Complete task;
- the pinned Implementation output excludes workflow-managed files;
- the validation runtime is a pinned `SRC-RUN-*` snapshot tied to that output when applicable;
- unexpected input changes received impact assessment;
- expected task outputs have complete lineage;
- superseded artifacts, sections, or decisions remain visible;
- unavailable captures are documented honestly.

An implementation must not be described as matching “the design” without identifying which design snapshot was used.
