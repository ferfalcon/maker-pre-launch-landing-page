# Design Audit Template

Use this template to create a project-specific `DESIGN-AUDIT.md`.

The audit is an evidence baseline. Record what the pinned design source demonstrates, where the evidence appears, and what remains uncertain. Do not convert observations into product requirements or implementation decisions.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: DESIGN-AUDIT
status: Draft
baseline:
  design:
    - SRC-DS-001
  repository: []
  runtime: []
  documentation: []
  assets: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Design Audit

## 1. Document Information

- Status: Draft
- Version: 0.1
- Last updated: YYYY-MM-DD
- Auditor:
- Project:
- Source baseline: `SOURCE-BASELINE.md`
- Active design snapshots: `SRC-DS-*`
- Repository snapshots, when used: `SRC-REPO-*` / None
- Related documents:
  - `REQUIREMENTS.md`
  - `DESIGN.md`
  - `SPEC.md`

## 2. Audit Purpose

Explain why the pinned design scope is being audited, which later documents depend on the evidence, and what the audit does not decide.

## 3. Scope

### Included

- Pages, screens, sections, frames, flows, or equivalent source regions
- Viewports and responsive variants
- Components and reusable patterns
- States and interactions
- Assets, content, and design tokens

### Excluded

- Source areas intentionally outside this audit
- Product behavior not demonstrated by the source
- Technical implementation decisions

## 4. Snapshot and Source Inventory

| Snapshot ID | Source item | Type | Identifier or location | Purpose | Included |
|---|---|---|---|---|---|
| `SRC-DS-001` | ... | Figma page / image / PDF page / URL / other | ... | ... | Yes / No |

For Figma sources, include page, frame, component, and node identifiers. Do not use a newer file state under the existing snapshot ID.

## 5. Evidence Classification

- **Confirmed:** established by authoritative documentation or a user decision.
- **Observed:** directly visible in a pinned source snapshot.
- **Inferred:** strongly suggested but not demonstrated.
- **Recommended:** proposed to resolve a gap.
- **Open question:** cannot be determined safely.

## 6. Screen and Flow Inventory

| ID | Snapshot | Screen, page, or state | Source reference | Entry point | Primary purpose | Connected destination |
|---|---|---|---|---|---|---|
| DS-001 | `SRC-DS-001` | ... | ... | ... | ... | ... |

Describe incomplete, disconnected, or ambiguous paths below the table.

## 7. Information Architecture and Content Hierarchy

Document observed navigation, reading order, hierarchy, actions, repeated content groups, labels, headings, and relationships. Reference the snapshot and source region for each material observation.

## 8. Layout and Responsive Evidence

| Snapshot | Source reference | Approximate viewport | Layout mode | Important behavior |
|---|---|---:|---|---|
| `SRC-DS-001` | ... | ... | Fixed / Fluid / Unknown | ... |

Document observed transformations and missing behavior between or beyond supplied viewports.

## 9. Visual System Inventory

### Typography

| Role | Observed value or style | Snapshot and source reference | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

### Color

| Semantic role | Observed value or token | Snapshot and source reference | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

### Spacing, sizing, and layout tokens

| Pattern or token | Observed value | Snapshot and source reference | Consistency |
|---|---|---|---|
| ... | ... | ... | Consistent / Inconsistent / Unknown |

Document relevant borders, radii, shadows, imagery, iconography, grids, and container behavior.

## 10. Component and Pattern Inventory

| Component or pattern | Variants | States | Reuse evidence | Snapshot and source references | Notes |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

Identify detached, duplicated, inconsistent, or one-off patterns.

## 11. State Coverage

| Element or flow | Default | Hover | Focus | Active | Selected | Disabled | Loading | Empty | Error | Success |
|---|---|---|---|---|---|---|---|---|---|---|
| ... | Seen / Missing / N/A | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## 12. Interaction and Motion Evidence

| Interaction | Trigger | Observed result | Motion or timing | Snapshot and source reference | Certainty |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | Observed / Inferred |

## 13. Content and Data Patterns

Document repeated data structures, optional and required-looking content, text lengths, media ratios, labels, validation messages, empty content, and localization evidence. Do not infer database or API behavior from visual repetition alone.

## 14. Assets and Source Dependencies

| Asset | Snapshot and source reference | Format | Intended use | Availability | Export or licensing concern |
|---|---|---|---|---|---|
| ... | ... | ... | ... | Available / Missing / Unknown | ... |

## 15. Accessibility Observations

Record evidence and concerns for semantic hierarchy, reading and focus order, visible focus, keyboard patterns, contrast, touch targets, text resizing, reflow, reduced motion, alternative text, and status or error communication.

The design source may suggest accessibility intent but does not prove implementation compliance.

## 16. Inconsistencies and Missing Evidence

| Finding ID | Category | Finding | Snapshot and source reference | Impact | Classification |
|---|---|---|---|---|---|
| AUD-001 | Visual / Responsive / State / Content / Accessibility / Flow | ... | ... | ... | Observed / Inferred |

## 17. Questions

### Product questions

- ...

### Design questions

- ...

### Content questions

- ...

### Technical questions

- ...

Each question should explain why the pinned evidence is insufficient and whether it blocks later stages.

## 18. Assumptions and Recommendations

### Inferred

- ...

### Recommended

- ...

## 19. Evidence Index

| Evidence ID | Snapshot ID | Source reference | Summary | Used by |
|---|---|---|---|---|
| EVD-001 | `SRC-DS-001` | ... | ... | Requirement, design, or specification reference |

## 20. Source Verification

- Verification date and method:
- Active snapshot status: Verified / Changed / Partially verified / Unverified
- Newer source content detected: Yes / No / Unknown
- Action required:

## 21. Audit Review

### Review pass 1 — Completeness and correctness

- [ ] The full agreed pinned design scope was inspected.
- [ ] Material screens, flows, components, states, and viewports are inventoried.
- [ ] Important observations include snapshot IDs and precise source references.
- [ ] Missing evidence, inconsistencies, and source limitations are recorded.
- [ ] Accessibility implications are included.

### Review pass 2 — Consistency, traceability, source integrity, and uncertainty

- [ ] Snapshot IDs exist and match `SOURCE-BASELINE.md`.
- [ ] No evidence silently uses newer source content.
- [ ] Confirmed, observed, inferred, recommended, and open information remain distinct.
- [ ] No product rule or implementation decision was invented.
- [ ] Evidence identifiers and source references are internally consistent.
- [ ] Questions are categorized and blocking status is clear.

## 22. Completion Summary

- Files created or modified:
- Snapshot IDs used:
- Source verification performed:
- Important findings:
- Assumptions introduced:
- Open questions or blockers:
- Ready for requirements: Yes / No

<!-- artifact:end -->
