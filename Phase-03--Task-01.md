---
artifact: TASK
id: P03-T01
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

Workflow-owned task status, baseline, validation state, and output lineage are recorded by `design-workflow`; this narrative defines the implementation contract only.

# Phase 03 — Task 01: Integrate page and complete fidelity regression

## 2. Objective

Integrate the completed foundation, Hero/Benefits, Pricing, and Signup work into the final single-page Maker experience; correct only residual integration/fidelity/reflow defects; and run the end-to-end build, responsive, visual, keyboard, accessibility, content, and scope regression required to establish implementation readiness without introducing new product capabilities.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`.
- Consolidated Lite documentation: `IMPLEMENTATION-BRIEF.md`, especially `PLAN-005`, `PLAN-001`–`PLAN-004`, and Stage 7 traceability/readiness.
- Design snapshot: `SRC-DS-001`; repository baseline: `SRC-REPO-001`.
- Main-page references: Desktop `32:10924`, Tablet `32:11410`, Mobile `32:11529`.
- Component families: Header `78:3069`, Hero `79:3868`, Benefit Card `70:2298`, Benefits `79:13338`, Pricing Card `71:2973`, Pricing `79:14668`, Signup `72:2835`, Email Input `32:17773`, Button `32:17765`.
- Requirements/specifications: all approved items affected by `PLAN-001`–`PLAN-004`, with emphasis on `REQ-NFR-001`, `REQ-NFR-002`, `REQ-AR-006`, `REQ-CON-004`, `SPEC-BEH-001`, `SPEC-BEH-002`.
- Design intent: `DES-001`–`DES-008`, `DES-RWD-001`–`DES-RWD-006`, `DES-INT-001`–`DES-INT-004`.
- Prerequisites: `P02-T01`, `P02-T02`, `P02-T03` (and transitively `P01-T01`).

## 4. Snapshot Verification

Complete immediately before implementation starts.

- Confirm all three Phase 02 tasks are Complete with passing validation and recorded implementation outputs.
- Bind this task to the current repository HEAD containing those expected previous-task outputs.
- Re-verify the authorized Figma Main-page and component references against `SRC-DS-001` before final fidelity tuning.
- Compare current repo changes with the approved task outputs; classify only those outputs as expected and treat unrelated concurrent changes as blockers until resolved.
- Do not use final integration to silently absorb an upstream requirement/design/specification defect; record a discovery/rebaseline when material.

## 5. Prerequisites

- `P01-T01`, `P02-T01`, `P02-T02`, and `P02-T03` Complete.
- Their required validations and implementation-output lineage recorded.
- Current design/repository snapshot verification clear.
- No unresolved task blocker or approved-scope contradiction.

## 6. Scope

### Included

- Ensure the page composes Header/Hero → Benefits → Pricing → Signup in approved logical/source order.
- Resolve residual spacing, alignment, sizing, artwork, typography, responsive-fit, or cross-section CSS integration defects.
- Verify source-authored content, pricing order/non-interactivity, and Signup exact validation/no-op behavior end to end.
- Verify supplied 375/768/1440 visual outcomes plus fit-driven narrower/wider/intermediate widths.
- Verify page-level semantic/heading order, keyboard focus, error relationship/announcement behavior, decorative asset semantics, zoom/reflow, and no primary-content horizontal scrolling.
- Confirm starter artifacts are fully removed/unreferenced and no unapproved capabilities were introduced.
- Run the final repository-supported build and document remaining non-blocking deviations/risks if any.

### Excluded

- New routes, backend/API/serverless delivery, persistence/storage, authentication, analytics, billing/checkout/plan selection, success/loading/retry flows, or new runtime architecture.
- Replacing completed component approaches merely for stylistic preference.
- New framework/form library/test tooling unless a real discovered blocker requires an explicitly approved scope change.
- Material redesign beyond correcting observable divergence from approved sources.

## 7. Repository Context

This task starts from the combined implementation outputs of all earlier tasks. `frontend/` remains a single static Astro page; the only source-authorized client behavior is Signup validation/no-op. Current source files should include the shared layout/global CSS, Header/Hero, Benefits/BenefitCard, Pricing/PricingCard, SignupForm, local Maker assets, and `index.astro` composition. `pnpm build` is the confirmed baseline automated validator; manual browser checks remain required for fidelity, responsive behavior, keyboard interaction, accessibility semantics, and side-effect verification.

## 8. Files and Modules

| Path | Action | Existing at task start | Responsibility | Evidence |
|---|---|---|---|---|
| `frontend/src/pages/index.astro` | Review/modify only for integration defects | Expected | Final section composition/order | `PLAN-005` |
| `frontend/src/layouts/Layout.astro` | Review/modify only for page-level defects | Expected | Final document shell/global integration | `PLAN-005` |
| `frontend/src/styles/global.css` | Review/modify only for cross-section/shared defects | Expected | Global tokens/base/reflow/focus primitives | `PLAN-001`/`PLAN-005` |
| `frontend/src/components/Header.astro` | Review/correct if needed | Expected | Header fidelity | Figma `78:3069` |
| `frontend/src/components/Hero.astro` | Review/correct if needed | Expected | Hero fidelity/reflow | Figma `79:3868` |
| `frontend/src/components/BenefitCard.astro` | Review/correct if needed | Expected | Benefit unit fidelity/reflow | Figma `70:2298` |
| `frontend/src/components/Benefits.astro` | Review/correct if needed | Expected | Benefits composition | Figma `79:13338` |
| `frontend/src/components/PricingCard.astro` | Review/correct if needed | Expected | Pricing-card fidelity/semantics | Figma `71:2973` |
| `frontend/src/components/Pricing.astro` | Review/correct if needed | Expected | Pricing composition/order | Figma `79:14668` |
| `frontend/src/components/SignupForm.astro` | Review/correct if needed | Expected | Signup layout/states/validation | Figma `72:2835` |
| `frontend/src/assets/maker/` | Review/correct references only | Expected | Final authorized artwork set | `SRC-DS-001` |

## 9. Dependencies and Interfaces

- Consumes completed outputs of all earlier tasks; it must not bypass their workflow lineage.
- Preserve each component's established responsibility; integration changes should be the smallest necessary correction.
- Page composition owns major section order; components own local visual/state semantics.
- Pricing remains data/static presentation only.
- Signup remains local validation-only behavior; final checks must prove absence of unauthorized side effects.
- Any discovered defect that requires a material requirement/design/spec/architecture change must be routed upstream rather than hidden in integration CSS/JS.

## 10. Implementation Steps

1. Verify all prerequisite tasks, their outputs, and current design/repository snapshots.
2. Inspect the final DOM/component composition and compare major source order/content against the approved brief.
3. Run `pnpm build` before tuning to expose integration/build regressions early.
4. Compare the full page at 375, 768, and 1440 against the authorized Figma references; log only observable residual defects.
5. Check representative narrower/wider/intermediate widths around all fit-driven transitions for overflow, clipping, awkward compression, and order changes.
6. Correct the smallest responsible component/global rule for each confirmed fidelity/reflow defect; avoid unrelated refactors.
7. Run full content/semantic/accessibility regression: one H1, heading/DOM order, brand/decorative semantics, keyboard focus order/visibility, pricing non-interactivity, Signup exact error/no-op behavior and announcement relationship.
8. Confirm Astro starter assets/copy are absent and no unauthorized routes/dependencies/backend/integrations/product states exist.
9. Re-run `pnpm build` and all final manual checks after corrections.
10. Record actual deviations/remaining risks, create the implementation output through workflow lineage, and leave the repository ready for final implementation review.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Static sections expose no invented loading/error/success/selected states.
- Pricing is never interactive.
- Signup retains exactly its approved default, pointer/focus, empty-error, malformed-error, edit-clears-error, and valid-submit-no-op behavior.
- No loading/success/disabled/retry/delivery state appears after valid submit.

### Responsive behavior

- 375/768/1440 should match the supplied source outcomes closely while preserving content-driven behavior.
- Fit-driven breakpoints selected by earlier tasks remain justified at the widths where content would otherwise fail; integration should not replace them with frame-width constants without evidence.
- Major section order never changes across widths.
- No primary content overlaps, clips, becomes unreadably compressed, or forces page-level horizontal scrolling at representative narrow/intermediate/wide widths.
- Zoom/reflow and long error/content strings remain readable/bounded.

### Accessibility

- Exactly one primary H1 and logical heading/landmark/source order.
- Keyboard traversal reaches only genuine controls; Pricing, decorative artwork, and scroll cue remain outside tab order.
- Input and Notify have visible, distinct focus; invalid+focus remains perceivable.
- Signup error remains programmatically related/announced without focus stealing.
- Maker brand is meaningfully named; redundant/decorative artwork is silent.
- Essential state meaning does not depend on animation/motion.

## 12. Validation

### Automated validation

- Build: from `frontend/`, run `pnpm build` before and after final corrections; final expected result is exit 0.
- Use additional automated commands only if they actually exist in the approved task-start repository; otherwise do not invent tests/lint/check scripts.

### Manual validation

- Full-page visual comparison at 375, 768, 1440 against `SRC-DS-001`.
- Fit-driven checks at representative widths immediately below/above implemented transition thresholds and at wider/narrower bounds.
- Content regression: exact section order, all four benefits, approved Free/Premium content/order, final Signup copy.
- Layout regression: no overlap/clipping/primary horizontal scrolling; content wraps and card/form heights remain content-safe.
- Keyboard regression: logical tab order, visible focus, no decorative/pricing focus targets.
- Signup regression: empty, whitespace-only, malformed, valid single-email, edit-after-error, invalid+focus, pointer hover, focus, long error/reflow; exact messages preserved.
- Side-effect regression: valid Signup submit preserves value and causes no navigation/reload/request/storage/delivery/reset/loading/disabled/success behavior; observe browser network/navigation/state.
- Semantic regression: one H1, correct heading/source order, accessible brand, decorative artwork semantics.
- Starter/scope regression: no Astro starter UI/assets rendered/referenced; no unauthorized backend/integration/route/payment/analytics/auth/product state/dependency introduced.

## 13. Acceptance Criteria

- [ ] `REQ-FR-001` / `SPEC-BEH-001`: final page presents Header/Hero → four Benefits → Free/Premium Pricing → Signup in approved logical order.
- [ ] `REQ-NFR-001`: final visual system and hierarchy are source-faithful at supplied references, allowing documented implementation tolerances.
- [ ] `REQ-NFR-002` / `SPEC-BEH-002` / `REQ-AR-006`: responsive/intermediate/zoom layouts reflow without overlap, clipping, semantic reorder, or primary horizontal scrolling.
- [ ] `REQ-FR-006` / `REQ-BR-001`: Pricing remains exact informational Free → Premium content with no transactional affordances.
- [ ] `SPEC-VAL-001`–`SPEC-VAL-003` / `SPEC-ACC-002`: Signup exact errors, stale-error clearing, accessible relationship/announcement, and valid no-op all pass.
- [ ] `REQ-CON-004` and approved scope constraints: no unapproved product capability/runtime/integration/dependency is present.
- [ ] Starter-only UI/assets are absent/unreferenced.
- [ ] Final `pnpm build` and every required manual regression pass.
- [ ] Task-start verification and implementation-output lineage are recorded for final review.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Final tuning becomes a late redesign/refactor | Scope churn and invalidates task ownership | Fix only evidence-backed residual defects in the smallest owning module |
| Parallel task outputs conflict in global CSS/composition | Cross-section regressions | Reconcile against approved source order/tokens and rerun all section checks |
| Visual fidelity pressure reintroduces fixed sizing | Intermediate/zoom failures | Preserve content-driven sizing and verify around transitions after every fix |
| Signup regression introduces accidental side effects | Violates static-scope decision | Explicit network/navigation/storage/state observation on valid submit |
| Remaining source ambiguity is mistaken for defect | Unnecessary divergence | Use approved brief/Figma authority order and document non-blocking assumption/deviation |

## 15. Implementation Discoveries

None recorded during decomposition. During integration, route material source/documentation/architecture discoveries to the owning upstream artifact instead of hiding them in final cleanup.

## 16. Deviations

None during decomposition. Record any final accepted fidelity tolerance, path/interface change, or validation limitation with evidence during implementation.

## 18. Definition of Done

- [ ] All prerequisite tasks are Complete and their outputs verified.
- [ ] Final page objective and acceptance criteria pass across supplied and fit-driven widths.
- [ ] Final build plus required visual/responsive/keyboard/accessibility/content/state/scope regressions pass.
- [ ] No required validation remains failing or unverified.
- [ ] Input/task-start snapshots remain valid or an approved rebaseline is recorded.
- [ ] Final implementation-output snapshot and parent lineage are recorded.
- [ ] Discoveries, deviations, and remaining non-blocking risks are documented.
- [ ] Canonical task/workflow projections reflect completion without manual generated-state edits.
- [ ] Repository is ready for Stage 11 final implementation review; no new scope remains hidden in integration work.

## 19. Completion Report

Complete during Stage 10 implementation:

- Files created/modified/deleted:
- Prerequisite outputs/task-start/final implementation-output snapshots:
- Source verification performed:
- Residual defects corrected:
- Responsive/fidelity results:
- Accessibility/keyboard/state/content/scope results:
- Build/manual validation results:
- Deviations/discoveries/remaining risks:
- Documentation updated:
- Readiness for final implementation review:
