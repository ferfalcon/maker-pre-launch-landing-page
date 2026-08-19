---
artifact: WORKPACK
profile: Express
status: Ready
execution_mode: Task-by-task
current_stage: 9
current_status: Ready
created: 2026-08-06
updated: 2026-08-06
---

# Workpack: Correct article preview card

## 1. Control state

- Objective: Correct the existing article preview card so its desktop and mobile layouts match the supplied design evidence and remain accessible with long content.
- Included design scope: Article preview component, desktop and mobile frames.
- Included repository scope: Existing `ArticlePreview` component and its tests and styles.
- Execution mode: Task-by-task
- Current stage: 9
- Current status: Ready
- Last completed action: Two review passes completed.
- Next permitted action: Implement `P01-T01`.
- Blocking questions: None.

## 2. Express eligibility

- [x] One design-source scope
- [x] One coherent implementation result
- [x] One implementation task
- [x] No persistence, authentication, authorization, or external API work
- [x] No meaningful architecture, migration, deployment, security, privacy, or rollback decision
- [x] No unresolved product decision
- [x] No multi-contributor coordination requirement
- [x] Independently verifiable result

Upgrade triggers: None observed.

## 3. Source baseline

| Snapshot ID | Role | Category and type | Canonical reference | Included scope | Revision, version, checksum, or commit | Captured or inspected | Pin strength | Status | Limitations |
|---|---|---|---|---|---|---|---|---|---|
| `SRC-DS-001` | Input baseline | Figma design | Example design URL | Article preview desktop and mobile nodes | Named example revision | 2026-08-06 13:00 -03:00 | Versioned | Active | Tablet behavior is not directly shown. |
| `SRC-REPO-001` | Task start | Git repository | Example repository | Article preview component | `1111111111111111111111111111111111111111` | 2026-08-06 13:05 -03:00 | Immutable | Active | Example SHA only. |

### Source authority and conflicts

- Design source owns visual composition and demonstrated responsive transformations.
- Repository owns current implementation conventions.
- No conflict was observed.

### Snapshot verification

- Verification date and method: Design nodes inspected; repository commit confirmed.
- Difference classification: Unchanged
- Rebaseline required: No

## 4. Scope and constraints

### Included

- Semantic article structure.
- Responsive image and content layout.
- Long-title wrapping.
- Visible keyboard focus for the card link.
- Existing component tests and visual checks.

### Excluded

- Listing-page layout.
- Article routing and data fetching.
- Design-token migration.
- New variants unrelated to the supplied card.

### Constraints

- Reuse existing repository tokens and test tooling.
- Preserve the current public component API.
- Do not add dependencies.

## 5. Observed design evidence

| Evidence ID | Source and precise region | Observation | Classification | Impact |
|---|---|---|---|---|
| `EVD-001` | `SRC-DS-001` → Article preview / Desktop | Image and content are arranged horizontally. | Observed | Desktop component layout. |
| `EVD-002` | `SRC-DS-001` → Article preview / Mobile | Image moves above the content and spans the card width. | Observed | Small-width transformation. |
| `EVD-003` | `SRC-DS-001` → Focus state | A visible outline surrounds the interactive card. | Observed | Keyboard focus treatment. |

| Finding ID | Finding | Severity | Required action or question | Status |
|---|---|---|---|---|
| `AUD-001` | No tablet frame is supplied. | Low | Select the breakpoint from layout failure and repository conventions. | Resolved |
| `AUD-002` | Long-title behavior is not demonstrated. | Medium | Allow wrapping without fixed-height clipping. | Resolved |

## 6. Expected result

### Requirements

| Requirement ID | Outcome, rule, or constraint | Priority | Evidence or authority |
|---|---|---|---|
| `REQ-FR-001` | The entire card exposes one clear article navigation target. | Must | Existing component behavior and design composition. |
| `REQ-NFR-001` | The card remains readable and operable at narrow widths and with long titles. | Must | Accessibility baseline and `AUD-002`. |

### Design intent

| Design ID | Visual, responsive, content, or interaction intent | Evidence | Confidence |
|---|---|---|---|
| `DES-001` | Preserve the image, metadata, title, and description hierarchy. | `EVD-001` | Observed |
| `DES-RWD-001` | Switch from horizontal to vertical when horizontal content no longer fits without compression. | `EVD-001`, `EVD-002` | Recommended |
| `DES-INT-001` | Show a visible focus indicator around the interactive card target. | `EVD-003` | Observed |

