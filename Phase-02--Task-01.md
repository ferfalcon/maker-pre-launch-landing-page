---
artifact: TASK
id: P02-T01
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

Workflow-owned task status, baseline, validation state, and output lineage are recorded by `design-workflow`; this narrative defines the implementation contract only.

# Phase 02 — Task 01: Implement responsive Hero and Benefits

## 2. Objective

Implement the source-faithful Header/Hero refinement and four-benefit content system so the supplied desktop, tablet, mobile, and fit-driven intermediate layouts preserve source order, hierarchy, asset semantics, and reflow without hard-coding the Figma reference widths as automatic breakpoint values.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`.
- Consolidated Lite documentation: `IMPLEMENTATION-BRIEF.md`, especially `PLAN-002` and the Stage 7 traceability table.
- Design snapshot: `SRC-DS-001`; repository baseline: `SRC-REPO-001`.
- Main-page references: Desktop `32:10924`, Tablet `32:11410`, Mobile `32:11529`.
- Component references: Header `78:3069`, Hero `79:3868`, Benefit Card `70:2298`, Benefits `79:13338`.
- Requirements: `REQ-FR-001`, `REQ-FR-002`, `REQ-NFR-001`, `REQ-NFR-002`, `REQ-AR-005`, `REQ-AR-006`, `REQ-CON-007`.
- Specifications: `SPEC-BEH-001`, `SPEC-BEH-002`, `SPEC-ACC-003`.
- Design intent: `DES-004`–`DES-006`, `DES-RWD-001`–`DES-RWD-003`, `DES-RWD-006`.
- Acceptance evidence: `AC-028`–`AC-032`, `AC-055`–`AC-056` where applicable.
- Prerequisite task: `P01-T01`.
- Sibling tasks: `P02-T02`, `P02-T03`; downstream: `P03-T01`.

## 4. Snapshot Verification

Complete immediately before implementation starts.

- Confirm `P01-T01` is Complete and its approved implementation output is the expected current repository lineage.
- Re-verify Hero/Benefits/Header/Main-page evidence in `SRC-DS-001`.
- At `task start`, bind this task to the current repository HEAD so the completed foundation becomes an expected previous-task output rather than silently using the original starter commit.
- Stop and record a discovery/rebaseline if material Figma content/layout or repository foundations changed unexpectedly.

## 5. Prerequisites

- `P01-T01` Complete with passing validation and recorded implementation output.
- Shared Maker tokens, page shell, Header/Hero base components, and required local artwork available from the foundation task.
- Design/repository verification clear at task start.

## 6. Scope

### Included

- Refine Header/Hero to match the approved source across supplied and fit-driven widths.
- Create the reusable Benefit Card and Benefits section for all four source-authored benefits.
- Preserve source order and equal conceptual weight while transforming desktop columns → tablet horizontal rows → mobile centered vertical cards when fit requires.
- Use source-authorized local Hero/benefit artwork with correct decorative semantics.
- Select and document actual CSS transition thresholds from observed fit/failure conditions.
- Integrate Hero/Benefits into `index.astro` as needed without taking ownership of Pricing or Signup.
- Validate zoom/reflow, wrapping, no overlap/clipping, and no primary-content horizontal page scrolling.

### Excluded

- Pricing content or controls (`P02-T02`).
- Signup validation/interaction (`P02-T03`).
- Final whole-page regression/fidelity tuning (`P03-T01`).
- Backend, persistence, plan-selection, analytics, extra routes, or unrelated refactoring.

## 7. Repository Context

This task starts from the completed `P01-T01` output, not from the untouched starter in practice. Expected shared paths are `frontend/src/components/Header.astro`, `frontend/src/components/Hero.astro`, `frontend/src/styles/global.css`, `frontend/src/assets/maker/`, and `frontend/src/pages/index.astro`. The original `SRC-REPO-001` establishes the supported Astro/static architecture and `pnpm build` command; the task-start snapshot establishes the actual post-foundation file state. No automated responsive/visual/accessibility test harness is source-authorized or configured.

## 8. Files and Modules

| Path | Action | Existing or proposed at task start | Responsibility | Evidence |
|---|---|---|---|---|
| `frontend/src/components/Header.astro` | Modify if needed | Expected from `P01-T01` | Source-faithful header fit/alignment | Figma `78:3069` |
| `frontend/src/components/Hero.astro` | Modify | Expected from `P01-T01` | Hero layout/artwork/reflow | Figma `79:3868` |
| `frontend/src/components/BenefitCard.astro` | Create | Proposed | One illustration/title/body benefit unit | Figma `70:2298` |
| `frontend/src/components/Benefits.astro` | Create | Proposed | Four-benefit ordering and responsive composition | Figma `79:13338` |
| `frontend/src/assets/maker/` | Add/use assets | Expected directory from `P01-T01` | Hero and benefit artwork | `SRC-DS-001` |
| `frontend/src/pages/index.astro` | Modify only as needed | Existing | Integrate Hero/Benefits in source order | `PLAN-002` |
| `frontend/src/styles/global.css` | Modify only for genuinely shared fit primitives | Expected from `P01-T01` | Shared bounded/reflow support, not section-specific styling | `PLAN-001`/`PLAN-002` |

## 9. Dependencies and Interfaces

- Requires stable global tokens/assets/page shell from `P01-T01`.
- `BenefitCard.astro` should accept static content/artwork data sufficient for the four approved cards without introducing application state.
- Benefits ordering in source/data/DOM must remain identical across layouts; CSS changes presentation only.
- Any global-style change must be necessary for shared layout behavior and must not collide with Pricing/Signup ownership.
- This task must leave `P02-T02` and `P02-T03` independently implementable after the common foundation.

## 10. Implementation Steps

1. Verify design and post-foundation repository snapshots; confirm prerequisite completion.
2. Inspect Header/Hero implementation and local assets produced by `P01-T01`.
3. Compare Hero/Header against the 375/768/1440 references and identify actual fit constraints rather than copying frame widths into media queries.
4. Refine Hero/Header structure/styling while preserving semantic source order and non-interactive decorative artwork.
5. Create `BenefitCard.astro` with static, semantic illustration/title/body content and decorative artwork handling.
6. Create `Benefits.astro` with the four approved benefits in immutable source order.
7. Implement content-fit responsive transitions matching desktop peer columns, tablet horizontal rows, and mobile centered cards; record thresholds/rationale in implementation notes when chosen.
8. Integrate the section into `index.astro` without touching Pricing/Signup behavior.
9. Test wrapping, zoom/reflow, narrow/intermediate/supplied/wider layouts, and decorative/focus semantics.
10. Run `pnpm build` and the task manual validation; commit through workflow lineage.

Do not include unrelated implementation or architecture changes.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Hero/Benefits are static content; loading, error, success, disabled, and empty product states are Not applicable.
- Scroll cue is presentational only and must not acquire hover/focus/click behavior.

### Responsive behavior

- Desktop reference: four Benefits appear as peer columns and Hero preserves the spacious centered editorial hierarchy.
- Tablet reference: Benefits become horizontal illustration+copy rows while retaining source order.
- Mobile reference: Benefits become centered vertical cards.
- Intermediate transitions occur when content fit would otherwise compress, overlap, clip, or lose source-like measures; do not treat 375/768/1440 as mandatory transition values.
- Long text and zoom/reflow remain within card/section bounds without primary horizontal scrolling.

### Accessibility

- Preserve meaningful heading hierarchy and existing single-H1 contract.
- Hero/benefit illustrations that do not add textual meaning are decorative/silent.
- Scroll cue is non-focusable and excluded from interaction semantics.
- DOM/source order is stable across visual rearrangement.
- Settled content remains understandable independent of motion; no animation is required for comprehension.

## 12. Validation

### Automated validation

- Build: from `frontend/`, `pnpm build`; expected exit 0.
- Unit/component/E2E, lint, standalone type-check, automated a11y/visual regression: no configured task-start scripts unless an approved prior task demonstrably added them; do not invent validation.

### Manual validation

- Visual compare at 375, 768, and 1440 against `SRC-DS-001` for Hero/Header/Benefits only.
- Check representative narrower, wider, and intermediate widths immediately around observed fit transitions.
- Confirm all four benefits, correct source order, titles/body/artwork, and desktop/tablet/mobile composition behavior.
- Confirm no overlap, clipping, collapsed readable measures, or primary-content horizontal page scrolling.
- Keyboard/accessibility inspection: no decorative artwork or scroll cue enters tab order; heading/source order remains logical.
- Zoom/reflow and long-text checks confirm content remains readable and bounded.
- Inspect selected CSS transition thresholds and ensure each is justified by fit rather than copied solely from Figma frame widths.

## 13. Acceptance Criteria

- [ ] `REQ-FR-001` / `SPEC-BEH-001`: Header/Hero and all four Benefits appear in approved logical order.
- [ ] `REQ-FR-002` / `REQ-NFR-002` / `SPEC-BEH-002`: supplied references and fit-driven intermediate widths reflow without semantic reordering.
- [ ] `DES-006`: desktop, tablet, and mobile benefit compositions preserve equal conceptual weight and source order.
- [ ] `REQ-AR-005` / `SPEC-ACC-003` / `AC-055`–`AC-056`: decorative artwork and scroll cue semantics are correct and non-focusable.
- [ ] `REQ-AR-006` / `REQ-CON-007`: reflow avoids overlap/clipping/primary horizontal scrolling and uses observed fit thresholds.
- [ ] `pnpm build` and all task manual checks pass.
- [ ] Task-start snapshot verification and implementation-output lineage are recorded.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Exact transition thresholds are unknown before rendering | Overfit or awkward intermediate layouts | Choose thresholds from observed content failure/fit and test around them |
| SVG crop/aspect behavior differs from Figma | Visual drift | Preserve intrinsic proportions and compare at all supplied references |
| Absolute positioning leaks into semantic layout | Reflow/accessibility failure | Keep content DOM flow semantic; reserve positioning for genuinely decorative layers |
| Shared CSS edits collide with parallel Pricing/Signup work | Integration churn | Keep section styling local; change globals only for necessary shared primitives |

## 15. Implementation Discoveries

None recorded during decomposition. Record any source-content mismatch, unavailable asset, foundation incompatibility, or required scope change rather than silently compensating.

## 16. Deviations

None during decomposition. Record actual transition thresholds and any approved path/component deviations during implementation.

## 18. Definition of Done

- [ ] Objective and acceptance criteria are implemented within scope.
- [ ] Required build/manual responsive/visual/accessibility checks pass.
- [ ] No required validation remains failing or unverified.
- [ ] Prerequisite output and task-start snapshots are verified or formally rebaselined.
- [ ] Implementation-output snapshot/lineage is recorded.
- [ ] Chosen fit thresholds and material discoveries/deviations are documented.
- [ ] Canonical task/workflow projections reflect completion without manual generated-state edits.
- [ ] `P03-T01` can consume the completed Hero/Benefits without unresolved blockers.

## 19. Completion Report

Complete during Stage 10 implementation:

- Files created/modified/deleted:
- Task-start and implementation-output snapshots:
- Source verification performed:
- Responsive thresholds selected and rationale:
- Behavior/content implemented:
- Validation executed/results:
- Deviations/discoveries/remaining risks:
- Documentation updated:
- Next unblocked task:
