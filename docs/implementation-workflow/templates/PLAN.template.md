# Implementation Plan Template

Use with [`../guidelines/PLAN.md`](../guidelines/PLAN.md) and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md). Inspect the real repository before naming files, commands, dependencies, or conventions.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: PLAN
status: Draft
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

# Implementation Plan

## 1. Document Information

- Status: Draft
- Scope:
- Last updated:
- Source baseline: `SOURCE-BASELINE.md`
- Repository snapshot: `SRC-REPO-*`
- Source documents:
  - `PROJECT-CONTEXT.md`
  - `REQUIREMENTS.md`
  - `DESIGN.md`
  - `SPEC.md`
  - `ARCHITECTURE.md`, when applicable
  - `DOCUMENT-REVIEW.md`

## 2. Objective and Scope

### Included

- ...

### Excluded

- ...

## 3. Current Repository State

Document observed framework, structure, dependencies, scripts, reusable components, tokens, tests, constraints, and technical debt at the pinned `SRC-REPO-*` commit.

Distinguish existing paths from proposed paths. Do not describe branch-head changes that are absent from the referenced commit.

## 4. Technical Approach

Describe the smallest approach that satisfies approved requirements and specifications while fitting repository conventions.

- Component and module boundaries:
- Data and state flow:
- Styling and design-system integration:
- Responsive strategy:
- Accessibility strategy:
- Error and state handling:
- Testing and validation strategy:

Accessibility, responsiveness, states, errors, and tests must be integrated into the plan items that create or change the affected behavior. A later phase may verify them, but must not be where they are first implemented.

## 5. Files and Modules

| Path | Action | Existing or proposed | Responsibility | Repository evidence |
|---|---|---|---|---|
| ... | Create / Modify / Delete | ... | ... | `SRC-REPO-*` and path |

## 6. Plan Items

### PLAN-001 — Plan item title

- **Objective:**
- **Requirement and specification references:**
- **Source snapshots:**
- **File impact:**
- **Dependencies:**
- **Implementation approach:**
- **Integrated accessibility, responsive, state, and error work:**
- **Validation:**
- **Risks:**

Each item must produce a meaningful, verifiable result.

## 7. Recommended Phase Shape

Adapt phases to repository and scope. Do not use an isolated accessibility implementation phase.

### Phase 1 — Accessible foundation

- semantic structure and existing design-system integration;
- required types, tokens, and reusable primitives;
- baseline responsive constraints.

### Phase 2 — Core behavior and integration

- state, interactions, data, APIs, keyboard behavior, focus behavior, loading, validation, and errors as applicable.

### Phase 3 — Responsive, content, and edge-case completion

- intermediate-width behavior, long content, missing data or assets, failure conditions, and reduced-motion behavior.

### Phase 4 — Regression protection and final validation

- automated tests, keyboard and screen-reader review, visual comparison, responsive checks, build, lint, type checking, and regression review.

## 8. Responsive Decision Process

For each breakpoint or layout transition:

1. identify the observed design evidence and `SRC-DS-*` snapshot;
2. describe the content or layout failure condition;
3. check existing repository or design-system breakpoints at `SRC-REPO-*`;
4. select and test the narrowest justified transition;
5. record the final implementation value and rationale.

Do not default to `768px` or another familiar value without evidence.

## 9. Dependencies and Ordering

| Plan item | Depends on | May run in parallel | Reason |
|---|---|---|---|
| ... | ... | Yes / No | ... |

## 10. Architecture Handling

- Separate `ARCHITECTURE.md`: Required / Skipped
- Reason:

When architecture is skipped:

- the reason belongs in `WORKFLOW-STATE.md`;
- behavioral structural constraints remain in `SPEC.md`;
- repository and implementation structure belongs in this plan.

## 11. Migration, Compatibility, Deployment, and Rollback

Address only when applicable and supported by pinned repository, runtime, or documentation snapshots.

## 12. Source-change Handling

- Snapshot verification required before implementation:
- Material changes that would invalidate this plan:
- Earliest stage to revisit when those changes occur:

Do not update this plan to newer source content without creating new snapshot IDs and performing the rebaseline impact assessment.

## 13. Risks and Open Questions

| Risk or question | Impact | Blocking | Mitigation or owner |
|---|---|---|---|
| ... | ... | Yes / No | ... |

## 14. Definition of Done

- [ ] Every must-have requirement and material specification is covered.
- [ ] Every plan item has file impact, dependencies, and validation.
- [ ] Accessibility and responsive behavior are integrated into relevant work.
- [ ] Required tests and manual validation are identified.
- [ ] Migration, deployment, rollback, security, and privacy are addressed when applicable.
- [ ] No proposed file or convention is presented as existing.
- [ ] Snapshot IDs exist and the repository commit was verified.

## 15. Review

### Pass 1 — Feasibility and completeness

- [ ] The plan reflects the pinned repository snapshot.
- [ ] Scope, ordering, dependencies, integration, and validation are complete.
- [ ] Plan items are small enough to decompose into coherent tasks.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] `PLAN-*` identifiers follow `Identifier-Conventions.md`.
- [ ] Every plan item maps to approved requirements or specifications and relevant snapshots.
- [ ] No source changed silently after the plan baseline was recorded.
- [ ] No unsupported product scope was introduced.
- [ ] Accessibility is not deferred to cleanup.
- [ ] Architecture-skip handling is consistent.
- [ ] Risks, assumptions, and blockers remain visible.

<!-- artifact:end -->
