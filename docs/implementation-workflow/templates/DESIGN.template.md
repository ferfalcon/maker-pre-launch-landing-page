# Design Template

Use with [`../guidelines/DESIGN.md`](../guidelines/DESIGN.md) and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md) to create a project-specific record of visual, responsive, content, and interaction intent.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: DESIGN
status: Draft
baseline:
  design:
    - SRC-DS-001
  repository: []
  runtime: []
  documentation: []
  assets:
    - SRC-ASSET-001
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Design

## 1. Document Information

- Status: Draft
- Scope:
- Last updated:
- Source baseline: `SOURCE-BASELINE.md`
- Evidence baseline: `DESIGN-AUDIT.md`
- Related requirements: `REQUIREMENTS.md`

## 2. Purpose and Intent

Describe the user goal, visual direction, hierarchy, and experience principles.

## 3. Source and Scope

- Design snapshot IDs: `SRC-DS-*`
- Included design-source regions:
- Excluded regions:
- Captured evidence or reproduction limitations:

Do not repeat mutable source identity as if it were a version. The snapshot records own revision and capture details.

## 4. Information Architecture and Reading Order

- ...

## 5. Screen and Layout Structure

Describe containers, grids, alignment, flow, fixed and fluid dimensions, and overflow behavior.

## 6. Design Decisions

### DES-001 — Decision title

- **Classification:** Observed / Inferred / Recommended / Confirmed
- **Intent:**
- **Evidence:** `EVD-*` in `SRC-DS-*`
- **Requirement references:** `REQ-*`
- **Implications:**

## 7. Visual System

### Typography

| Role | Style or value | Usage | Evidence |
|---|---|---|---|
| ... | ... | ... | `EVD-*` / `SRC-DS-*` |

### Color and tokens

| Semantic role | Token or value | Usage | Evidence |
|---|---|---|---|
| ... | ... | ... | `EVD-*` / `SRC-DS-*` |

### Spacing, borders, radii, shadows, imagery, and icons

- ...

## 8. Components and Patterns

| Component | Purpose | Anatomy | Variants | States | Reuse evidence |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 9. Interaction Intent

### DES-INT-001 — Interaction title

- Trigger:
- Intended result:
- Pattern:
- Motion:
- Focus or keyboard implication:
- Evidence and snapshot:

Do not prescribe a widget interaction pattern until the intended pattern is identified.

## 10. Responsive Intent

### DES-RWD-001 — Responsive decision title

- What remains stable:
- What becomes fluid:
- What wraps, stacks, reorders, hides, or is replaced:
- Content-driven transition condition:
- Evidence, snapshot, and uncertainty:

Do not invent a familiar breakpoint value. Record supplied viewport evidence and describe behavior between examples.

## 11. States and Edge Cases

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
- Missing content or asset:

## 12. Accessibility Intent

Document semantic hierarchy, reading order, keyboard implications, focus visibility, contrast, touch targets, reflow, alternative text, announcements, and reduced motion.

## 13. Assets and Design-system Mapping

| Asset or pattern | Snapshot or evidence | Existing project resource | Required action | Risk |
|---|---|---|---|---|
| ... | `SRC-ASSET-*` / `EVD-*` | ... | ... | ... |

## 14. Inferences, Recommendations, and Open Questions

### Inferred

- ...

### Recommended

- ...

### Open questions

- ...

## 15. Risks and Inconsistencies

| Finding | Snapshot or evidence | Impact | Resolution owner |
|---|---|---|---|
| ... | ... | ... | ... |

## 16. Review

### Pass 1 — Completeness and correctness

- [ ] Important structure, visual roles, components, states, interactions, responsive behavior, accessibility intent, and assets are covered.
- [ ] Design intent is documented rather than copied as a property dump.
- [ ] Snapshot IDs in metadata exist and were actually inspected.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] `DES-*` identifiers follow `Identifier-Conventions.md`.
- [ ] Decisions map to evidence, snapshots, and requirements.
- [ ] No source changed silently after the artifact baseline was recorded.
- [ ] Observed, inferred, recommended, confirmed, and open information remain distinct.
- [ ] No arbitrary breakpoint or unsupported interaction behavior is presented as confirmed.

<!-- artifact:end -->
