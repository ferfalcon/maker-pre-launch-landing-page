---
artifact: TASK
id: P02-T01
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime: []
  documentation:
    - SRC-DOC-001
  assets: []
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

The repository snapshot in metadata is the task-start state. Record the Implementation output snapshot after the task is committed.

# Phase 02 — Task 01: Implement responsive Hero and Benefits



## 2. Objective

Describe the single concrete result this task must produce.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`
- Design inputs: `SRC-DS-*`
- Task-start repository snapshot: `SRC-REPO-*`
- Supporting runtime inputs: `SRC-RUN-*` / None
- Documentation inputs: `SRC-DOC-*` / None
- Asset inputs: `SRC-ASSET-*` / None
- `PLAN.md`:
- `PLAN-REVIEW.md`:
- Requirement IDs:
- Specification IDs or sections:
- `DESIGN.md` references:
- Design-source evidence:
- `ARCHITECTURE.md` references, when applicable:
- Related tasks:

## 4. Snapshot Verification

Complete before implementation begins.

- Verification date and method:
- Design inputs applicable: Yes / No / Unverified
- Task-start repository commit checked out: Yes / No / Unverified
- Difference classification: Unchanged / Expected previous-task output / Unexpected concurrent change / Unavailable
- Upstream rebaseline required: Yes / No
- Action or limitation:

An approved previous-task output may become this task's start snapshot without reopening upstream stages. Do not begin affected implementation when an unexpected material change remains unresolved.

## 5. Prerequisites

List tasks, repository conditions, assets, decisions, access requirements, and required snapshot verification.

- ...

Use `None` when no prerequisite exists.

## 6. Scope

### Included

- Work required to produce the objective
- Relevant accessibility, responsive, state, error, and testing work

### Excluded

- Nearby work assigned to other tasks
- Deferred or unapproved capabilities
- Unrelated refactoring

## 7. Repository Context

Record current state at the task-start `SRC-REPO-*` commit:

- Existing files and modules
- Established patterns and conventions
- Reusable components, utilities, tokens, or tests
- Confirmed scripts and commands
- Constraints or technical debt

Distinguish observed paths from proposed paths and unrelated later changes.

## 8. Files and Modules

| Path | Action | Existing or proposed | Responsibility | Repository evidence |
|---|---|---|---|---|
| `path/to/file` | Create / Modify / Delete | Existing / Proposed | ... | task-start `SRC-REPO-*` |

## 9. Dependencies and Interfaces

Document module and task dependencies, public interfaces, data or component contracts, compatibility requirements, and downstream effects.

## 10. Implementation Steps

1. Verify input and task-start snapshots.
2. Inspect affected files and confirm repository assumptions.
3. ...
4. Update relevant tests and documentation.
5. Run required validation.
6. Commit the approved result and create an Implementation output `SRC-REPO-*` record.

Do not include implementation code during task decomposition.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Default:
- Loading:
- Empty:
- Error:
- Success:
- Disabled or unavailable:
- Other:

### Responsive behavior

- Small viewports:
- Intermediate widths:
- Large viewports:
- Content and overflow edge cases:

### Accessibility

- Semantic structure:
- Keyboard interaction:
- Focus behavior:
- Accessible names and relationships:
- Announcements:
- Contrast, reflow, touch targets, or reduced motion:

Use `Not applicable` only with a reason.

## 12. Validation

List only commands and checks supported by the task-start repository snapshot.

### Automated validation

- Unit tests:
- Component or integration tests:
- End-to-end tests:
- Type checking:
- Linting:
- Build:
- Other:

### Manual validation

- Interaction checks:
- Responsive checks:
- Accessibility checks:
- Visual comparison against `SRC-DS-*`:
- Error and edge-case checks:
- Regression checks:

For each check, define the expected result. Do not claim a check passed until it ran successfully.

## 13. Acceptance Criteria

- [ ] `[Requirement or specification ID]` Objective result is observable and correct.
- [ ] Required accessibility behavior is verified.
- [ ] Required responsive and state behavior is verified.
- [ ] Relevant automated and manual validation passes.
- [ ] Snapshot verification or approved upstream rebaseline is complete.
- [ ] The committed result has an Implementation output snapshot.
- [ ] Documentation and task status are updated.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| ... | ... | ... |

## 15. Implementation Discoveries

| Discovery | Impact | Owning artifact | Required update |
|---|---|---|---|
| ... | ... | `SOURCE-BASELINE.md` / `REQUIREMENTS.md` / `DESIGN.md` / `SPEC.md` / `ARCHITECTURE.md` / `PLAN.md` / Task | ... |

Do not silently work around documentation or source-baseline errors.

## 16. Deviations

| Planned approach or baseline | Actual approach or baseline | Reason | Approval or evidence | Impact |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

Use `None` when implementation followed the task exactly.



## 18. Definition of Done

- [ ] The objective is implemented within scope.
- [ ] Acceptance criteria pass.
- [ ] Required validation executed successfully.
- [ ] No required validation remains failing or unverified.
- [ ] Input snapshot references remain valid or an approved upstream rebaseline was completed.
- [ ] The implementation output snapshot and parent lineage are recorded.
- [ ] Relevant documentation was updated.
- [ ] `TASKS-INDEX.md` and `WORKFLOW-STATE.md` reflect current status and lineage.
- [ ] Deviations and remaining risks are recorded.
- [ ] Downstream tasks have the information they need.

## 19. Completion Report

- Files created, modified, or deleted:
- Input snapshot IDs used:
- Task-start repository snapshot:
- Implementation-output repository snapshot:
- Source verification performed:
- Behavior implemented:
- Validation executed:
- Validation results:
- Deviations:
- Remaining risks:
- Documentation updated:
- Next unblocked task:
