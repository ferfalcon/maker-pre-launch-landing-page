---
artifact: TASK
id: P01-T01
created: 2026-08-20
updated: 2026-08-20
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

Workflow-owned task status, baseline, validation state, and output lineage are recorded by `design-workflow`; this narrative defines the implementation contract only.

# Phase 01 — Task 01: Establish Maker page foundation and authorized assets

## 2. Objective

Replace the Astro starter shell with the semantic, source-authorized Maker landing-page foundation: global visual tokens and base styles, Header/Hero structure, local Maker design assets, and the page composition entry point needed by downstream section tasks, without adding product behavior outside the approved static scope.

## 3. Source References

- Source baseline: `SOURCE-BASELINE.md`.
- Consolidated Lite documentation: `IMPLEMENTATION-BRIEF.md`, especially `PLAN-001` and the Stage 7 traceability table.
- Design snapshot: `SRC-DS-001` — authorized Figma page `29:4756` (`🤖 Workflow`).
- Repository baseline: `SRC-REPO-001`.
- Main-page references: Desktop `32:10924`, Tablet `32:11410`, Mobile `32:11529`.
- Component references: Header `78:3069`, Hero `79:3868`.
- Requirements: `REQ-FR-001`, `REQ-NFR-001`, `REQ-AR-001`, `REQ-AR-005`, `REQ-CON-001`, `REQ-CON-002`.
- Specifications: `SPEC-BEH-001`, `SPEC-ACC-001`, `SPEC-ACC-003`.
- Design intent: `DES-001`–`DES-005`.
- Related tasks: prerequisite for `P02-T01`, `P02-T02`, and `P02-T03`.

## 4. Snapshot Verification

Complete immediately before implementation starts.

- Re-verify `SRC-DS-001` against the authorized Figma scope and confirm the referenced Header/Hero/Main-page evidence remains materially unchanged.
- Confirm the task-start repository snapshot is the expected descendant of `SRC-REPO-001` and contains only approved workflow output beyond that baseline.
- Classify any difference as `Unchanged`, `Expected previous-task output`, `Unexpected concurrent change`, or `Unavailable`.
- Do not implement against an unexpected material source or repository change; record and resolve rebaseline/discovery requirements first.

## 5. Prerequisites

- Stage 9 task set and this task artifact approved.
- `SRC-DS-001` and `SRC-REPO-001` verification clear at task start.
- Authorized Figma asset export remains accessible.
- No implementation-task prerequisite; this is the first implementation task.

## 6. Scope

### Included

- Replace starter page/layout presentation with the Maker semantic page shell.
- Establish source-derived global color, spacing, radius, typography, focus, and bounded-layout foundations.
- Add Header and Hero components sufficient to establish the top-of-page structure and downstream composition contract.
- Export/store required Maker logo, Hero artwork, scroll cue, and shared authorized visual assets locally under the implementation root.
- Resolve a licensed, repository-appropriate Manrope delivery approach; document any dependency if one is required.
- Remove Astro starter component/assets only after all references are removed.
- Establish one primary H1, logical landmark/heading order, decorative-image semantics, and no page-level primary-content horizontal overflow.

### Excluded

- Full Benefits implementation (`P02-T01`).
- Pricing implementation (`P02-T02`).
- Signup validation/interaction (`P02-T03`).
- Final cross-section fidelity regression (`P03-T01`).
- Backend delivery, persistence, authentication, analytics, billing, extra routes, or a client UI framework.

## 7. Repository Context

At `SRC-REPO-001`, `frontend/` is an Astro static starter. Existing relevant paths include `frontend/src/layouts/Layout.astro`, `frontend/src/pages/index.astro`, `frontend/src/components/Welcome.astro`, and starter assets under `frontend/src/assets/`. The package exposes `dev`, `build`, `preview`, and `astro`; `pnpm build` is the only confirmed automated validation command. No project lint, test, accessibility, or visual-regression harness is configured. Follow `frontend/AGENTS.md` and keep implementation inside `frontend/`.

## 8. Files and Modules

| Path | Action | Existing or proposed | Responsibility | Repository evidence |
|---|---|---|---|---|
| `frontend/src/layouts/Layout.astro` | Modify | Existing | Document shell, metadata, global-style entry point | `SRC-REPO-001` |
| `frontend/src/pages/index.astro` | Modify | Existing | Maker page composition in approved reading order | `SRC-REPO-001` |
| `frontend/src/styles/global.css` | Create | Proposed | Source-derived tokens, reset/base rules, shared bounded-layout/focus foundations | `PLAN-001` |
| `frontend/src/components/Header.astro` | Create | Proposed | Maker brand/header structure | `PLAN-001`, Figma `78:3069` |
| `frontend/src/components/Hero.astro` | Create | Proposed | Hero semantic/content/artwork structure | `PLAN-001`, Figma `79:3868` |
| `frontend/src/assets/maker/` | Create/populate | Proposed | Authorized local Maker visual assets | `SRC-DS-001` |
| `frontend/src/components/Welcome.astro` | Delete after unreferenced | Existing | Remove starter-only UI | `SRC-REPO-001` |
| `frontend/src/assets/astro.svg` | Delete after unreferenced | Existing | Remove starter-only asset | `SRC-REPO-001` |
| `frontend/src/assets/background.svg` | Delete after unreferenced | Existing | Remove starter-only asset | `SRC-REPO-001` |

## 9. Dependencies and Interfaces

- Provides the shared page/layout/CSS/assets contract consumed by all Phase 02 tasks.
- Header/Hero markup must remain semantic and source-ordered so later responsive styling cannot require DOM reordering.
- Shared CSS must stay foundational; section-specific styling belongs to owning components/tasks.
- Local asset filenames/paths should be stable enough for downstream Benefits, Pricing, and Signup tasks.
- Do not add a package or external font service silently; any new delivery dependency must be justified and remain within the approved static boundary.

## 10. Implementation Steps

1. Re-verify design and repository snapshots and classify differences.
2. Inspect current layout/page/starter references and confirm the deletion set.
3. Export the required authorized Maker logo/Hero/shared artwork into a local Maker asset directory with appropriate semantic treatment.
4. Establish global source-derived visual tokens, reset/base rules, typography roles, focus foundations, and bounded responsive page primitives.
5. Update `Layout.astro` for Maker metadata/document shell and global-style loading.
6. Create Header and Hero components with one primary H1, logical DOM order, accessible brand treatment, and decorative Hero/scroll artwork excluded from interaction.
7. Replace starter composition in `index.astro` with the approved top-level Maker page structure, leaving clear integration points for downstream sections.
8. Remove starter-only component/assets after verifying no references remain.
9. Resolve/document the Manrope delivery strategy without exceeding approved dependency/runtime scope.
10. Run required automated and manual validation, then commit the task result through the workflow lineage process.

Do not implement downstream section behavior in this task.

## 11. State, Responsive, and Accessibility Requirements

### States and errors

- Default: static Header/Hero/page foundation only.
- Loading: Not applicable; no source-authorized loading state.
- Empty: Not applicable; source-authored content is static.
- Error: Not applicable at this layer.
- Success/disabled: Not applicable.

### Responsive behavior

- Use bounded/mobile-first foundations that can reproduce the supplied 375/768/1440 compositions without treating those widths as mandatory breakpoint values.
- Preserve major source reading order regardless of visual positioning.
- Avoid fixed dimensions that cause primary-content clipping or horizontal page scrolling at intermediate/narrower widths.
- Leave section-specific layout transitions to their owning tasks.

### Accessibility

- Exactly one page-level H1.
- Semantic document/landmark/heading order follows Header/Hero → Benefits → Pricing → Signup.
- Maker brand equivalent has an accessible name; decorative Hero illustration and scroll cue are silent and non-focusable.
- Shared focus-visible styles must remain clearly perceivable and not depend on animation.
- Global styles must support zoom/reflow and readable wrapping rather than fixed clipping.

