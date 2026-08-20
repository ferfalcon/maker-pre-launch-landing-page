---
artifact: TASK
id: P02-T02
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

Workflow-owned task status, baseline, validation state, and output lineage are recorded by `design-workflow`; this narrative defines the implementation contract only.

# Phase 02 — Task 02: Implement static responsive Pricing

## 2. Objective

Implement the approved Free/Premium pricing comparison as semantic, static, source-faithful content that responds to available space while preserving Free → Premium order and introducing no selection, checkout, billing, subscription, or other transactional behavior.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`.
- Consolidated Lite documentation: `IMPLEMENTATION-BRIEF.md`, especially `PLAN-003` and Stage 7 traceability.
- Design snapshot: `SRC-DS-001`; repository baseline: `SRC-REPO-001`.
- Main-page references: Desktop `32:10924`, Tablet `32:11410`, Mobile `32:11529`.
- Component references: Pricing Card `71:2973`, Pricing `79:14668`.
- Requirements: `REQ-FR-002`, `REQ-FR-006`, `REQ-BR-001`, `REQ-NFR-001`, `REQ-NFR-002`, `REQ-AR-005`, `REQ-AR-006`.
- Specifications: `SPEC-BEH-001`, `SPEC-BEH-002`, `SPEC-ACC-003`; `AC-027` where applicable.
- Design intent: `DES-004`, `DES-007`, `DES-RWD-001`, `DES-RWD-004`, `DES-RWD-006`.
- Prerequisite task: `P01-T01`.
- Sibling tasks: `P02-T01`, `P02-T03`; downstream: `P03-T01`.

## 4. Snapshot Verification

Complete immediately before implementation starts.

- Confirm `P01-T01` is Complete and its implementation output is the expected repository ancestor.
- Re-verify Pricing/Main-page evidence in `SRC-DS-001`, including displayed plan names, price content, features, order, and visual contrast.
- Bind task start to current HEAD so the approved foundation is classified as expected previous-task output.
- Stop for documented rebaseline/discovery if pricing content, design, or shared foundations changed materially.

## 5. Prerequisites

- `P01-T01` Complete with passing validation and recorded output.
- Shared Maker tokens, layout foundations, and local asset directory available.
- Design/repository verification clear at task start.

## 6. Scope

### Included

- Create reusable static Pricing Card and Pricing section components.
- Encode approved Free and Premium names, descriptions, displayed prices, and feature rows as static/typed component data.
- Preserve Free → Premium DOM/content order at every viewport.
- Use authorized pricing/check artwork locally and mark redundant icons/checkmarks decorative when accompanying text carries meaning.
- Keep cards side by side while source-like readable measures fit; stack in Free → Premium order when space becomes insufficient.
- Integrate Pricing into `index.astro` only as required for this section.
- Validate content-driven card heights, long text, reflow, and visual plan contrast.

### Excluded

- Links/buttons for plan selection, checkout, payment, subscription, upgrade, or billing.
- Hover/select/active state suggesting plan interactivity.
- Hero/Benefits ownership (`P02-T01`).
- Signup behavior (`P02-T03`).
- Final whole-page regression (`P03-T01`).
- Backend, persistence, analytics, authentication, extra routes, or unrelated refactoring.

## 7. Repository Context

This task starts from the completed foundation output. Expected shared files are the Maker page shell, global CSS/tokens, local asset directory, and `index.astro`. The architecture remains static Astro with no client application state. `pnpm build` remains the only confirmed automated validation command unless an approved prerequisite demonstrably adds another script. The source explicitly treats pricing as informational comparison content rather than an interaction surface.

## 8. Files and Modules

| Path | Action | Existing or proposed | Responsibility | Evidence |
|---|---|---|---|---|
| `frontend/src/components/PricingCard.astro` | Create | Proposed | Semantic representation of one plan and feature list | Figma `71:2973` |
| `frontend/src/components/Pricing.astro` | Create | Proposed | Section heading, Free/Premium data/order, responsive comparison layout | Figma `79:14668` |
| `frontend/src/assets/maker/` | Add/use assets | Expected directory from `P01-T01` | Pricing/check/decorative assets | `SRC-DS-001` |
| `frontend/src/pages/index.astro` | Modify only as needed | Existing | Integrate Pricing in approved major-section order | `PLAN-003` |
| `frontend/src/styles/global.css` | Modify only for genuine shared primitive needs | Expected | Shared bounded/reflow primitives only | `PLAN-001` |

## 9. Dependencies and Interfaces

- Uses the shared visual tokens/layout from `P01-T01`.
- `PricingCard.astro` should expose static props for plan name, description, displayed price, and feature rows; no mutable selection state.
- Pricing section owns Free/Premium source order and responsive layout; `index.astro` should only compose the section.
- Section/card styling should be local where possible to minimize collision with parallel Hero/Benefits and Signup work.
- The final integration task must be able to verify Pricing without requiring any interaction or backend service.

## 10. Implementation Steps

1. Verify pricing design evidence and the post-foundation repository snapshot.
2. Extract the exact approved Free/Premium content and relevant local artwork from authorized source evidence.
3. Define the static Pricing Card interface/data model without application state.
4. Implement semantic plan headings, descriptions, displayed prices, and feature lists; mark redundant icons decorative.
5. Compose Free then Premium in the Pricing section with source-faithful contrast/hierarchy.
6. Implement responsive side-by-side/stacked behavior based on content fit, not automatic use of 375/768 reference widths.
7. Allow content-driven heights/wrapping at intermediate widths; avoid clipping/fixed-height failures.
8. Integrate Pricing into `index.astro` without adding focusable/transactional controls.
9. Run build, content, responsive, accessibility, and non-interactivity checks.
10. Commit through workflow lineage and record any actual fit threshold/deviation.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Pricing is static informational content.
- Loading, selected, hover-selection, active-plan, disabled, error, checkout, and success states are Not applicable and must not be invented.

### Responsive behavior

- Preserve Free → Premium source/DOM order at all widths.
- Keep cards side by side only while both retain comfortable source-like measures.
- Stack vertically when a comparison row would compress content, clip, or create horizontal scrolling.
- Card height is content-driven at constrained/intermediate widths; do not preserve a fixed source-frame height at the cost of clipping.
- Supplied 375/768/1440 widths are validation references, not mandated transition values.

### Accessibility

- Use meaningful plan/section headings and semantic lists for features.
- Checkmarks/plan illustrations that duplicate adjacent text are decorative/silent.
- No pricing element should become focusable solely for appearance.
- Preserve text contrast and readable wrapping through zoom/reflow.

## 12. Validation

### Automated validation

- Build: from `frontend/`, run `pnpm build`; expected exit 0.
- Unit/component/E2E, lint, standalone type-check, automated a11y/visual regression: unavailable unless explicitly added by an approved predecessor; do not invent scripts.

### Manual validation

- Compare Free/Premium plan names, descriptions, prices, feature rows, order, and visual hierarchy with `SRC-DS-001`.
- Verify Free → Premium order in the DOM and rendered layout at 375, 768, 1440, and fit-driven intermediate widths.
- Check side-by-side → stacked transition occurs before content becomes cramped/clipped and does not use the reference widths merely because they exist.
- Test long/reflowed content and zoom for readable content-driven card sizing and no primary horizontal page scrolling.
- Keyboard/focus inspection: Pricing contributes no plan-selection/payment focusable controls or misleading hover affordances.
- Verify redundant pricing/check artwork is decorative and textual features remain the accessible source of meaning.

## 13. Acceptance Criteria

- [ ] `REQ-FR-006` / `REQ-BR-001` / `SPEC-BEH-001` / `AC-027`: approved Free/Premium content is present in Free → Premium order.
- [ ] `REQ-FR-002` / `SPEC-BEH-002`: cards preserve semantic order while adapting between comparison row and stacked presentation.
- [ ] `DES-007`: plan contrast/hierarchy remains source-faithful and informational.
- [ ] `REQ-AR-005` / `SPEC-ACC-003`: redundant plan/check artwork is semantically decorative.
- [ ] `REQ-AR-006`: constrained/intermediate layouts avoid clipping/overlap/primary horizontal scrolling.
- [ ] No links, buttons, selection state, payment, checkout, billing, subscription, or other transactional behavior is introduced.
- [ ] `pnpm build` and all required manual checks pass.
- [ ] Task-start verification and implementation-output lineage are recorded.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Fixed card heights copied from source frames | Clipping at intermediate widths | Use content-driven sizing and test wrapping/zoom |
| Pricing visuals imply clickability | False affordance/accessibility confusion | Render static semantics only; inspect cursor/focus/hover behavior |
| Breakpoint chosen from frame width rather than fit | Awkward comparison layout | Select threshold from actual card-content comfort and document it |
| Parallel global changes cause CSS collision | Integration churn | Keep pricing styles locally scoped; minimize shared CSS edits |

## 15. Implementation Discoveries

None recorded during decomposition. Record any plan-content mismatch, missing asset, or foundation conflict before compensating in code.

## 16. Deviations

None during decomposition. Record any approved component/data/path or responsive-threshold deviation during implementation.

## 18. Definition of Done

- [ ] Objective and acceptance criteria are implemented within scope.
- [ ] Build/content/responsive/accessibility/non-interactivity checks pass.
- [ ] No required validation remains failing or unverified.
- [ ] Prerequisite output and task-start snapshots are verified or formally rebaselined.
- [ ] Implementation-output snapshot and parent lineage are recorded.
- [ ] Material discoveries/deviations and actual responsive fit decisions are documented.
- [ ] Canonical task/workflow projections reflect completion without manual generated-state edits.
- [ ] `P03-T01` can integrate/verify Pricing with no unresolved transactional assumptions.

## 19. Completion Report

Complete during Stage 10 implementation:

- Files created/modified/deleted:
- Task-start and implementation-output snapshots:
- Source verification performed:
- Pricing content implemented:
- Responsive threshold/rationale:
- Validation executed/results:
- Deviations/discoveries/remaining risks:
- Documentation updated:
- Next unblocked task:
