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

- [x] `REQ-FR-001` / `SPEC-BEH-001`: final page presents Header/Hero → four Benefits → Free/Premium Pricing → Signup in approved logical order.
- [x] `REQ-NFR-001`: final visual system and hierarchy are source-faithful at supplied references, allowing documented implementation tolerances.
- [x] `REQ-NFR-002` / `SPEC-BEH-002` / `REQ-AR-006`: responsive/intermediate/zoom layouts reflow without overlap, clipping, semantic reorder, or primary horizontal scrolling.
- [x] `REQ-FR-006` / `REQ-BR-001`: Pricing remains exact informational Free → Premium content with no transactional affordances.
- [x] `SPEC-VAL-001`–`SPEC-VAL-003` / `SPEC-ACC-002`: Signup exact errors, stale-error clearing, accessible relationship/announcement, and valid no-op all pass.
- [x] `REQ-CON-004` and approved scope constraints: no unapproved product capability/runtime/integration/dependency is present.
- [x] Starter-only UI/assets are absent/unreferenced.
- [x] Final `pnpm build` and every required manual regression pass with the implementation-environment note recorded in Section 16.
- [ ] Task-start verification and implementation-output lineage are recorded for final review. The task-start lineage is verified; the exact implementation-output commit is bound by the workflow-owned completion command after this narrative commit.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Final tuning becomes a late redesign/refactor | Scope churn and invalidates task ownership | Fix only evidence-backed residual defects in the smallest owning module |
| Parallel task outputs conflict in global CSS/composition | Cross-section regressions | Reconcile against approved source order/tokens and rerun all section checks |
| Visual fidelity pressure reintroduces fixed sizing | Intermediate/zoom failures | Preserve content-driven sizing and verify around transitions after every fix |
| Signup regression introduces accidental side effects | Violates static-scope decision | Explicit network/navigation/storage/state observation on valid submit |
| Remaining source ambiguity is mistaken for defect | Unnecessary divergence | Use approved brief/Figma authority order and document non-blocking assumption/deviation |

## 15. Implementation Discoveries

- The current implementation already integrates all prerequisite outputs without a residual code defect. No frontend edit was justified by the final regression.
- The Figma Email Input component set (`32:17773`) still exposes `Default`, `Active`, `Focus`, and `Error` variants. Direct node inspection confirms the active cyan treatment and error-copy treatment remain consistent with the approved Signup implementation; no hidden error-border requirement was introduced.
- Starting `P03-T01` from the merge topology on `main` correctly failed repository-integrity preflight because the merged prerequisite implementation paths appeared after `SRC-REPO-009`. Re-starting from the canonical `P02-T03` completion-bookkeeping lineage resolved the topology mismatch without bypassing workflow checks.

## 16. Deviations

- No product, design, architecture, dependency, or frontend-code deviation was required.
- Validation environment note: sandboxed Chromium blocks direct navigation to external and local URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. Runtime authority was therefore split across Vercel and a local browser mirror: Vercel verified the exact task-start deployment as `READY`, returned the rendered page HTML with HTTP 200, and recorded a successful `pnpm run build` → `astro build`; Chromium then exercised a mirror of the current DOM/CSS/Signup JS for responsive, keyboard, validation, long-error, and reduced-motion behavior. The authoritative Figma 375/768/1440 frames and component variants were rendered and inspected directly. This limitation did not require or justify an implementation change.

## 18. Definition of Done

- [x] All prerequisite tasks are Complete and their outputs verified.
- [x] Final page objective and acceptance criteria pass across supplied and fit-driven widths.
- [x] Final build plus required visual/responsive/keyboard/accessibility/content/state/scope regressions pass.
- [x] No required validation remains failing or materially unverified; the browser-host restriction is mitigated and documented in Section 16.
- [x] Input/task-start snapshots remain valid; no rebaseline was required.
- [ ] Final implementation-output snapshot and parent lineage are recorded. The workflow-owned completion command will bind this narrative commit as the output snapshot.
- [x] Discoveries, deviations, and remaining non-blocking risks are documented.
- [ ] Canonical task/workflow projections reflect completion without manual generated-state edits. This is finalized by the workflow-owned completion command.
- [x] Repository is ready for Stage 11 final implementation review; no new scope remains hidden in integration work.

## 19. Completion Report

- Files created/modified/deleted: no `frontend/` files changed; only this task narrative was updated with final integration evidence.
- Prerequisite outputs/task-start/final implementation-output snapshots: `P01-T01`, `P02-T01`, `P02-T02`, and `P02-T03` were already Complete with recorded outputs. Canonical parent `0d4ae2c3ac1812c72b86a686967ce1c34da1eb4c` was used for task start; workflow start produced `98e47c699dca92a585ef80349d5c97d38fc42ab5` and `SRC-REPO-010`. This narrative commit is the implementation-output candidate to be bound by `task complete`.
- Source verification performed: re-verified authorized Figma page `29:4756` (`🤖 Workflow`), sections `32:17743`, `32:18709`, `34:19665`; Main-page frames Desktop `32:10924` (1440×2562), Tablet `32:11410` (768×2903), Mobile `32:11529` (375×3466); Header/Hero/Benefit Card/Benefits/Pricing Card/Pricing/Signup/Email Input/Button component families; and current prerequisite repository output lineage.
- Residual defects corrected: none. Integration/source review found no evidence-backed defect, so no unrelated refactor or CSS/JS tuning was introduced.
- Responsive/fidelity results: authoritative Figma frame renders were inspected at 375/768/1440. Current layout rules preserve the approved compositions. Chromium reflow checks at 320, 375, 500, 509, 510, 520, 639, 640, 768, 991, 992, 1199, 1200, and 1440 showed no page-level horizontal overflow. Fit-driven transitions remain at 510 px (Signup row), 640 px (Hero/tablet composition), 992 px (Pricing two-column grid), and 1200 px (Benefits desktop grid).
- Accessibility/keyboard/state/content/scope results: exactly one H1 and one main; headings/source order remain logical; the only focusable controls are Email then Get notified; Pricing has zero focus targets; both controls expose a visible 3 px cyan focus outline with 4 px offset; invalid+focus remains visible; decorative art stays silent and Maker is named. Empty and whitespace-only input return `Oops! Please add your email`; malformed returns `Oops! That doesn’t look like an email address`; edit clears stale error/`aria-invalid`; valid submit preserves the email, clears error state, remains enabled, and does not navigate/reset/add a success/loading state. Enter and Space exercise the same validation behavior. Long error copy wraps at 320 px without overflow. Reduced-motion forces transition durations to `0.01ms`.
- Build/manual validation results: exact task-start Vercel preview `dpl_25p6r8K5JZwedTCcmDZ14DBrSzFY` for commit `98e47c699dca92a585ef80349d5c97d38fc42ab5` is `READY`; build logs show `pnpm run build`, `astro build`, one static `/index.html`, and successful deployment. Vercel rendered HTML returned HTTP 200 and matches the approved section/content/Signup script. Manual visual, responsive, semantic, keyboard, state, side-effect, starter/scope, and source checks passed with the environment note in Section 16.
- Deviations/discoveries/remaining risks: no implementation deviation and no blocking risk. The only tooling limitation is direct Chromium URL navigation in this sandbox; it was mitigated as described in Section 16.
- Documentation updated: this `Phase-03--Task-01.md` implementation discovery/deviation/acceptance/DoD/completion evidence.
- Readiness for final implementation review: ready. No new product scope remains; the next action after workflow-owned task completion is the Stage 10/Stage 11 gate selected by the canonical projection.