## 12. Validation

### Automated validation

- Build: from `frontend/`, run `pnpm build`; expected result is exit 0 with the Maker foundation compiled successfully.
- Unit/component/E2E tests, linting, and separate type-checking: no configured repository scripts at task start; do not invent commands.

### Manual validation

- Inspect rendered/compiled DOM for exactly one H1 and correct major-section source order/integration placeholders.
- Verify the Maker logo is meaningfully named and decorative Hero/scroll artwork is absent from the tab order/accessibility noise.
- Verify Astro starter copy/artwork/components are no longer rendered and deleted files are unreferenced.
- Check narrow, intermediate, 375, 768, and 1440 widths for bounded content and no primary-content horizontal page scrolling.
- Compare Header/Hero foundation and source-derived visual roles against `SRC-DS-001` without claiming final section fidelity.
- Confirm no new backend, persistence, analytics, billing, authentication, extra route, or unsupported runtime dependency was introduced.

## 13. Acceptance Criteria

- [ ] `REQ-FR-001` / `SPEC-BEH-001`: the single-page Maker composition shell preserves approved logical reading order.
- [ ] `REQ-NFR-001`: global visual foundations derive from the approved Maker system rather than Astro starter styling.
- [ ] `REQ-AR-001` / `SPEC-ACC-001`: semantic page and heading structure is valid with exactly one primary H1.
- [ ] `REQ-AR-005` / `SPEC-ACC-003`: brand/decorative asset semantics are correct; the scroll cue is not focusable.
- [ ] `REQ-CON-001` / `REQ-CON-002`: implementation stays within the existing Astro/static boundary and supported toolchain.
- [ ] Starter-only component/assets are removed after reference cleanup.
- [ ] `pnpm build` passes and the defined manual checks pass.
- [ ] Task-start verification and implementation-output lineage are recorded by the workflow.

## 14. Risks and Considerations

| Risk or assumption | Impact | Mitigation or validation |
|---|---|---|
| Manrope delivery is not present in the baseline | Visual mismatch or unapproved dependency | Choose a licensed repository-appropriate approach; record/justify any dependency before adding it |
| Figma artwork export sizing/cropping differs from source | Hero/header fidelity drift | Export from authorized nodes and compare at supplied viewports |
| Premature global breakpoints overfit reference frames | Downstream reflow defects | Keep foundations fit-driven; defer section transitions to owning tasks |
| Starter asset deletion occurs too early | Broken imports/build | Delete only after reference inspection and build verification |

## 15. Implementation Discoveries

None recorded during decomposition. Any material source, repository, typography, or asset discrepancy discovered during implementation must be recorded against the owning upstream artifact/task before workaround.

## 16. Deviations

None during decomposition. Record any approved departure from paths, source semantics, dependency assumptions, or validation here during implementation.

## 18. Definition of Done

- [ ] Objective is implemented within the defined scope.
- [ ] Acceptance criteria and required validation pass.
- [ ] No required validation remains failing or unverified.
- [ ] Input snapshots remain valid or an approved rebaseline is recorded.
- [ ] Implementation-output repository snapshot and parent lineage are recorded.
- [ ] Relevant task documentation/deviations/risks are updated.
- [ ] Canonical task/workflow projections reflect completion; no manual edit is made to `.workflow/generated/` or the workflow record.
- [ ] Phase 02 tasks have stable shared foundations/assets and enough context to start.

## 19. Completion Report

Complete during Stage 10 implementation:

- Files created, modified, or deleted:
- Input snapshot IDs used:
- Task-start repository snapshot:
- Implementation-output repository snapshot:
- Source verification performed:
- Behavior implemented:
- Validation executed and results:
- Deviations/discoveries:
- Remaining risks:
- Documentation updated:
- Next unblocked task(s):
