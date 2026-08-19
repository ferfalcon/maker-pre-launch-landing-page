# Documentation Review Template

Use this template to create a project-specific `DOCUMENT-REVIEW.md`. Correct problems in the owning document, then record the finding and resolution here.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: DOCUMENT-REVIEW
status: In progress
baseline:
  design:
    - SRC-DS-001
  repository: []
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

# Documentation Review

## 1. Document Information

- Status: In progress
- Review date: YYYY-MM-DD
- Reviewer:
- Project:
- Source baseline: `SOURCE-BASELINE.md`
- Reviewed artifact versions or commits:

## 2. Review Scope

Reviewed sources and artifacts:

- Active `SRC-*` snapshots
- `DESIGN-AUDIT.md`
- `REQUIREMENTS.md`
- `DESIGN.md`
- `SPEC.md`
- Other authoritative project documentation

Excluded sources or areas:

- ...

## 3. Baseline Integrity Check

| Artifact | Snapshot IDs declared | IDs exist | Source verified | Silent newer source detected | Action |
|---|---|---|---|---|---|
| ... | ... | Yes / No | Verified / Changed / Unavailable | Yes / No / Unknown | ... |

Do not review artifacts as one coherent set when they unknowingly use different source revisions.

## 4. Review Method

### Pass 1 — Completeness and correctness

Check each document against its responsibility and pinned source evidence.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

Check relationships after first-pass corrections. Verify baseline alignment and complete traceability without unsupported behavior.

## 5. Executive Summary

Summarize overall quality, source integrity, findings, blocking decisions, corrections, and remaining uncertainty.

## 6. Source-of-Truth Rules

| Decision type | Owning document |
|---|---|
| Source identity, revision, and pin strength | `SOURCE-BASELINE.md` |
| Product outcome, rule, constraint, or quality expectation | `REQUIREMENTS.md` |
| Visual, responsive, or interaction intent | `DESIGN.md` |
| Precise and testable behavior | `SPEC.md` |
| Structural technical decision | `ARCHITECTURE.md`, when applicable |
| Implementation order and file impact | `PLAN.md` |

Do not resolve stakeholder or source-version decisions through guesswork.

## 7. Coverage Overview

| Requirement ID | Snapshot or evidence | Design support | Specification support | Coverage status | Notes |
|---|---|---|---|---|---|
| ... | ... | ... | ... | Complete / Partial / Missing / N/A | ... |

## 8. Findings

### DOC-001 — Finding title

- **Severity:** Critical / High / Medium / Low
- **Category:** Source baseline / Contradiction / Missing coverage / Unsupported behavior / Untestable language / Responsive / Accessibility / State / Content / Data / Traceability / Assumption / Other
- **Blocking:** Yes / No
- **Finding:**
- **Snapshot and evidence:**
- **Affected documents:**
- **Decision owner:**
- **Resolution:**
- **Changes applied:**
- **Remaining uncertainty:**
- **Status:** Open / Corrected / Accepted deviation / Blocked

Repeat for each finding.

## 9. Traceability and Source Problems

| Finding ID | Source item | Missing, stale, or incorrect link | Required correction | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 10. Open Questions and Decisions

| Question ID | Question | Decision owner | Impact | Blocking | Needed by |
|---|---|---|---|---|---|
| ... | ... | ... | ... | Yes / No | ... |

## 11. Corrections Applied

| Document | Change summary | Findings resolved | Validation performed |
|---|---|---|---|
| ... | ... | ... | ... |

## 12. Remaining Risks

| Risk | Impact | Likelihood | Mitigation | Blocking |
|---|---|---|---|---|
| ... | ... | ... | ... | Yes / No |

## 13. Final Cross-Document Review

### Completeness and correctness

- [ ] Every must-have requirement has specification coverage.
- [ ] Design decisions support relevant requirements.
- [ ] Applicable states, edge cases, responsive behavior, accessibility, validation, errors, and content are covered.
- [ ] Requirements and specifications are objectively testable.
- [ ] Every artifact declares valid snapshot IDs.

### Consistency, traceability, source integrity, risks, and uncertainty

- [ ] IDs and cross-references are valid.
- [ ] Artifacts use a compatible baseline or document justified differences.
- [ ] No artifact silently relies on newer source content.
- [ ] No specification behavior lacks requirement or design support.
- [ ] No inference or recommendation is presented as confirmed.
- [ ] Corrections were made in the owning document.
- [ ] Remaining uncertainty and blockers are visible.
- [ ] A second review was performed after corrections.

## 14. Completion Status

Select exactly one:

- `Ready for architecture and planning`
- `Ready with documented non-blocking assumptions`
- `Blocked by unresolved decisions`

## 15. Completion Summary

- Files created or modified:
- Snapshot IDs reviewed:
- Source verification performed:
- Important findings:
- Assumptions introduced:
- Open questions or blockers:
- Recommended next stage:

<!-- artifact:end -->
