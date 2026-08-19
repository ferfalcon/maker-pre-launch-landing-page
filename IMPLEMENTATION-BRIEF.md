---
artifact: IMPLEMENTATION-BRIEF
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime: []
  documentation: []
  assets: []
created: 2026-08-19
updated: 2026-08-19
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

# Implementation Brief

## 1. Document Information

- Scope:
- Last updated:
- Project context: `PROJECT-CONTEXT.md`
- Source baseline: `SOURCE-BASELINE.md`
- Evidence baseline: `DESIGN-AUDIT.md`
- Repository snapshot: `SRC-REPO-*`

## 2. Requirements

### Goals and non-goals

- ...

### REQ-FR-001 — Requirement title

- Classification:
- Priority:
- Description:
- Snapshot or evidence:
- Acceptance criteria:

Record applicable `REQ-AR-*`, `REQ-NFR-*`, `REQ-CON-*`, and other requirement types separately.

## 3. Design Intent

### DES-001 — Design decision title

- Classification:
- Intent:
- Snapshot and evidence:
- Requirement references:

### Responsive and interaction intent

Use `DES-RWD-*` and `DES-INT-*` identifiers. Document supplied viewport evidence, behavior between examples, states, content edge cases, and accessibility intent from the pinned design snapshots.

## 4. Specification

### SPEC-BEH-001 — Behavior title

- Requirement and design references:
- Source snapshots:
- Observable behavior:
- States and edge cases:
- Acceptance criteria: `AC-*`

Record applicable `SPEC-INT-*`, `SPEC-ACC-*`, `SPEC-VAL-*`, and `SPEC-DATA-*` items separately.

Do not invent arbitrary breakpoints, focus behavior, thresholds, or unsupported business rules.

## 5. Repository Context

- Repository snapshot: `SRC-REPO-*`
- Existing files and conventions:
- Reusable components, tokens, utilities, and tests:
- Confirmed commands:
- Constraints and technical debt:

Distinguish observed paths from proposed paths and do not rely on branch changes outside the pinned commit.

## 6. Implementation Plan

### PLAN-001 — Plan item title

- Objective:
- Requirement and specification references:
- Source snapshots:
- Files and modules:
- Dependencies:
- Implementation steps:
- Integrated accessibility, responsive, state, error, and test work:
- Validation:

Do not create a separate late accessibility implementation phase.

## 7. Architecture Decision

- Separate architecture needed: Yes / No
- Reason:

If the work requires meaningful routing, shared state, persistence, authentication, integrations, deployment, security, privacy, or migration decisions, upgrade to Standard or Full rather than overloading this brief.

## 8. Source-change Handling

- Snapshot verification required before task execution:
- Material changes that invalidate this brief:
- Earliest workflow section or stage to revisit:

Create new `SRC-*` IDs and perform an impact assessment rather than silently updating this brief to newer sources.

## 9. Risks, Assumptions, and Questions

### Blocking

- ...

### Non-blocking

- ...

## 10. Traceability

| Snapshot or evidence | Requirement | Design | Specification or criterion | Plan item | Validation |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 11. Review Pass 1 — Completeness and Correctness

- [ ] Scope and pinned repository context are accurate.
- [ ] Snapshot IDs exist and were actually used.
- [ ] Requirements, design intent, testable behavior, and implementation planning are complete for the Lite scope.
- [ ] Responsive, accessibility, states, errors, content edge cases, and validation are integrated.
- [ ] The work still qualifies for Lite.

## 12. Corrections from Pass 1

- ...

## 13. Review Pass 2 — Consistency, Traceability, Source Integrity, Risks, and Uncertainty

- [ ] Ownership sections and identifiers remain distinct.
- [ ] Every material plan item maps to approved requirements or specifications and pinned sources.
- [ ] No source changed silently after the brief baseline was recorded.
- [ ] No unsupported scope or assumption is presented as confirmed.
- [ ] Blocking questions are visible.
- [ ] Corrections from the first pass were included before this review.

## 14. Readiness

Select exactly one:

- `Ready for task decomposition`
- `Ready with documented non-blocking assumptions`
- `Blocked by unresolved decisions`
