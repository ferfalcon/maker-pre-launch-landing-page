---
artifact: WORKFLOW-STATE
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
created: 2026-08-19
updated: 2026-08-19
---

# Workflow State

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
