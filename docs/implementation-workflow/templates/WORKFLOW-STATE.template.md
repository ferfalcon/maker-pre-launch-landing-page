# Workflow State Template

Use this file for workflow-control information that cannot be derived from the machine-readable record: blockers, assumptions, decisions, verification history, exceptions, and completion narrative.

Follow [`../workflow/State-Ownership.md`](../workflow/State-Ownership.md).

When `.workflow/workflow-record.json` exists, do not manually repeat its current profile, mode, stage, status, active inputs, current task, latest output, artifact statuses, or task statuses here. Use the generated views instead.

<!-- artifact:start -->

```yaml
---
artifact: WORKFLOW-STATE
project: Project name
profile: Lite | Standard | Full
execution_mode: Gated | Continuous documentation | Task-by-task
status: Draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->

# Workflow State

## 1. State Ownership Mode

Choose one mode for the project:

- [ ] **CLI-managed:** `.workflow/workflow-record.json` is canonical for mutable operational state.
- [ ] **Markdown-only:** this file and the related Markdown artifacts are canonical because no workflow record is used.

### CLI-managed generated views

- Current status: `.workflow/generated/WORKFLOW-STATUS.md`
- Source registry and lineage: `.workflow/generated/SOURCE-INDEX.md`
- Artifact inventory: `.workflow/generated/ARTIFACT-INDEX.md`
- Task status and dependencies: `.workflow/generated/TASK-INDEX.md`
- Canonical domain graph and coverage: `.workflow/generated/TRACEABILITY.md`

Run:

```bash
design-workflow sync --check
```

Do not edit generated files manually.

## 2. Blocking Questions

| ID | Question | Decision owner | Impact | Required before | Status |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | Open / Resolved / Blocked |

## 3. Non-blocking Assumptions

| Assumption | Classification | Impact | Validation or correction point | Status |
|---|---|---|---|---|
| ... | Inferred / Recommended | ... | ... | Open / Confirmed / Rejected |

## 4. Architecture Decision

- Separate `ARCHITECTURE.md`: Required / Not required / Undecided
- Reason:
- Evidence and constraints:
- Recorded by:

When architecture is skipped, place behavioral structural constraints in `SPEC.md` and repository or implementation structure in `PLAN.md`, or in their clearly separated Lite brief sections.

## 5. Source Verification, Outputs, and Rebaseline History

Record narrative history and impact here. Current snapshot status and lineage belong in the workflow record when CLI-managed mode is active.

| Date | Classification | Previous snapshot | New snapshot | Change or result | Affected stage or task | Action | Status |
|---|---|---|---|---|---|---|---|
| ... | Unchanged / Expected output / Unexpected upstream change / Unavailable | ... | ... | ... | ... | ... | Open / In progress / Complete |

Expected task outputs update lineage without rolling back upstream stages. Unexpected material input or concurrent changes require impact assessment in `SOURCE-BASELINE.md` and may move the workflow backward.

## 6. Profile or Mode Change History

The current profile and mode belong in the workflow record in CLI-managed mode. Record only the decision history here.

| Date | Previous | New | Reason | Effective stage | Decision owner |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 7. Exceptions and Deviations

| ID | Expected process or behavior | Deviation | Reason | Impact | Approval or resolution | Status |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | Open / Accepted / Corrected |

## 8. Stage Advancement Rules

- Verify relevant input and task-start snapshots before a stage, after a meaningful pause, before a task, and before final acceptance.
- Classify differences as Unchanged, Expected output, Unexpected upstream change, or Unavailable.
- Do not silently use newer source content under an older snapshot ID.
- Approved implementation outputs advance task lineage and do not automatically invalidate upstream artifacts.
- Unexpected upstream or concurrent changes must follow rebaseline impact assessment.
- Do not advance while the current stage has a blocking exit status.
- In Gated mode, advance only after an explicit user request or approval.
- In Continuous documentation mode, stop before implementation.
- In Task-by-task mode, select only an incomplete task whose prerequisites are satisfied.
- Do not treat silence as approval for unresolved product, design, source, or architecture decisions.
- Do not bypass a blocked stage through unsupported assumptions.
- In CLI-managed mode, update operational state through the CLI and keep generated views synchronized.

## 9. Latest Completion Summary

- Files created or modified:
- Input snapshot IDs used:
- Task-start snapshot:
- Implementation-output snapshot:
- Validation-runtime snapshot:
- Source verification performed:
- Important findings:
- Decisions:
- Validation performed:
- Deviations:
- Remaining risks:
- Next permitted action:

Do not use this narrative summary as a second mutable status registry.

<!-- control:markdown-only:start -->

---

# Markdown-only Fallback

Complete this appendix only when the project does not use `.workflow/workflow-record.json`.

## F1. Current Control State

- Profile: Express / Lite / Standard / Full
- Execution mode: Gated / Continuous documentation / Task-by-task
- Current stage:
- Current status: Not started / In progress / Ready / Blocked / Complete
- Last updated:
- Last completed action:
- Next permitted action:

## F2. Active Input Baseline

- Source baseline: `SOURCE-BASELINE.md`
- Design inputs: `SRC-DS-*` / None
- Repository input baseline: `SRC-REPO-*` / None
- Documentation inputs: `SRC-DOC-*` / None
- Asset inputs: `SRC-ASSET-*` / None
- Supporting runtime inputs: `SRC-RUN-*` / None
- Last input verification date and method:
- Input baseline status: Verified / Changed / Partially verified / Unverified

## F3. Implementation and Validation Lineage

- Current task-start repository snapshot: `SRC-REPO-*` / None
- Latest approved implementation-output snapshot: `SRC-REPO-*` / None
- Current validation-runtime snapshot: `SRC-RUN-*` / None
- Last completed task: task ID / None
- Lineage status: Complete / In progress / Broken / Unverified

## F4. Stage Registry

| Stage | Purpose | Artifact or result | Status | Exit result |
|---:|---|---|---|---|
| 0 | Establish context, snapshots, and control | Stage 0 artifacts | ... | ... |
| 1 | Audit pinned design evidence | `DESIGN-AUDIT.md` | ... | ... |
| 2 | Define requirements | `REQUIREMENTS.md` or consolidated section | ... | ... |
| 3 | Document design intent | `DESIGN.md` or consolidated section | ... | ... |
| 4 | Define testable behavior | `SPEC.md` or consolidated section | ... | ... |
| 5 | Review documentation | Review artifact or consolidated review | ... | ... |
| 6 | Define architecture when applicable | `ARCHITECTURE.md` or recorded skip | ... | ... |
| 7 | Plan implementation | `PLAN.md` or consolidated section | ... | ... |
| 8 | Review the plan | `PLAN-REVIEW.md` or consolidated review | ... | ... |
| 9 | Decompose tasks | Task file(s) and index | ... | ... |
| 10 | Implement tasks and record output lineage | Code and task records | ... | ... |
| 11 | Validate implementation | `IMPLEMENTATION-REVIEW.md` | ... | ... |

## F5. Artifact Registry

| Artifact | Status | Version, commit, or date | Baseline snapshot IDs | Approved by or evidence |
|---|---|---|---|---|
| ... | Draft / Reviewed / Approved / Superseded | ... | ... | ... |

<!-- control:markdown-only:end -->

<!-- artifact:end -->
