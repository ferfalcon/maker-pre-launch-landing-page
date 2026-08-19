# Implementation Review Template

Use this template to create `IMPLEMENTATION-REVIEW.md`. Validate the completed implementation against exact input snapshots, approved artifacts, the pinned implementation-output repository snapshot, and the runtime used for testing.

Do not report a test, build, lint, type check, accessibility check, source check, or manual review as passed unless it was executed successfully.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: IMPLEMENTATION-REVIEW
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
implementation:
  repository_snapshot: SRC-REPO-002
  runtime_snapshot: SRC-RUN-001
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Implementation Review

## 1. Document Information

- Status: In progress
- Review date: YYYY-MM-DD
- Reviewer:
- Project:
- Source baseline: `SOURCE-BASELINE.md`
- Original repository input baseline: `SRC-REPO-*`
- Implementation-output repository snapshot: `SRC-REPO-*`
- Validation-runtime snapshot: `SRC-RUN-*`
- Environment:

The implementation-output snapshot must have role Implementation output and contain the reviewed commit SHA. The runtime snapshot must identify that repository snapshot when known.

## 2. Review Scope

### Included

- Implemented features, pages, components, services, or flows
- Supported viewports, browsers, and environments
- Automated and manual validation defined by approved artifacts

### Excluded

- Deferred or future work
- Areas not changed by the implementation
- Checks that could not be executed, with reasons

## 3. Final Baseline and Lineage Integrity Check

| Check | Result | Evidence | Blocking |
|---|---|---|---|
| Every referenced `SRC-*` ID exists | Pass / Fail / Blocked | ... | Yes / No |
| Design input used by approved artifacts is identified | ... | ... | ... |
| Original repository input baseline is identified | ... | ... | ... |
| Implementation commit is pinned as an Implementation output `SRC-REPO-*` | ... | ... | ... |
| Implementation lineage reaches the input baseline without gaps | ... | ... | ... |
| Runtime used for validation is a `SRC-RUN-*` tied to the implementation output | ... | ... | ... |
| Unexpected input changes received impact assessment | ... | ... | ... |
| Expected task outputs are distinguished from upstream changes | ... | ... | ... |
| No artifact silently relies on newer input content | ... | ... | ... |
| Superseded artifacts or decisions are visible | ... | ... | ... |

An implementation must not be accepted as matching “the design” without naming the design snapshot.

## 4. Source, Artifact, and Output Baseline

| Source or artifact | Snapshot, version, or commit | Role | Status | Notes |
|---|---|---|---|---|
| Design input | `SRC-DS-*` | Input baseline | Verified / Changed / Unavailable | ... |
| Repository input | `SRC-REPO-*` | Input baseline | ... | ... |
| Implementation repository | `SRC-REPO-*` | Implementation output | ... | Contains reviewed commit |
| Validation runtime | `SRC-RUN-*` | Validation runtime | ... | Associated with implementation output |
| Product or technical documents | `SRC-DOC-*` | Input / Supporting | ... | ... |
| `DESIGN-AUDIT.md` | artifact version | ... | ... | ... |
| `REQUIREMENTS.md` | artifact version | ... | ... | ... |
| `DESIGN.md` | artifact version | ... | ... | ... |
| `SPEC.md` | artifact version | ... | ... | ... |
| `ARCHITECTURE.md`, when applicable | artifact version | ... | ... | ... |
| `PLAN.md` and `PLAN-REVIEW.md` | artifact versions | ... | ... | ... |
| Tasks | artifact versions | ... | ... | ... |

## 5. Validation Environment

Document operating system and runtime, browser and device coverage, viewports, test data or accounts, environment variables or service dependencies, accessibility tools, network or performance conditions, and known limitations.

## 6. Validation Execution Summary

| Check | Command, tool, or method | Executed | Result | Evidence |
|---|---|---|---|---|
| Source and lineage verification | ... | Yes / No | Passed / Failed / Blocked | ... |
| Build | ... | Yes / No | Passed / Failed / Blocked / N/A | ... |
| Type checking | ... | ... | ... | ... |
| Linting | ... | ... | ... | ... |
| Automated tests | ... | ... | ... | ... |
| Accessibility checks | ... | ... | ... | ... |
| Responsive review | ... | ... | ... | ... |
| Visual comparison against `SRC-DS-*` | ... | ... | ... | ... |

Explain every failed, blocked, skipped, or unavailable check.

## 7. Requirement and Specification Coverage

| Source ID | Snapshot or source expectation | Implementation evidence | Validation | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | Pass / Fail / Partial / Blocked / N/A |

Every must-have requirement and material specification must appear.

## 8. Findings

### IMPL-001 — Finding title

- **Severity:** Critical / High / Medium / Low
- **Category:** Source baseline / Output lineage / Requirement / Design fidelity / State / Responsive / Accessibility / Content / Validation / Error handling / Data / API / Compatibility / Performance / Security / Test coverage / Build / Deployment / Regression / Other
- **Source snapshot, requirement, or specification:**
- **Expected behavior:**
- **Actual behavior:**
- **Implementation and runtime evidence:**
- **Required correction:**
- **Status:** Open / Corrected / Accepted deviation / Blocked
- **Retest evidence:**

Repeat for each finding.

## 9. Design Fidelity

Review information architecture, hierarchy, layout, spacing, typography, color, components, variants, assets, interactions, motion, content behavior, and approved deviations against the named `SRC-DS-*` snapshot.

| Area | Design snapshot and reference | Implementation evidence | Result | Notes |
|---|---|---|---|---|
| ... | ... | ... | Pass / Fail / Partial | ... |

## 10. State and Edge-Case Validation

| Element or flow | Default | Hover | Focus | Active | Selected | Disabled | Loading | Empty | Error | Success | Edge cases |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## 11. Responsive and Content Validation

| Viewport or condition | Expected behavior from pinned source or specification | Actual behavior | Result | Evidence |
|---|---|---|---|---|
| Narrow mobile | ... | ... | Pass / Fail / Partial | ... |
| Intermediate width | ... | ... | ... | ... |
| Desktop | ... | ... | ... | ... |
| Unusually wide viewport | ... | ... | ... | ... |
| Long content | ... | ... | ... | ... |
| Missing content or asset | ... | ... | ... | ... |

## 12. Accessibility Validation

Review semantic structure, heading hierarchy, keyboard operation, focus order and visibility, accessible names and relationships, announcements, errors, contrast, touch targets, zoom, reflow, reduced motion, and screen-reader behavior.

| Check | Method | Result | Evidence | Finding |
|---|---|---|---|---|
| ... | ... | Pass / Fail / Blocked / N/A | ... | ... |

Automated checks do not replace required keyboard, focus, and screen-reader review.

## 13. Data, API, and Error Validation

When applicable, validate data shape and ownership, validation boundaries, loading, retry, empty and partial data, errors, authorization, duplicate actions, failed integrations, persistence, and migrations.

| Scenario | Expected | Actual | Result | Evidence |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 14. Non-Functional Validation

| Concern | Requirement | Method | Result | Evidence |
|---|---|---|---|---|
| Compatibility | ... | ... | ... | ... |
| Performance | ... | ... | ... | ... |
| Security and privacy | ... | ... | ... | ... |
| Reliability | ... | ... | ... | ... |
| SEO or metadata | ... | ... | ... | ... |
| Deployment readiness | ... | ... | ... | ... |

Do not invent thresholds or policies.

## 15. Regression Review

| Existing behavior | Baseline snapshot | Regression risk | Validation performed | Result | Finding |
|---|---|---|---|---|---|
| ... | `SRC-REPO-*` / `SRC-RUN-*` | ... | ... | ... | ... |

## 16. Approved Deviations

| Deviation | Source snapshot and expectation | Reason | Approval or evidence | Impact |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

Do not label an unapproved defect as a deviation.

## 17. Corrections and Retesting

| Finding | Correction | Previous implementation snapshot | Corrected implementation snapshot | Retest method | Result |
|---|---|---|---|---|---|
| ... | ... | `SRC-REPO-*` | `SRC-REPO-*` | ... | ... |

## 18. Remaining Risks and Limitations

| Risk or limitation | Impact | Mitigation | Blocking |
|---|---|---|---|
| ... | ... | ... | Yes / No |

## 19. Final Review Checklist

### Completeness and correctness

- [ ] Final baseline and lineage integrity checks were executed.
- [ ] Every must-have requirement and material specification was reviewed.
- [ ] Design fidelity, states, responsive behavior, and content edge cases were checked against named snapshots.
- [ ] Required accessibility, data, API, compatibility, performance, security, deployment, and regression checks were addressed.
- [ ] Findings include reproducible evidence and objective corrections.

### Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Every finding traces to a pinned source expectation.
- [ ] The implementation commit is represented by an Implementation output snapshot.
- [ ] Repository and runtime lineage is complete.
- [ ] Executed, failed, blocked, skipped, and unavailable checks are distinguished honestly.
- [ ] Corrected findings were retested against new output snapshots when code changed.
- [ ] Approved deviations include evidence or approval.
- [ ] No upstream source changed silently during final review.
- [ ] Remaining risks and limitations are explicit.
- [ ] The final result matches unresolved finding severity and lineage integrity.

## 20. Final Result

Select exactly one:

- `Implementation accepted`
- `Implementation accepted with documented non-blocking deviations`
- `Implementation requires corrections`

## 21. Completion Summary

- Files reviewed:
- Input snapshot IDs validated:
- Implementation-output repository snapshot:
- Validation-runtime snapshot:
- Source and lineage verification executed:
- Other validation executed:
- Findings by severity:
- Corrections completed:
- Approved deviations:
- Remaining risks:
- Recommended next action:

<!-- artifact:end -->
