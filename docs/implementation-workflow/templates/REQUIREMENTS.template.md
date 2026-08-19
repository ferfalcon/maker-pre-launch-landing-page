# Requirements Template

Use with [`../guidelines/REQUIREMENTS.md`](../guidelines/REQUIREMENTS.md). Follow [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md). Remove non-applicable sections without removing material project concerns.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: REQUIREMENTS
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

# Project Requirements

## 1. Document Information

- Status: Draft
- Scope:
- Last updated:
- Owners:
- Project context: `PROJECT-CONTEXT.md`
- Source baseline: `SOURCE-BASELINE.md`
- Evidence baseline: `DESIGN-AUDIT.md`

## 2. Overview and Problem

Describe the project, the problem, and the intended outcome.

## 3. Goals and Non-goals

### Goals

- ...

### Non-goals

- ...

## 4. Users and Needs

| User or actor | Need | Evidence or snapshot |
|---|---|---|
| ... | ... | `EVD-*` / `SRC-DOC-*` |

## 5. Functional Requirements

### REQ-FR-001 — Requirement title

- **Classification:** Confirmed / Inferred / Recommended
- **Priority:** Must / Should / Could
- **Description:**
- **Rationale:**
- **Evidence:** `EVD-*` or `SRC-DOC-*`
- **Acceptance criteria:** `AC-*`

Repeat as required.

## 6. Business Rules

### REQ-BR-001 — Rule title

- **Description:**
- **Evidence:**
- **Affected requirements:**

## 7. Data Requirements

### REQ-DR-001 — Data requirement title

- **Description:**
- **Required and optional data:**
- **Validation or ownership:**
- **Privacy or retention evidence:**

## 8. Accessibility Requirements

### REQ-AR-001 — Accessibility requirement title

- **Description:**
- **Rationale:**
- **Evidence or standard:**
- **Acceptance criteria:**

## 9. Other Non-functional Requirements

### REQ-NFR-001 — Quality requirement title

- **Category:** Performance / Reliability / Compatibility / Maintainability / SEO / Other
- **Description:**
- **Measurement conditions:**
- **Evidence:**

Do not invent thresholds.

## 10. Security Requirements

### REQ-SEC-001 — Security requirement title

- **Description:**
- **Evidence:**
- **Affected boundaries:**

## 11. Responsive and Content Requirements

Record outcome-level expectations without choosing arbitrary breakpoints or implementation patterns.

- ...

## 12. Constraints

### REQ-CON-001 — Constraint title

- **Description:**
- **Evidence:**
- **Impact:**

## 13. Dependencies

| Dependency | Snapshot or evidence | Purpose | Availability | Risk |
|---|---|---|---|---|
| ... | `SRC-*` | ... | ... | ... |

## 14. Assumptions and Open Questions

### Assumptions

- ...

### Blocking questions

- ...

### Non-blocking questions

- ...

## 15. Risks

| Risk | Impact | Likelihood | Mitigation | Blocking |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 16. Definition of Done

- [ ] All must-have requirements and acceptance criteria pass.
- [ ] Accessibility and responsive requirements are verified.
- [ ] Required validation is executed successfully.
- [ ] Approved documentation is synchronized.
- [ ] No critical or high-severity blocker remains.

## 17. Traceability

| Requirement | Snapshot or evidence | Design decision | Specification | Validation |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 18. Review

### Pass 1 — Completeness and correctness

- [ ] Requirements cover the agreed scope.
- [ ] Requirements are necessary, specific, testable, and prioritized.
- [ ] Unsupported business, security, retention, browser, or performance rules were not invented.
- [ ] Snapshot IDs in metadata exist and were actually used.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Identifiers follow `Identifier-Conventions.md`.
- [ ] Every material requirement has evidence from a pinned snapshot.
- [ ] No source changed silently after the artifact baseline was recorded.
- [ ] Confirmed, inferred, recommended, and open information remain distinct.
- [ ] Blocking questions are visible.

<!-- artifact:end -->
