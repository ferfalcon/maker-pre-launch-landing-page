---
artifact: TASK
id: P02-T03
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

Workflow-owned task status, baseline, validation state, and output lineage are recorded by `design-workflow`; this narrative defines the implementation contract only.

# Phase 02 — Task 03: Implement accessible signup validation

## 2. Objective

Implement the final Signup section and its exact validation-only interaction using native form semantics and package-free client-side logic: source-supported hover/focus/error visuals, deterministic empty/malformed messages, stale-error clearing on edit, and a valid-submit no-op that performs no delivery, persistence, navigation, loading, reset, or success behavior.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`.
- Consolidated Lite documentation: `IMPLEMENTATION-BRIEF.md`, especially `PLAN-004` and Stage 7 traceability.
- Design snapshot: `SRC-DS-001`; repository baseline: `SRC-REPO-001`.
- Main-page references: Desktop `32:10924`, Tablet `32:11410`, Mobile `32:11529`.
- Component references: Signup `72:2835`, Email Input `32:17773`, Button `32:17765`.
- Requirements: `REQ-FR-002`–`REQ-FR-005`, `REQ-DR-001`, `REQ-AR-001`–`REQ-AR-004`, `REQ-AR-006`, `REQ-CON-006`.
- Specifications: `SPEC-BEH-002`, `SPEC-INT-001`, `SPEC-INT-002`, `SPEC-VAL-001`–`SPEC-VAL-003`, `SPEC-ACC-001`, `SPEC-ACC-002`, `SPEC-ACC-004`, `SPEC-DATA-001`.
- Design intent: `DES-008`, `DES-RWD-005`, `DES-RWD-006`, `DES-INT-001`–`DES-INT-004`.
- Relevant criteria: `AC-045`–`AC-047`, `AC-059`–`AC-060` and the validation/interaction criteria referenced by the approved brief.
- Prerequisite task: `P01-T01`.
- Sibling tasks: `P02-T01`, `P02-T02`; downstream: `P03-T01`.

## 4. Snapshot Verification

Complete immediately before implementation starts.

- Confirm `P01-T01` is Complete and the shared foundation is the expected repository ancestor.
- Re-verify Signup, Email Input, Button, and supplied Main-page variants in `SRC-DS-001`.
- Bind task start to current repository HEAD so approved previous-task output is explicitly classified as expected lineage.
- Confirm the exact approved validation strings and valid-submit no-op remain unchanged in `IMPLEMENTATION-BRIEF.md`.
- Stop for documented rebaseline/discovery if source interaction evidence, messages, or repository foundations changed materially.

## 5. Prerequisites

- `P01-T01` Complete with passing validation and recorded output.
- Shared Maker tokens/layout/asset directory available.
- Design/repository verification clear at task start.
- No backend/API/storage dependency is required or authorized.

## 6. Scope

### Included

- Create the final Signup form/section and use the approved decorative signup artwork.
- Native `<form novalidate>`, one `type="email"` field with accessible name `Email address`, and native submit button `Notify`.
- Prevent browser navigation/reload and suppress native validation bubbles while using native email validity semantics.
- Empty/whitespace-only submit shows exactly `Oops! Please add your email`.
- Non-empty malformed single-email submit shows exactly `Oops! That doesn’t look like an email address`.
- Invalid state is exposed programmatically and error text is associated/announced without moving focus.
- Input after an error clears stale visible/programmatic error state.
- Valid submit clears any error, preserves the current value, and otherwise does nothing.
- Implement pointer hover/active source feedback, distinct keyboard focus-visible styling, recognizable error+focus precedence, and motion-independent settled states.
- Keep input/button inline while comfortable; stack before compression/overflow based on fit rather than automatic 375/768 breakpoints.
- Integrate Signup into `index.astro` as the final major content section.

### Excluded

- Any real email notification delivery, API request, backend, serverless function, storage, persistence, analytics, success state, loading state, retry, reset, or disabled-on-submit behavior.
- Multiple-email entry or email-list management.
- Hero/Benefits (`P02-T01`) or Pricing (`P02-T02`) ownership.
- Final whole-page regression (`P03-T01`).
- New form libraries/client frameworks unless a future approved re-scope explicitly authorizes them.

## 7. Repository Context

The application remains a static Astro page after `P01-T01`. This task may add a small client-side script scoped to the Signup form, but no new runtime boundary or application state architecture is justified. Existing package scripts support `pnpm build`; there is no configured interaction/E2E/accessibility test harness in the approved baseline. The source-authorized behavior deliberately stops at local validation and valid-submit no-op.

## 8. Files and Modules

| Path | Action | Existing or proposed | Responsibility | Evidence |
|---|---|---|---|---|
| `frontend/src/components/SignupForm.astro` | Create | Proposed | Signup markup, validation-only client behavior, states, responsive layout | Figma `72:2835` |
| `frontend/src/assets/maker/` | Add/use asset | Expected directory from `P01-T01` | Decorative signup background/shape | `SRC-DS-001` |
| `frontend/src/pages/index.astro` | Modify only as needed | Existing | Integrate Signup as final major section | `PLAN-004` |
| `frontend/src/styles/global.css` | Modify only for genuine shared focus/reflow primitive needs | Expected | Shared accessibility primitive only, not form-specific styling | `PLAN-001` |

## 9. Dependencies and Interfaces

- Uses shared visual tokens/layout/assets from `P01-T01`.
- Signup client logic must be local to the form and must not introduce global shared application state.
- Browser-native single-email validity is the syntax authority after trimming/empty handling; project-defined text is the displayed error authority.
- Error element/relationship must use stable identifiers so `aria-invalid`/described or error semantics remain deterministic.
- The valid-submit contract is intentionally side-effect free; `P03-T01` must be able to verify no network/navigation/storage/success behavior.

## 10. Implementation Steps

1. Verify Signup design evidence, exact validation strings, approved no-op behavior, and post-foundation repository snapshot.
2. Create semantic Signup form markup with accessible field name, native email input, native submit button, and decorative background treatment.
3. Apply `novalidate` so browser bubbles do not replace the approved messages while retaining native email validity checks in script.
4. Implement submit handling that trims for empty detection, prevents navigation/reload, and selects exactly one approved empty/malformed message when invalid.
5. Expose error state programmatically, associate the message with the input, and announce newly inserted errors without moving focus.
6. Clear stale error UI/attributes when the user edits after an invalid submission.
7. Implement valid submit as a no-op after error clearing: preserve input value and perform no request, storage, delivery, navigation, reset, loading, disabled, or success state.
8. Implement pointer hover/active source states and distinct `:focus-visible` styling with error+focus still recognizable; keep settled states understandable without motion.
9. Implement inline-to-stacked responsive control layout based on actual compression/overflow fit.
10. Integrate Signup as the final section, then run build and all keyboard/state/error/responsive/manual checks.
11. Commit through workflow lineage and record any accessibility-technique/responsive-threshold deviations.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Default: empty email field and `Notify` submit control.
- Hover/active: source-supported pointer feedback only where hover is available.
- Focus: keyboard focus visibly distinct from hover and preserved when invalid.
- Empty error: exactly `Oops! Please add your email`.
- Malformed error: exactly `Oops! That doesn’t look like an email address`.
- Edit-after-error: stale error text/state clears.
- Valid submit: error cleared, value retained, no other state transition or side effect.
- Loading/success/disabled/retry/network states: explicitly Not applicable and must not be introduced.

### Responsive behavior

- Desktop/Tablet: input/button remain inline when comfortable and source-like.
- Mobile/narrow: controls stack with full-width usability before compression/overflow.
- 375/768/1440 are reference outcomes, not automatic breakpoint values.
- Long error text and zoom/reflow must remain readable without clipping or primary-content horizontal scrolling.

### Accessibility

- Native form/input/button semantics; input accessible name is `Email address`.
- Error is programmatically related to the field and invalid state is exposed (for example `aria-invalid` plus stable described/error relationship).
- Newly surfaced errors are announced without forcibly moving focus.
- Keyboard order remains input → Notify, with visible focus on both controls.
- Hover styling does not substitute for keyboard focus styling.
- Error and focus can coexist visually; color is not the only state cue when source/system styling allows additional cues.
- The optional observed transition does not carry essential meaning; reduced/no motion leaves settled states understandable.

## 12. Validation

### Automated validation

- Build: from `frontend/`, run `pnpm build`; expected exit 0.
- Unit/component/E2E, lint, standalone type-check, automated accessibility: no configured repository scripts at task start unless an approved predecessor explicitly added them; do not invent commands.

### Manual validation

- Keyboard-only: Tab reaches email then Notify in logical order; both show visible focus; Enter/Space submit behavior is native and controlled.
- Empty submit and whitespace-only submit each show exactly `Oops! Please add your email` and expose programmatic invalid/error relationship.
- Malformed non-empty input shows exactly `Oops! That doesn’t look like an email address`.
- Valid single email clears current error, retains entered value, and causes no navigation/reload/network/storage/delivery/reset/loading/disabled/success state.
- After either error, typing clears stale visible/programmatic error state before the next submit.
- Check pointer hover/active, keyboard focus, invalid, and invalid+focus visual precedence; settled states remain understandable with motion disabled.
- Check inline/stacked behavior at 375, 768, 1440 and fit-driven widths around the actual transition; no overflow or clipped long error text.
- Use browser devtools/network observation during valid submit to confirm zero request generated by the form behavior.

## 13. Acceptance Criteria

- [ ] `REQ-FR-003` / `SPEC-INT-001` / `SPEC-INT-002`: source-supported pointer and keyboard interaction states are represented without conflating hover and focus.
- [ ] `REQ-FR-004` / `SPEC-VAL-001`: empty and whitespace-only values show exactly `Oops! Please add your email`.
- [ ] `REQ-FR-005` / `SPEC-VAL-002`: malformed non-empty values show exactly `Oops! That doesn’t look like an email address`.
- [ ] `SPEC-VAL-003` / `SPEC-DATA-001` / `DES-INT-004`: valid submit preserves value and produces no navigation, reload, network, storage, delivery, loading, reset, disabled, or success behavior.
- [ ] `REQ-AR-004` / `SPEC-ACC-002`: invalid state/error relationship and announcement are programmatically available without moving focus.
- [ ] `SPEC-ACC-004`: keyboard focus remains visible and distinguishable, including alongside error state.
- [ ] `REQ-FR-002` / `REQ-AR-006`: controls reflow from inline to stacked based on fit without clipping/primary horizontal scrolling.
- [ ] `REQ-CON-006`: no backend/integration/runtime boundary is added.
- [ ] `pnpm build` and all manual interaction/error/responsive/accessibility checks pass.
- [ ] Task-start verification and implementation-output lineage are recorded.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Browser native bubble overrides project copy | Wrong observable messages | Use `novalidate`; use native validity only as logic input |
| Error announcement technique is too weak or too intrusive | Accessibility regression | Use stable field/error relationship and a restrained live/error announcement; keyboard/manual verify |
| Valid submit accidentally posts/reloads or resets | Violates approved static scope | Always prevent default; preserve value; observe browser navigation/network/storage |
| Hover and focus styles collapse into one state | Keyboard users lose visible focus distinction | Implement and manually inspect separate hover-capable and focus-visible rules |
| Breakpoint chosen from reference width alone | Compressed intermediate form | Transition based on control fit; test immediately around chosen threshold |

## 15. Implementation Discoveries

None recorded during decomposition. Record any mismatch in source states, message contract, browser validity behavior, or foundation constraints before changing approved behavior.

## 16. Deviations

None during decomposition. During implementation, record the chosen error-announcement technique, fit threshold, and any approved departure from planned paths/semantics.

## 18. Definition of Done

- [ ] Objective and exact behavior contract are implemented within scope.
- [ ] Build and every required keyboard/state/error/responsive/accessibility check pass.
- [ ] No required validation remains failing or unverified.
- [ ] No unauthorized network, persistence, delivery, loading, success, reset, disabled, or backend behavior exists.
- [ ] Prerequisite output/task-start snapshots are verified or formally rebaselined.
- [ ] Implementation-output snapshot and parent lineage are recorded.
- [ ] Material discoveries/deviations are documented.
- [ ] Canonical task/workflow projections reflect completion without manual generated-state edits.
- [ ] `P03-T01` can regression-test Signup with deterministic observable behavior.

## 19. Completion Report

Complete during Stage 10 implementation:

- Files created/modified/deleted:
- Task-start and implementation-output snapshots:
- Source verification performed:
- Validation/error behavior implemented:
- Accessibility relationship/announcement technique:
- Responsive threshold/rationale:
- Validation executed/results:
- Deviations/discoveries/remaining risks:
- Documentation updated:
- Next unblocked task:
