# Express Workpack Template

Use only for the Express profile. In CLI-managed mode this is the single normative narrative artifact; the workflow record owns mutable control/registry/validation/output-lineage state.

<!-- artifact:start -->

```yaml
---
artifact: WORKPACK
profile: Express
status: Draft
execution_mode: Gated | Continuous documentation | Task-by-task
current_stage: 0
current_status: In progress
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
## 1. Control state

- Objective:
- Included design scope:
- Included repository scope:
- Execution mode:
- Current stage:
- Current status:
- Next permitted action:
<!-- control:markdown-only:end -->

# Workpack: Result title

## 2. Express eligibility

- [ ] One bounded source scope or coherent source bundle
- [ ] One coherent implementation result
- [ ] At most one implementation task
- [ ] No meaningful routing, shared state, persistence, auth, API, migration, deployment, security, privacy, or rollback decision
- [ ] No unresolved material product decision
- [ ] No coordination requiring separate task ownership
- [ ] Independently verifiable result

### Upgrade triggers

- Multiple independent tasks/results:
- Connected routes/shared state/integration:
- Persistence/auth/API/architecture/operational risk:
- Material source conflict/product decision:
- Other:

## 3. Source baseline narrative

<!-- control:markdown-only:start -->
| Snapshot ID | Role | Category | Reference | Scope | Revision/commit | Pin strength | Status | Limitations |
|---|---|---|---|---|---|---|---|---|
| `SRC-DS-001` | Input baseline | Design | ... | ... | ... | Time-bound | Active | ... |
| `SRC-REPO-001` | Input baseline | Repository | ... | ... | Commit SHA | Immutable | Active | ... |
<!-- control:markdown-only:end -->

### Source authority, scope, and limitations

- Authority order:
- Included scope:
- Excluded scope:
- Conflicts/open questions:
- Reproduction/capture evidence:
- Limitations:

### Verification narrative

- Method and evidence:
- Difference classification:
- Rebaseline or impact assessment:

## 4. Scope and constraints

- Included:
- Excluded:
- Repository/technology constraints:
- Content/assets constraints:
- Accessibility baseline:
- Browser/device constraints:

## 5. Observed design evidence and audit

| Evidence ID | Source and precise region | Observation | Classification | Impact |
|---|---|---|---|---|
| `EVD-001` | `SRC-DS-001` → ... | ... | Observed | ... |

| Finding ID | Finding | Severity | Required action/question | Status |
|---|---|---|---|---|
| `AUD-001` | ... | High / Medium / Low | ... | Open / Resolved |

Cover applicable components/variants, responsive behavior, states/interactions, content edges, assets, variables/tokens, and accessibility implications.

## 6. Expected result

### Requirements

| Requirement ID | Outcome, rule, or constraint | Priority | Evidence/authority |
|---|---|---|---|
| `REQ-FR-001` | ... | Must / Should / Could | ... |

### Design intent

| Design ID | Intent | Evidence | Confidence |
|---|---|---|---|
| `DES-001` | ... | `EVD-001` | Confirmed / Observed / Inferred / Recommended |

Use `DES-RWD-*` and `DES-INT-*` where applicable.

### Specification and acceptance criteria

| Specification ID | Observable behavior | Related requirement |
|---|---|---|
| `SPEC-BEH-001` | ... | `REQ-FR-001` |

- [ ] `AC-001` ...
- [ ] `AC-002` ...

## 7. Repository-aware implementation approach

- Existing files/patterns:
- Reusable components/utilities/tokens/tests:
- Existing versus proposed files:
- Proposed approach:
- Responsive implementation:
- Semantics/accessibility:
- State/error handling:
- Tests/manual checks:
- Risks/regressions:

## 8. Single implementation unit

- Task ID: `P01-T01`
- Objective:
- Upstream references:
- Prerequisites: None
- Included files/behavior:
- Excluded work:
- Ordered implementation steps:
- Required validation:
- Definition of Done:

## 9. Review pass 1 — Completeness and correctness

Review source identity/scope, eligibility, evidence coverage, requirements/design/spec/AC, repository assumptions, accessibility/responsive/states/errors/validation, unsupported claims, and missing decisions.

### Corrections

- ...

### Result

Ready for pass 2 / Blocked

## 10. Review pass 2 — Consistency, traceability, source integrity, and risk

Review ID/snapshot integrity, requirement → design → specification → acceptance → task traceability, contradictions/hidden assumptions, scope/upgrade triggers, repository compatibility/regression risk, and validation executability.

### Corrections

- ...

### Readiness

Ready for implementation / Ready with non-blocking risks / Blocked or must upgrade

## 11. Implementation narrative

This section remains narrative in CLI-managed mode. Do not duplicate record-owned task status, structured validation state, output snapshot identity, output commit, or lineage.

### Files and behavior

- Files created/modified/deleted:
- Behavior implemented:

### Implementation discoveries

| Discovery | Impact | Owning artifact/section | Required update |
|---|---|---|---|
| ... | ... | ... | ... |

### Deviations

| Planned approach/baseline | Actual approach/baseline | Reason | Approval/evidence | Impact |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

### Remaining risks and documentation updates

- Risks:
- Documentation updated:

<!-- control:markdown-only:start -->
## 12. Output lineage and validation state

- Parent task-start snapshot: `SRC-REPO-001`
- Implementation output snapshot: `SRC-REPO-002`
- Output commit SHA:
- Produced by task: `P01-T01`

| Check | Expected result | Status | Evidence/reason |
|---|---|---|---|
| Build/lint/type | ... | ... | ... |
| Behavior | ... | ... | ... |
| Accessibility | ... | ... | ... |
| Responsive/visual | ... | ... | ... |
| Regression | ... | ... | ... |
<!-- control:markdown-only:end -->

## 13. Final implementation review

- Exact design inputs reviewed:
- Exact repository output reviewed:
- Validation runtime when applicable:
- Requirements/acceptance result:
- Remaining deviations/risks:
- Baseline/lineage integrity:

| Finding ID | Expected | Actual | Severity | Correction | Status | Retest evidence |
|---|---|---|---|---|---|---|
| `IMPL-001` | ... | ... | Critical / High / Medium / Low | ... | Open / Corrected / Accepted deviation | ... |

### Final result

Use exactly one:

- `Implementation accepted`
- `Implementation accepted with documented non-blocking deviations`
- `Implementation requires corrections`

## 14. Change and upgrade history

| Date | Change/rebaseline/profile decision | Reason | Affected IDs/sections | Result |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

<!-- artifact:end -->
