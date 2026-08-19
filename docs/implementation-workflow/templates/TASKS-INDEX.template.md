# Tasks Index Template

Use this template to create `TASKS-INDEX.md` for phase rationale, plan coverage, coordination, blockers, and cross-cutting implementation coverage.

Follow [`../workflow/State-Ownership.md`](../workflow/State-Ownership.md).

When `.workflow/workflow-record.json` exists, task IDs, status, prerequisites, baseline, references, output, and validation-state summaries belong in the record and `.workflow/generated/TASK-INDEX.md`. Do not maintain a second mutable task registry here.

<!-- artifact:start -->

```yaml
---
artifact: TASKS-INDEX
status: Draft
baseline:
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Tasks Index

## 1. State Ownership Mode

- [ ] CLI-managed — task registry: `.workflow/generated/TASK-INDEX.md`
- [ ] Markdown-only — complete the fallback registry in Appendix A

Run `design-workflow sync --check` before relying on generated task state.

## 2. Document Information

- Status: Draft
- Version: 0.1
- Last updated: YYYY-MM-DD
- Project:
- Source plan:
- Plan review:
- Architecture document, when applicable:

## 3. Scope

### Included

- Implementation work represented by this task set
- Validation and documentation work required for completion

### Excluded

- Deferred or future work
- Work not approved by requirements or plan

## 4. Execution Rules

- Execute only tasks whose prerequisites are satisfied.
- Verify relevant task snapshots before implementation when sources may have changed.
- Do not silently update tasks to newer source content under existing snapshot IDs.
- When a material source changes, pause affected tasks and follow the rebaseline protocol.
- Do not mark a task complete while required validation fails or remains unverified.
- Do not silently add work unsupported by `PLAN.md`.
- Update upstream artifacts when implementation exposes a documentation error.
- Integrate accessibility, responsive behavior, error handling, and tests into feature tasks.
- In CLI-managed mode, update task state through the CLI rather than editing copied status tables.

## 5. Phase Summary

Phase-level intent is not generated because phases may contain rationale and coordination beyond the task graph.

| Phase | Objective | Depends on | Parallel work | Completion criteria |
|---|---|---|---|---|
| Phase 01 | ... | None | ... | ... |

## 6. Phase Details

For each phase, document objective, entry criteria, ordered task intent, parallelization constraints, and completion criteria. Reference stable task IDs without copying their mutable state.

## 7. Plan Coverage

| `PLAN.md` item | Task or tasks | Coverage status | Notes |
|---|---|---|---|
| ... | ... | Complete / Partial / Missing | ... |

## 8. Requirement and Specification Coverage

| Requirement or specification | Priority | Task or tasks | Validation task | Coverage status |
|---|---|---|---|---|
| ... | Must / Should / Could | ... | ... | Complete / Partial / Missing / N/A |

## 9. Cross-Cutting Coverage

| Concern | Integrated tasks | Final validation | Gap |
|---|---|---|---|
| Source verification and rebaseline | ... | ... | ... |
| Accessibility | ... | ... | ... |
| Responsive behavior | ... | ... | ... |
| Loading, empty, error, and success states | ... | ... | ... |
| Security and privacy | ... | ... | ... |
| Performance | ... | ... | ... |
| Documentation | ... | ... | ... |
| Regression protection | ... | ... | ... |

## 10. Blocked Work and Coordination Risks

The task record owns task status. This section owns blocker detail and coordination context.

| Task | Blocker or coordination risk | Decision owner | Required action | Impact | Status |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | Open / Resolved |

## 11. Source-change Log

| Date | Changed snapshot | Affected tasks | Impact and action | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | Open / In progress / Complete |

## 12. Overall Completion Criteria

- [ ] Every task is complete in the canonical task registry.
- [ ] Every task's required validation passed or was explicitly not applicable.
- [ ] Every must-have requirement and material specification is covered.
- [ ] Task snapshot references remain valid or were rebased and reviewed.
- [ ] Documentation changes discovered during implementation were propagated.
- [ ] No critical or high-severity blocker remains.
- [ ] Final implementation validation is ready to begin.

## 13. Index Validation

### Review pass 1 — Completeness and correctness

- [ ] Every plan item maps to at least one task.
- [ ] Every task has one coherent, independently verifiable result.
- [ ] Generated task state is current in CLI-managed mode.
- [ ] Task IDs referenced here exist in the canonical registry.
- [ ] Phase criteria and coverage tables are complete.

### Review pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Requirement and specification references are valid.
- [ ] Task baselines match the approved plan or document justified rebaselines.
- [ ] Parallel tasks do not modify overlapping responsibilities without coordination.
- [ ] Cross-cutting concerns are not deferred entirely to final cleanup.
- [ ] Blockers and unresolved decisions are visible without copying task status.
- [ ] No task introduces unsupported scope or silently newer source content.

<!-- control:markdown-only:start -->

---

# Appendix A — Markdown-only Task Registry

Complete this appendix only when the project does not use `.workflow/workflow-record.json`.

## A1. Status Vocabulary

- `Not started`
- `Blocked`
- `In progress`
- `Ready`
- `Complete`

## A2. Task Registry

| Task ID | File | Title | Status | Depends on | Baseline snapshots | References | Output | Validation summary |
|---|---|---|---|---|---|---|---|---|
| P01-T01 | `Phase-01--Task-01.md` | ... | Not started | None | `SRC-DS-001`, `SRC-REPO-001` | ... | None | ... |

## A3. Dependency Map

```text
P01-T01 → P01-T02 → P02-T01
                  ↘ P02-T02
```

<!-- control:markdown-only:end -->

<!-- artifact:end -->
