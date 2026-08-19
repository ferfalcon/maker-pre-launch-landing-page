# Plan Review Template

Use this template to create a project-specific `PLAN-REVIEW.md`. Correct `PLAN.md` directly when evidence supports a change, then record the finding and residual risk here.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: PLAN-REVIEW
status: In progress
baseline:
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime: []
  documentation:
    - SRC-DOC-001
  assets: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Plan Review

## 1. Document Information

- Status: In progress
- Review date: YYYY-MM-DD
- Reviewer:
- Project:
- Source baseline: `SOURCE-BASELINE.md`
- Reviewed `PLAN.md` version or commit:

## 2. Review Sources

- `PLAN.md`
- `REQUIREMENTS.md`
- `DESIGN.md`
- `SPEC.md`
- `ARCHITECTURE.md`, when applicable
- `DOCUMENT-REVIEW.md`
- Active `SRC-*` snapshots
- Other relevant technical sources

## 3. Baseline Integrity and Repository Assumption Check

| Plan claim | Snapshot and repository evidence | Accurate at pinned commit | Newer source detected | Required correction |
|---|---|---|---|---|
| Existing path, script, dependency, pattern, or capability | `SRC-REPO-*` | Yes / No / Unconfirmed | Yes / No / Unknown | ... |

Do not allow proposed files, branch-head changes, or later design revisions to be described as part of the pinned baseline.

## 4. Review Method

### Pass 1 — Feasibility and completeness

Challenge snapshot validity, repository assumptions, technical approach, scope, ordering, dependencies, task size, integration, migration, and validation.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

Review the corrected plan against upstream artifacts and pinned sources. Verify complete requirement coverage without unsupported work.

## 5. Executive Summary

Summarize feasibility, source integrity, major corrections, blockers, residual risks, and readiness.

## 6. Plan Coverage

| Requirement or specification | Snapshot or evidence | Plan item | Coverage | Validation defined | Notes |
|---|---|---|---|---|---|
| ... | ... | ... | Complete / Partial / Missing / N/A | Yes / No | ... |

## 7. Findings

### PLANREV-001 — Finding title

- **Impact:** Critical / High / Medium / Low
- **Category:** Source baseline / Scope / Repository assumption / Dependency / Ordering / Task size / Integration / Migration / State / Responsive / Accessibility / Validation / Regression / Abstraction / Security / Privacy / Deployment / Rollback / Traceability / Other
- **Finding:**
- **Snapshot and evidence:**
- **Plan section:**
- **Resolution:**
- **Change made to `PLAN.md`:**
- **Remaining risk:**
- **Status:** Open / Corrected / Accepted risk / Blocked

Repeat for each finding.

## 8. Ordering and Dependency Review

| Plan item | Depends on | Dependency supported | Ordering issue | Resolution |
|---|---|---|---|---|
| ... | ... | Yes / No / Unclear | ... | ... |

## 9. Integration and Cross-Cutting Coverage

| Concern | Covered in plan | Location | Gap or correction |
|---|---|---|---|
| Source verification and rebaseline | Yes / No / N/A | ... | ... |
| Accessibility | Yes / No / N/A | ... | ... |
| Responsive behavior | Yes / No / N/A | ... | ... |
| Loading, empty, error, and success states | Yes / No / N/A | ... | ... |
| Data and API integration | Yes / No / N/A | ... | ... |
| Migration and compatibility | Yes / No / N/A | ... | ... |
| Security and privacy | Yes / No / N/A | ... | ... |
| Testing and validation | Yes / No / N/A | ... | ... |
| Deployment and rollback | Yes / No / N/A | ... | ... |
| Regression protection | Yes / No / N/A | ... | ... |

## 10. Changes Applied to the Plan

| `PLAN.md` section | Change | Finding IDs | Result |
|---|---|---|---|
| ... | ... | ... | ... |

## 11. Residual Risks and Blocking Decisions

| Risk or decision | Impact | Likelihood | Mitigation or evidence needed | Owner | Status |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 12. Final Review Checklist

### Feasibility and completeness

- [ ] The plan reflects the pinned repository snapshot.
- [ ] Snapshot IDs exist and source verification was performed.
- [ ] Included and excluded scope are explicit.
- [ ] Phases produce meaningful, verifiable outcomes.
- [ ] Dependencies, ordering, integration, migration, compatibility, and validation are complete.
- [ ] Accessibility, responsiveness, states, errors, and tests are integrated.
- [ ] Rollback or recovery is addressed where relevant.

### Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Every must-have requirement and material specification is covered.
- [ ] No plan item introduces unsupported product scope.
- [ ] Proposed and existing files are distinguished.
- [ ] No plan claim silently relies on newer source content.
- [ ] Architecture decisions are respected when applicable.
- [ ] Residual risks, accepted tradeoffs, and blockers are explicit.
- [ ] The updated plan received a second end-to-end review.

## 13. Final Readiness Status

Select exactly one:

- `Ready for task decomposition`
- `Ready with documented risks`
- `Blocked by unresolved technical decisions`

## 14. Completion Summary

- Files created or modified:
- Snapshot IDs reviewed:
- Source verification performed:
- Important findings:
- Plan corrections:
- Remaining risks:
- Open questions or blockers:
- Recommended next stage:

<!-- artifact:end -->
