---
artifact: PROJECT-CONTEXT
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
created: 2026-08-19
updated: 2026-08-19
---

# Project Context

## 1. Project

- Project name: Maker pre-launch landing page
- Goal: Implement the prepared Maker pre-launch landing-page design faithfully in the existing Astro frontend, including responsive layouts, interactive hover/focus behavior, and the specified email-validation feedback.
- Project type: Static page
- Profile rationale: Lite fits a single static landing page composed of multiple tightly related sections/components and more than one likely implementation task, while no persistence, authentication, external API, multi-route flow, or meaningful architecture decision is currently evidenced. Upgrade if later inspection introduces those concerns.
- Created: 2026-08-19
- Last updated: 2026-08-19

## 2. Active Source Baseline

- Source baseline: `SOURCE-BASELINE.md`
- Design snapshot: `SRC-DS-001`
- Repository snapshot: `SRC-REPO-001`
- Runtime snapshots: None registered
- Documentation snapshots: None registered
- Asset snapshots: None registered

## 3. Design Scope

- Included: Figma page `🤖 Workflow` (`29:4756`) only.
- Included sections: `Style Guide` (`32:17743`), `Components` (`32:18709`), and `Main page` (`34:19665`).
- Main responsive references: Desktop 1440 px (`32:10924`), Tablet 768 px (`32:11410`), and Mobile 375 px (`32:11529`).
- Main-page sections represented as reusable Figma instances: Hero, Benefits, Pricing, and Signup; Header is represented in the local components area and is consumed within the Hero section component structure.
- Explicitly excluded: Figma pages outside `🤖 Workflow`, including `👋 Overview`, `🎨 Design System`, `🖱️ Prototype`, and `✨ Designs`, unless a later source rebaseline explicitly adds them.
- Access limitations: Connected Figma inspection is available, but no named-version/checksum pin is registered, so the design source remains Time-bound.
- Known design-source dependencies: Local `Foundations` variable collection (37 variables) and local components/component sets. All inspected instances resolve to local main components; no remote-library component dependency was detected in scope.

## 4. Repository Scope

- Target branch: `main`
- Relevant application, package, or directory: `frontend/`
- Existing implementation state: Default Astro starter remains in place; `frontend/src/pages/index.astro` renders `Welcome.astro` rather than the Maker landing page.
- Known technical constraints: Astro `^7.2.3`; Node `>=22.12.0`; ESM project; pnpm lock/workspace files present; implementation instructions in `frontend/AGENTS.md` apply to work under `frontend/`.
- Access or tooling limitations: Repository state is managed through GitHub in this environment; there is no assumed local checkout or CLI runtime. Workflow mutations therefore use the installed GitHub remote executor. Implementation code edits are forbidden until workflow state explicitly authorizes Stage 10 task execution.

## 5. Runtime References

- Production URL referenced by repository/project configuration: `https://maker-pre-launch-landing-page-ferfalcon.vercel.app/`
- Canonical runtime snapshot: None registered at Stage 0.
- Local runtime snapshot: Not available in this environment at Stage 0.

The production URL is contextual only until a `SRC-RUN-*` snapshot is created through the workflow when runtime evidence becomes required.

## 6. Scope

### Included

- Implement the Maker pre-launch landing page in `frontend/` from the authorized Figma `🤖 Workflow` scope.
- Preserve the design system intent represented by local Figma variables, components, responsive variants, and section composition.
- Support responsive behavior across and between the supplied desktop/tablet/mobile references rather than treating the three widths as automatic CSS breakpoints.
- Provide interactive states and email validation required by the repository README.
- Produce semantic, accessible, repository-consistent Astro/HTML/CSS/TypeScript implementation and validate it before final acceptance.

### Excluded

- Editing Figma outside `🤖 Workflow` without explicit authorization.
- Modifying the vendored workflow toolkit under `docs/implementation-workflow/` as part of the landing-page implementation.
- Backend persistence, authentication, authorization, or email-delivery infrastructure unless later requirements explicitly add them.
- Unrelated repository cleanup or refactoring outside the implementation task scope.

### Deferred

- Full design audit and contradiction analysis (Stage 1).
- Precise behavioral/accessibility requirements and acceptance criteria (Lite consolidated documentation stages).
- Architecture decision (Stage 6 unless evidence forces an earlier profile upgrade).
- Task decomposition, implementation, runtime verification, and deployment/final acceptance.

## 7. Authoritative Sources

