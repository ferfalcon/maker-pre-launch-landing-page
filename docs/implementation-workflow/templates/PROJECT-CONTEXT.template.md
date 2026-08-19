# Project Context Template

Use this template during Stage 0 to establish the stable project baseline before auditing, documenting, planning, or implementing.

Create `SOURCE-BASELINE.md` first or alongside this file. Follow `Source-Snapshots.md` and reference snapshot IDs rather than describing mutable sources as if they were pinned.

<!-- artifact:start -->

```yaml
---
artifact: PROJECT-CONTEXT
project: Project name
profile: Lite | Standard | Full
execution_mode: Gated | Continuous documentation | Task-by-task
status: Draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Project Context

## 1. Project

- Project name:
- Goal:
- Project type: Component / Static page / Multi-page site / Web application / Full-stack application / Other
- Selected profile: Lite / Standard / Full
- Profile rationale:
- Created:
- Last updated:

## 2. Active Source Baseline

- Source baseline: `SOURCE-BASELINE.md`
- Design snapshots: `SRC-DS-*` / None
- Repository snapshots: `SRC-REPO-*` / None
- Runtime snapshots: `SRC-RUN-*` / None
- Documentation snapshots: `SRC-DOC-*` / None
- Asset snapshots: `SRC-ASSET-*` / None

Every listed ID must exist in `SOURCE-BASELINE.md` with Active status.

## 3. Design Scope

- Included pages, frames, nodes, screens, files, URLs, or regions:
- Explicitly excluded areas:
- Access limitations:
- Known design-source dependencies:

Do not repeat source identity details already owned by `SOURCE-BASELINE.md`.

## 4. Repository Scope

- Target branch:
- Relevant application, package, or directory:
- Existing implementation state:
- Known technical constraints:
- Access or tooling limitations:

The pinned repository identity and commit belong to `SRC-REPO-*` records.

## 5. Runtime References

- Production snapshot: `SRC-RUN-*` / None
- Preview or staging snapshot: `SRC-RUN-*` / None
- Local runtime snapshot: `SRC-RUN-*` / None

Use `Not available` rather than inventing a runtime state.

## 6. Scope

### Included

- ...

### Excluded

- ...

### Deferred

- ...

## 7. Authoritative Sources

| Snapshot ID | Authority | Scope | Notes |
|---|---|---|---|
| `SRC-DOC-001` | Product / Design / Current implementation / Technical constraint / Other | ... | ... |

The authority classification does not change snapshot identity.

## 8. Quality Baseline

Record only approved or source-supported expectations.

- Accessibility standard or expectations:
- Responsive coverage:
- Browser or device coverage:
- Performance expectations:
- Security and privacy expectations:
- Testing expectations:
- Deployment expectations:

## 9. Constraints and Dependencies

| ID | Constraint or dependency | Evidence or snapshot | Impact | Status |
|---|---|---|---|---|
| `REQ-CON-001` | ... | `SRC-*` / `EVD-*` | ... | Confirmed / Inferred / Open |

## 10. Known Decisions

| Decision | Owner | Evidence or snapshot | Status |
|---|---|---|---|
| ... | ... | ... | Confirmed / Proposed / Open |

## 11. Initial Risks and Questions

### Blocking

- Missing or Unverified material snapshots
- ...

### Non-blocking

- ...

## 12. Stage 0 Completion

- [ ] Scope is explicit.
- [ ] `SOURCE-BASELINE.md` exists.
- [ ] Every active snapshot ID exists and its pin strength is honest.
- [ ] Design and repository scope are recorded when applicable.
- [ ] The repository baseline uses a commit SHA when repository evidence is required.
- [ ] Workflow profile is selected and justified.
- [ ] Quality expectations are evidence-based.
- [ ] Blocking questions and source limitations are visible.
- [ ] `WORKFLOW-STATE.md` has been created and references the same active baseline.

<!-- artifact:end -->
