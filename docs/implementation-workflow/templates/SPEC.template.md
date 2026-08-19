# Specification Template

Use with [`../guidelines/SPEC.md`](../guidelines/SPEC.md) and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md) to define precise, observable, testable behavior without prescribing unsupported repository structure.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: SPEC
status: Draft
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

# Specification

## 1. Document Information

- Status: Draft
- Scope:
- Last updated:
- Source baseline: `SOURCE-BASELINE.md`
- Related requirements: `REQUIREMENTS.md`
- Related design intent: `DESIGN.md`

## 2. Purpose and Scope

### Included

- ...

### Excluded

- ...

## 3. Terminology

| Term | Definition |
|---|---|
| ... | ... |

## 4. Behavioral Specifications

### SPEC-BEH-001 — Behavior title

- **Requirement references:** `REQ-*`
- **Design references:** `DES-*`
- **Source snapshots:** `SRC-*`
- **Required behavior:**
- **Applicable states:**
- **Acceptance criteria:** `AC-*`

## 5. Interaction Specifications

### SPEC-INT-001 — Interaction title

- Source snapshots and evidence:
- Trigger:
- Preconditions:
- Result:
- Keyboard behavior:
- Focus behavior:
- Closing or cancellation behavior:
- Accessible state and relationships:
- Failure behavior:

Identify the interaction pattern before defining focus management. Do not apply modal or menu behavior to a disclosure without evidence.

## 6. Responsive Specifications

Describe observable behavior at supplied viewports, between them, and beyond them.

- Design snapshot and evidence:
- Fixed versus fluid behavior:
- Wrapping, stacking, reordering, hiding, or replacement:
- Content-driven transition condition:
- Very narrow and very wide behavior:

Do not default to a familiar breakpoint number without evidence. When the exact breakpoint is an implementation decision, define the failure condition the plan must test.

## 7. State and Content Specifications

- Default:
- Hover:
- Focus:
- Active or selected:
- Disabled:
- Loading:
- Empty:
- Error:
- Success:
- Long content:
- Missing or partial content:
- Failed asset or request:

## 8. Accessibility Specifications

### SPEC-ACC-001 — Accessibility behavior title

- Source snapshot, requirement, or standard:
- Semantic structure:
- Accessible name and relationships:
- Keyboard operation:
- Focus order and visibility:
- Status or error announcements:
- Reflow, contrast, touch target, or reduced-motion behavior:
- Requirement reference: `REQ-AR-*`

## 9. Data and Interface Specifications

### SPEC-DATA-001 — Data specification title

- Source documentation snapshot: `SRC-DOC-*`
- Inputs:
- Outputs:
- Required and optional fields:
- Defaults:
- Validation ownership:
- Persistence or synchronization:
- Error conditions:

## 10. Validation and Error Specifications

### SPEC-VAL-001 — Validation title

- Condition:
- Prevented or permitted action:
- User feedback:
- Programmatic relationship or announcement:
- Recovery:

## 11. Non-functional Behavior

Reference approved performance, compatibility, security, privacy, reliability, SEO, analytics, and maintainability requirements. Do not invent thresholds.

## 12. Acceptance Criteria

### AC-001 — Criterion title

- Given:
- When:
- Then:
- Requirement or specification references:
- Source snapshots:
- Validation method:

## 13. Assumptions, Risks, and Open Questions

### Assumptions

- ...

### Risks

- ...

### Blocking questions

- ...

## 14. Traceability

| Specification | Snapshot | Requirement | Design evidence or decision | Acceptance criteria | Validation |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 15. Review

### Pass 1 — Completeness and correctness

- [ ] Material behavior, interactions, states, responsive behavior, accessibility, data, validation, errors, and edge cases are testable.
- [ ] The specification does not prescribe implementation paths or task order without a genuine constraint.
- [ ] Snapshot IDs in metadata exist and support the specified behavior.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Identifiers follow `Identifier-Conventions.md`.
- [ ] Every material specification maps to requirements and relevant pinned design or documentation evidence.
- [ ] No source changed silently after the artifact baseline was recorded.
- [ ] No arbitrary breakpoint, focus rule, threshold, or unsupported behavior is presented as confirmed.
- [ ] Open questions and assumptions remain visible.

<!-- artifact:end -->