| Snapshot ID | Authority | Scope | Notes |
|---|---|---|---|
| `SRC-DS-001` | Design | Authorized `🤖 Workflow` page | Primary visual/composition/component/token authority; Time-bound because no named version is registered. |
| `SRC-REPO-001` | Current implementation / technical constraint | Repository baseline at pinned commit, especially `frontend/` | Owns existing Astro structure, package constraints, README behavior requirements, and implementation conventions. |

When design and repository evidence conflict, the contradiction must be recorded and resolved in the stage that owns the affected requirement; neither source silently overwrites the other.

## 8. Quality Baseline

Only source-supported expectations are recorded here.

- Accessibility: Repository README states semantic HTML5 markup as part of the intended implementation approach. Detailed keyboard, focus, screen-reader, contrast, and reflow requirements remain to be made explicit during audit/documentation rather than assumed from Figma alone.
- Responsive coverage: Repository README requires an optimal layout for the user's screen size; Figma supplies 1440 px, 768 px, and 375 px reference compositions.
- Interaction coverage: Repository README requires hover states for interactive elements; Figma components also include explicit Button Default/Hover/Focus and Email Input Default/Active/Focus/Error states.
- Form validation: Empty email must show `Oops! Please add your email`; invalid email format must show `Oops! That doesn’t look like an email address`.
- Browser/device coverage: Not explicitly defined yet.
- Performance expectations: Not explicitly defined yet.
- Security/privacy expectations: No backend, persistence, or personal-data retention requirement is currently evidenced; this must be revisited if submission behavior expands beyond client-side validation.
- Testing expectations: At minimum, the eventual implementation must build successfully and validate required responsive/interactive/form behavior; exact validation checks are defined later with task planning.
- Deployment expectations: Production is hosted on Vercel, but deployment/runtime evidence is not an active Stage 0 snapshot.

## 9. Constraints and Dependencies

| ID | Constraint or dependency | Evidence | Impact | Status |
|---|---|---|---|---|
| `REQ-CON-001` | Implementation root is `frontend/`. | Project configuration + `SRC-REPO-001` | Prevents implementation changes from drifting into toolkit/docs areas. | Confirmed |
| `REQ-CON-002` | Astro `^7.2.3`, Node `>=22.12.0`, ESM, pnpm lock/workspace. | `SRC-REPO-001` | Implementation and validation must respect the existing toolchain. | Confirmed |
| `REQ-CON-003` | Authorized Figma scope is page `29:4756` only. | Project configuration + `SRC-DS-001` | Design edits/reads outside the page are not implementation authority unless explicitly rebaselined. | Confirmed |
| `REQ-CON-004` | Design source is Time-bound rather than immutable. | `SRC-DS-001` | Re-verify before material downstream gates/tasks. | Confirmed |
| `REQ-CON-005` | Workflow runs in Gated mode. | Canonical workflow state | Human approval is required before stage advancement. | Confirmed |

## 10. Known Decisions

| Decision | Owner | Evidence | Status |
|---|---|---|---|
| Use Lite workflow profile. | Workflow initialization | Scope/complexity assessment against pinned toolkit profile rules. | Confirmed |
| Use Gated execution mode. | Project/workflow initialization | Canonical workflow state. | Confirmed |
| Treat `🤖 Workflow` as the only authorized Figma implementation scope. | Project owner | Project configuration + `SRC-DS-001`. | Confirmed |
| Keep implementation under `frontend/`. | Project owner | Project configuration + repository structure. | Confirmed |

## 11. Initial Risks and Questions

### Blocking

- None known after the Stage 0 design and repository snapshot verifications.

### Non-blocking

- Figma is mutable and lacks a registered named version/checksum; later gates must re-verify it.
- The three supplied viewport widths demonstrate reference compositions but do not define the exact responsive interpolation or breakpoint strategy.
- Runtime/Vercel state has not yet been baselined as a canonical source.
- Detailed accessibility behavior, browser matrix, and performance targets are not yet explicit and must be resolved in the appropriate documentation/audit stage.

## 12. Stage 0 Completion

- [x] Scope is explicit.
- [x] `SOURCE-BASELINE.md` exists and contains evidence for the active design and repository snapshots.
- [x] Active snapshot pin strength is honest.
- [x] Design and repository scope are recorded.
- [x] The repository baseline is pinned to a commit SHA in canonical workflow state.
- [x] Workflow profile is selected and justified.
- [x] Quality expectations are limited to source/project-supported evidence and open gaps remain visible.
- [x] Blocking questions and source limitations are visible.
- [x] `WORKFLOW-STATE.md` references the same active baseline.