### Specification and acceptance criteria

| Specification ID | Observable behavior | Related requirement |
|---|---|---|
| `SPEC-BEH-001` | The component uses an `article` container and one descriptive link target. | `REQ-FR-001` |
| `SPEC-BEH-002` | The title wraps naturally and does not overlap, clip, or force horizontal scrolling. | `REQ-NFR-001` |
| `SPEC-BEH-003` | The card uses horizontal layout while content fits and vertical layout below the verified failure point. | `REQ-NFR-001` |

- [ ] `AC-001` Keyboard focus is visible without changing layout.
- [ ] `AC-002` The supplied desktop and mobile compositions are reproduced within approved rendering variance.
- [ ] `AC-003` A long title wraps without clipping or overflow.
- [ ] `AC-004` No unrelated component API or dependency changes are introduced.

## 7. Repository-aware implementation approach

- Task-start snapshot: `SRC-REPO-001`
- Existing files and patterns: Existing component, CSS module, component test, and shared focus token.
- Files to modify: Component markup, component styles, and component test.
- Proposed approach: Preserve the public API; replace generic wrapping markup with semantic structure; use existing layout primitives and focus token.
- Responsive implementation: Determine the switch point by inspecting content failure rather than copying the Figma frame width.
- Accessibility: Use native link semantics, meaningful accessible text, and visible `:focus-visible` styling.
- Tests: Extend the current component test and perform manual responsive and keyboard checks.
- Risks: A broad link overlay could interfere with nested controls; nested controls are excluded and must not be introduced by this task.

## 8. Single implementation unit

- Task ID: `P01-T01`
- Status: Ready
- Objective: Correct the existing article preview card within the defined scope.
- Baseline repository snapshot: `SRC-REPO-001`
- Upstream references: `REQ-FR-001`, `REQ-NFR-001`, `DES-001`, `DES-RWD-001`, `DES-INT-001`, `SPEC-BEH-001`, `SPEC-BEH-002`, `SPEC-BEH-003`, `AC-001`–`AC-004`
- Prerequisites: None
- Included files and behavior: Component markup, styles, tests, responsive layout, focus, and long content.
- Excluded work: Routing, APIs, listing layout, and unrelated refactoring.
- Ordered steps:
  1. Reconfirm repository snapshot and component conventions.
  2. Correct semantic markup while preserving the public API.
  3. Implement fluid layout and the content-driven layout switch.
  4. Apply the existing focus token.
  5. Extend tests and run required checks.
  6. Commit the approved result and record output lineage.
- Definition of Done: All acceptance criteria and required checks pass with evidence.

## 9. Review pass 1 — Completeness and correctness

Corrections:

- Added long-title behavior after identifying missing design evidence.
- Clarified that the breakpoint is content-driven.
- Added regression protection for the public component API.

Pass result: Ready for pass 2.

## 10. Review pass 2 — Consistency, traceability, and risk

Corrections:

- Connected each acceptance criterion to the implementation unit.
- Confirmed one task is sufficient.
- Confirmed no upgrade trigger is present.

Readiness result: Ready for implementation.

## 11. Implementation record and output lineage

Not completed yet.

## 12. Validation evidence

| Check | Expected result | Status | Evidence or reason |
|---|---|---|---|
| Build and type check | Existing commands complete successfully. | Not executed | Implementation has not started. |
| Component test | Semantic structure and existing behavior pass. | Not executed | Implementation has not started. |
| Keyboard and focus | Card is reachable and focus is visible. | Not executed | Implementation has not started. |
| Responsive and long content | No clipping or horizontal overflow at supplied and intermediate widths. | Not executed | Implementation has not started. |
| Visual comparison | Hierarchy and responsive composition match `SRC-DS-001`. | Not executed | Implementation has not started. |

## 13. Final implementation review

Pending implementation and validation.

Final result: Not yet assigned.

## 14. Change and upgrade history

| Date | Change, rebaseline, or profile decision | Reason | Affected IDs or sections | Result |
|---|---|---|---|---|
| 2026-08-06 | Selected Express profile. | One coherent component result with one task and low integration risk. | Entire workpack | Express retained. |
