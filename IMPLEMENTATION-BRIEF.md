---
artifact: IMPLEMENTATION-BRIEF
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime: []
  documentation: []
  assets: []
created: 2026-08-19
updated: 2026-08-19
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
---

# Implementation Brief

## 1. Document Information

- Scope: Maker pre-launch landing page requirements for the authorized `🤖 Workflow` design scope and pinned repository baseline.
- Last updated: 2026-08-19
- Project context: `PROJECT-CONTEXT.md`
- Source baseline: `SOURCE-BASELINE.md`
- Evidence baseline: `DESIGN-AUDIT.md`
- Repository snapshot: `SRC-REPO-001`

## 2. Requirements

### Goals and non-goals

#### Goals

- Deliver one faithful Maker pre-launch landing page using the approved design and repository baselines.
- Preserve the demonstrated content hierarchy and responsive transformations across the supplied desktop, tablet, and mobile reference compositions while remaining usable between those examples.
- Present the product benefits and pricing information shown in the authorized design.
- Provide the launch-notification email field and the two repository-specified validation errors without inventing an unsupported successful-submission flow.
- Deliver semantic and accessible interaction behavior for the page and its form controls.

#### Non-goals

- Backend persistence, email delivery, authentication, authorization, accounts, or user-specific state.
- Checkout, subscription billing, payment processing, or other transactional behavior for the displayed pricing plans.
- Additional routes, screens, or product flows not demonstrated by the authorized source baseline.
- Editing Figma outside page `29:4756` or modifying the vendored workflow toolkit as part of implementation.
- Defining unsupported browser matrices, performance thresholds, privacy/retention policy, or analytics behavior.

### Users and outcomes

- Primary user: a visitor evaluating Maker before launch.
- The visitor must be able to understand the product proposition, review the four benefits, compare the two displayed plans, and reach the launch-notification form in the same content order represented by the approved design.
- A visitor submitting an empty or malformed email must receive the source-authorized error message for that condition.
- No authenticated, administrative, or returning-user capability is currently in scope.

### Functional requirements

#### REQ-FR-001 — Preserve the landing-page content structure

- Classification: Confirmed
- Priority: Must
- Description: The page must present the approved Maker landing-page content as a single vertical experience containing the logo/header area, Hero, four Benefits, Pricing with two plans, and Signup content in the source-authorized reading order.
- Rationale: The design audit confirms one single-page composition and a consistent hierarchy across all three supplied viewport references.
- Snapshot or evidence: `SRC-DS-001`, `EVD-001`, `EVD-002`, `EVD-003`.
- Acceptance criteria:
  - `AC-001`: All source-authorized content groups are present on the single landing page.
  - `AC-002`: The logical content order remains header/hero → benefits → pricing → signup across responsive layouts.

#### REQ-FR-002 — Reproduce the demonstrated responsive transformations

- Classification: Confirmed
- Priority: Must
- Description: The page must reproduce the material layout transformations demonstrated by the 1440 px, 768 px, and 375 px design references without treating those widths as automatic implementation breakpoints.
- Rationale: The design provides explicit Desktop, Tablet, and Mobile variants and the repository requires an optimal layout for the visitor's screen size.
- Snapshot or evidence: `SRC-DS-001`, `SRC-REPO-001`, `EVD-004`, `AUD-004`, repository README “The job”.
- Acceptance criteria:
  - `AC-003`: At the desktop reference composition, benefits are presented in the demonstrated four-column arrangement, pricing cards are side by side, and the signup controls are inline.
  - `AC-004`: At the tablet reference composition, benefits use the demonstrated row treatment, pricing cards are stacked, and signup controls remain inline.
  - `AC-005`: At the mobile reference composition, hero imagery uses the demonstrated top cluster, benefits use the demonstrated centered vertical treatment, pricing remains stacked, and signup controls stack vertically.
  - `AC-006`: Responsive behavior between supplied references preserves content order and usability rather than switching only at the literal source-frame widths.

#### REQ-FR-003 — Provide source-supported interactive visual states

- Classification: Confirmed
- Priority: Must
- Description: Interactive elements with source-supported states must expose the corresponding visible feedback, including the Notify button hover state and the email-control states demonstrated by the authorized components. The precise semantic meaning of the input `Active` variant remains a later specification decision.
- Rationale: The repository explicitly requires hover states and Figma contains Button Default/Hover/Focus plus Email Input Default/Active/Focus/Error variants.
- Snapshot or evidence: `SRC-DS-001`, `SRC-REPO-001`, `EVD-009`, `EVD-010`, `AUD-001`, repository README “The job”.
- Acceptance criteria:
  - `AC-007`: The Notify button provides the demonstrated hover feedback when hover is available.
  - `AC-008`: Required input/button states are visually distinguishable without inventing state behavior not supported by the current requirements or later specification.

#### REQ-FR-004 — Validate an empty email on form submission

- Classification: Confirmed
- Priority: Must
- Description: When the launch-notification form is submitted with the `Email address` field empty, the page must show `Oops! Please add your email` as the validation error for that field.
- Rationale: The repository baseline explicitly defines the empty-field validation outcome, resolving the absence of a separate empty-state error variant in Figma.
- Snapshot or evidence: `SRC-REPO-001`, `AUD-002`, repository README “The job”.
- Acceptance criteria:
  - `AC-009`: Submitting with no email value does not present the malformed-email message.
  - `AC-010`: The visible error text is exactly `Oops! Please add your email`.

#### REQ-FR-005 — Validate malformed email format on form submission

- Classification: Confirmed
- Priority: Must
- Description: When the launch-notification form is submitted with a non-empty value that is not correctly formatted as an email address, the page must show `Oops! That doesn’t look like an email address`.
- Rationale: Both the repository baseline and the Figma error-state content support this validation outcome.
- Snapshot or evidence: `SRC-REPO-001`, `SRC-DS-001`, `EVD-008`, repository README “The job”.
- Acceptance criteria:
  - `AC-011`: A non-empty malformed email produces the malformed-email error state.
  - `AC-012`: The visible error text is exactly `Oops! That doesn’t look like an email address`.

#### REQ-FR-006 — Preserve the approved pricing presentation

- Classification: Confirmed
- Priority: Must
- Description: The pricing section must present the source-authorized Free and Premium plans, including the Premium `$25.00 / month` price and the plan descriptions/features shown in the approved design. This requirement is informational and does not introduce billing behavior.
- Rationale: Pricing content is part of the primary page hierarchy and is explicitly visible in the authorized design.
- Snapshot or evidence: `SRC-DS-001`, `EVD-001`, `DESIGN-AUDIT.md` §13.
- Acceptance criteria:
  - `AC-013`: Plan names, displayed price, descriptions, and feature content match the approved design source without adding checkout or payment controls.

### Business and data requirements

#### REQ-BR-001 — Pricing is display-only in the current scope

- Classification: Confirmed
- Priority: Must
- Description: The displayed plans communicate pre-launch pricing information only; selecting, purchasing, subscribing to, or paying for a plan is outside the current product scope.
- Rationale: No transactional flow is demonstrated, and backend/payment behavior is explicitly excluded by the approved project context.
- Snapshot or evidence: `SRC-DS-001`, `PROJECT-CONTEXT.md` §§6–7, `DESIGN-AUDIT.md` §§6 and 13.
- Acceptance criteria:
  - `AC-014`: The delivered landing page does not introduce checkout, payment, subscription, or plan-selection behavior absent from the approved baseline.

#### REQ-DR-001 — Email is the only visitor-entered data in scope

- Classification: Confirmed
- Priority: Must
- Description: The current experience accepts one visitor-entered email string for form validation. Persistence, transport, retention, delivery, profiling, or reuse of that value is not required by the current baseline.
- Rationale: The authorized design contains a single email input, while the approved project context explicitly excludes backend persistence and email-delivery infrastructure.
- Snapshot or evidence: `SRC-DS-001`, `SRC-REPO-001`, `PROJECT-CONTEXT.md` §6, `DESIGN-AUDIT.md` §13.
- Acceptance criteria:
  - `AC-015`: No additional visitor data field or persistence/transport behavior is introduced without a later approved requirement/source change.

### Non-functional requirements

#### REQ-NFR-001 — Preserve approved visual intent

- Classification: Confirmed
- Priority: Must
- Description: The implementation must preserve the approved visual system and composition closely enough that typography hierarchy, color roles, spacing/radius intent, illustrations, cards, and section relationships remain recognizably faithful to `SRC-DS-001` across the supplied reference layouts.
- Rationale: Faithful implementation is the project goal, and the design audit records the local variables, styles, component sets, and responsive compositions used as evidence.
- Snapshot or evidence: `SRC-DS-001`, `EVD-002`, `EVD-005`, `EVD-006`, `EVD-007`, `PROJECT-CONTEXT.md` §§1 and 6.
- Acceptance criteria:
  - `AC-016`: Material typography, color, spacing, illustration, card, and section-composition differences from the approved source are absent unless documented by a later approved design/specification decision.

#### REQ-NFR-002 — Maintain continuous responsive usability

- Classification: Confirmed
- Priority: Must
- Description: The page must remain readable and operable across supported viewport widths, with no material overlap, clipping, or page-level horizontal scrolling caused by the primary content.
- Rationale: The repository requires an optimal layout for the user's screen size, while the design supplies only three reference compositions and explicitly leaves intermediate widths open.
- Snapshot or evidence: `SRC-REPO-001`, `SRC-DS-001`, `AUD-004`, `PROJECT-CONTEXT.md` §§6 and 8.
- Acceptance criteria:
  - `AC-017`: Primary page content remains visible and usable between the supplied reference compositions without overlap, clipping, or unintended horizontal page scrolling.

### Accessibility requirements

#### REQ-AR-001 — Use semantic document and form structure

- Classification: Confirmed
- Priority: Must
- Description: The page must use semantic document structure appropriate to the content hierarchy, and the signup must expose a real form control with an accessible name plus an operable submission control.
- Rationale: Semantic HTML5 and accessible implementation are part of the approved repository/project quality baseline; Figma alone does not establish semantics.
- Snapshot or evidence: `SRC-REPO-001`, `PROJECT-CONTEXT.md` §§6 and 8, `EVD-002`.
- Acceptance criteria:
  - `AC-018`: Headings/sections convey the page hierarchy programmatically and the email field/button expose appropriate native or equivalent semantics and accessible names.

#### REQ-AR-002 — Support keyboard operation in logical order

- Classification: Recommended
- Priority: Must
- Description: A keyboard user must be able to reach and operate the email field and Notify control in a logical order consistent with the page reading order.
- Rationale: The approved scope requires an accessible result, while the design audit identifies keyboard/focus order as missing evidence that must be resolved downstream rather than assumed from Figma.
- Snapshot or evidence: `PROJECT-CONTEXT.md` §6, `EVD-003`, `AUD-005`.
- Acceptance criteria:
  - `AC-019`: The form controls are keyboard reachable and operable in logical source order without a pointer.

#### REQ-AR-003 — Preserve visible focus indication

- Classification: Confirmed
- Priority: Must
- Description: Keyboard focus on the email field and Notify control must have a clearly visible indication consistent with the explicit focus-state intent in the approved design.
- Rationale: Separate Focus variants exist for both controls.
- Snapshot or evidence: `SRC-DS-001`, `EVD-011`, `AUD-005`.
- Acceptance criteria:
  - `AC-020`: Keyboard focus is visibly distinguishable on both form controls and is not removed without an equivalent replacement.

#### REQ-AR-004 — Expose validation errors programmatically

- Classification: Recommended
- Priority: Must
- Description: When an email validation error is shown, it must be programmatically associated with the email field and exposed to assistive technology so the error is not conveyed only visually.
- Rationale: Error visuals are demonstrated, but screen-reader error communication is explicitly missing from Figma and must be resolved for the approved accessible implementation scope.
- Snapshot or evidence: `PROJECT-CONTEXT.md` §8, `EVD-008`, `AUD-005`.
- Acceptance criteria:
  - `AC-021`: The active validation message has a programmatic relationship to the email field and can be discovered by assistive technology when the error state is presented.

#### REQ-AR-005 — Treat illustrations and icons according to their meaning

- Classification: Recommended
- Priority: Must
- Description: Decorative imagery must not create redundant assistive-technology output, while imagery that conveys meaning must receive an appropriate accessible text alternative.
- Rationale: The design audit identifies illustration alt/decorative roles as an unresolved accessibility gap.
- Snapshot or evidence: `AUD-006`, `DESIGN-AUDIT.md` §§14–15.
- Acceptance criteria:
  - `AC-022`: Each material illustration/icon is implemented as either intentionally decorative or meaningfully described according to its role; no unresolved image semantics remain at validation.

#### REQ-AR-006 — Preserve usability under reflow

- Classification: Recommended
- Priority: Should
- Description: Content and form controls should remain readable and operable when available width is reduced by viewport size or zoom-driven reflow, without requiring two-dimensional scrolling for the primary experience.
- Rationale: The project requires responsive and accessible implementation, but Figma provides only three fixed reference widths.
- Snapshot or evidence: `PROJECT-CONTEXT.md` §§6 and 8, `AUD-004`, `DESIGN-AUDIT.md` §15.
- Acceptance criteria:
  - `AC-023`: Narrow/reflowed layouts preserve access to all primary content and form controls without horizontal scrolling as a prerequisite for normal reading/operation.

### Constraints

The approved Stage 0 project context already defines `REQ-CON-001`–`REQ-CON-005`. They are referenced here rather than redefined to avoid duplicate identifier ownership:

- `REQ-CON-001`: Implementation root is `frontend/`.
- `REQ-CON-002`: Existing Astro/Node/ESM/pnpm toolchain constraints apply.
- `REQ-CON-003`: Authorized Figma implementation scope is page `29:4756` only.
- `REQ-CON-004`: The Figma source is Time-bound and must be re-verified before material downstream gates/tasks.
- `REQ-CON-005`: Workflow execution mode is Gated and requires human stage approval.

#### REQ-CON-006 — Do not add backend or delivery infrastructure without re-scoping

- Classification: Confirmed
- Priority: Must
- Description: Backend persistence, authentication, authorization, email delivery, or other server-side signup infrastructure must not be added unless later approved requirements and source baselines explicitly introduce that scope.
- Rationale: Those capabilities are explicitly excluded by the approved project context and are not supported by the current design/repository evidence.
- Snapshot or evidence: `PROJECT-CONTEXT.md` §6, `SRC-DS-001`, `SRC-REPO-001`.
- Acceptance criteria:
  - `AC-024`: Current implementation planning remains static/client-side in scope and does not add backend/signup-delivery systems without a workflow re-scope.

#### REQ-CON-007 — Reference viewport widths are not mandated breakpoints

- Classification: Confirmed
- Priority: Must
- Description: The 375 px, 768 px, and 1440 px source frames are authoritative reference compositions, not automatically required CSS breakpoint values.
- Rationale: The design audit and approved project context explicitly distinguish supplied evidence widths from implementation breakpoint decisions.
- Snapshot or evidence: `SRC-DS-001`, `AUD-004`, `PROJECT-CONTEXT.md` §§3 and 6.
- Acceptance criteria:
  - `AC-025`: Later design/specification/planning work may choose responsive thresholds based on observable layout needs, but must preserve the supplied reference outcomes.

### Security requirements

- No separate `REQ-SEC-*` item is justified by the current static/client-side scope.
- If a later requirement introduces email transport, persistence, third-party processing, authentication, or other data handling, security/privacy requirements become mandatory before implementation.

### Assumptions and recommendations

- No unsupported product behavior is promoted to a confirmed requirement.
- `REQ-AR-002`, `REQ-AR-004`, `REQ-AR-005`, and `REQ-AR-006` are classified as Recommended because the accessible project outcome is approved while those precise behaviors are not demonstrated by Figma. Human approval of Stage 2 would make them part of the approved requirement baseline.
- Responsive interpolation between the three source examples is expected to be resolved during design intent/specification from observed layout needs, not by assuming familiar breakpoint values.

### Open questions

#### Blocking before behavior specification / implementation

1. What happens after a syntactically valid email is submitted? No success state, navigation destination, persistence behavior, or delivery behavior is authorized by the current design/repository evidence (`AUD-003`). A successful-submit behavior must not be invented.

#### Non-blocking for Stage 2

2. Should the Email Input `Active` design state represent hover, a filled/engaged state, typing, or another condition? Prototype wiring uses hover while the state name is broader (`AUD-001`).
3. Is the mouse-scroll icon interactive (for example, an anchor) or purely instructional/decorative?
4. What precise responsive thresholds best preserve the demonstrated compositions between 375, 768, and 1440 px? The source widths themselves are not breakpoint requirements (`AUD-004`).
5. What formal accessibility conformance target, browser/device support matrix, and performance thresholds should be used for final validation? None is currently source-authorized.
6. If successful submission later transports or stores email data, what privacy, retention, security, and delivery rules apply? These concerns are not currently in scope.

### Definition of Done for Stage 2 requirements

- All source-supported product outcomes, validation rules, responsive expectations, accessibility needs, quality requirements, and constraints are represented with stable IDs.
- Every material requirement is prioritized, classified, traceable, and paired with observable acceptance criteria.
- Requirements do not invent backend behavior, billing behavior, a valid-email success flow, arbitrary breakpoints, browser targets, performance thresholds, or privacy policy.
- Source contradictions/gaps remain explicit as open questions or recommended requirements rather than being silently resolved.
- The requirements remain compatible with the Lite profile; no architecture-heavy scope has been introduced.

### Stage 2 Review Pass 1 — Completeness and correctness

- [x] Goals, non-goals, users, functional behavior, business/data boundaries, accessibility, responsive quality, constraints, assumptions, open questions, and Stage 2 Definition of Done are covered as applicable.
- [x] Each material requirement is specific, prioritized, implementation-neutral, and testable through its acceptance criteria.
- [x] The two repository-authorized validation messages are represented exactly and separately.
- [x] Unsupported successful-submit behavior, billing, persistence, browser targets, performance thresholds, and privacy policy are not invented.

Corrections applied during Pass 1:

- Kept successful valid-email submission as a blocking question because neither Figma nor the pinned README defines the outcome.
- Classified keyboard/error-announcement/image-semantics/reflow details as Recommended rather than presenting them as directly observed Figma behavior.
- Separated responsive reference outcomes from implementation breakpoint values.

### Stage 2 Review Pass 2 — Cross-artifact/source consistency

- [x] Requirement IDs follow the canonical `REQ-*` namespaces; acceptance criteria use stable `AC-*` IDs.
- [x] Requirements trace to `SRC-DS-001`, `SRC-REPO-001`, approved `EVD-*`/`AUD-*` evidence, or approved project authority.
- [x] `REQ-FR-004` intentionally uses repository authority to fill the empty-email validation gap identified by `AUD-002`; this is a source complement, not a contradiction.
- [x] `REQ-FR-005` is supported consistently by both Figma and repository evidence.
- [x] Figma reference widths remain evidence examples rather than assumed CSS breakpoints, consistent with `AUD-004` and `PROJECT-CONTEXT.md`.
- [x] No requirement contradicts the approved Lite/static-page scope or the implementation root/toolchain constraints.
- [x] Existing `REQ-CON-001`–`REQ-CON-005` identifiers from approved `PROJECT-CONTEXT.md` are referenced rather than duplicated; new constraint IDs continue at `REQ-CON-006`.

## 3. Design Intent

### DES-001 — Design decision title

- Classification:
- Intent:
- Snapshot and evidence:
- Requirement references:

### Responsive and interaction intent

Use `DES-RWD-*` and `DES-INT-*` identifiers. Document supplied viewport evidence, behavior between examples, states, content edge cases, and accessibility intent from the pinned design snapshots.

## 4. Specification

### SPEC-BEH-001 — Behavior title

- Requirement and design references:
- Source snapshots:
- Observable behavior:
- States and edge cases:
- Acceptance criteria: `AC-*`

Record applicable `SPEC-INT-*`, `SPEC-ACC-*`, `SPEC-VAL-*`, and `SPEC-DATA-*` items separately.

Do not invent arbitrary breakpoints, focus behavior, thresholds, or unsupported business rules.

## 5. Repository Context

- Repository snapshot: `SRC-REPO-*`
- Existing files and conventions:
- Reusable components, tokens, utilities, and tests:
- Confirmed commands:
- Constraints and technical debt:

Distinguish observed paths from proposed paths and do not rely on branch changes outside the pinned commit.

## 6. Implementation Plan

### PLAN-001 — Plan item title

- Objective:
- Requirement and specification references:
- Source snapshots:
- Files and modules:
- Dependencies:
- Implementation steps:
- Integrated accessibility, responsive, state, error, and test work:
- Validation:

Do not create a separate late accessibility implementation phase.

## 7. Architecture Decision

- Separate architecture needed: Yes / No
- Reason:

If the work requires meaningful routing, shared state, persistence, authentication, integrations, deployment, security, privacy, or migration decisions, upgrade to Standard or Full rather than overloading this brief.

## 8. Source-change Handling

- Snapshot verification required before task execution:
- Material changes that invalidate this brief:
- Earliest workflow section or stage to revisit:

Create new `SRC-*` IDs and perform an impact assessment rather than silently updating this brief to newer sources.

## 9. Risks, Assumptions, and Questions

### Blocking

- ...

### Non-blocking

- ...

## 10. Traceability

| Snapshot or evidence | Requirement | Design | Specification or criterion | Plan item | Validation |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## 11. Review Pass 1 — Completeness and Correctness

- [ ] Scope and pinned repository context are accurate.
- [ ] Snapshot IDs exist and were actually used.
- [ ] Requirements, design intent, testable behavior, and implementation planning are complete for the Lite scope.
- [ ] Responsive, accessibility, states, errors, content edge cases, and validation are integrated.
- [ ] The work still qualifies for Lite.

## 12. Corrections from Pass 1

- ...

## 13. Review Pass 2 — Consistency, Traceability, Source Integrity, Risks, and Uncertainty

- [ ] Ownership sections and identifiers remain distinct.
- [ ] Every material plan item maps to approved requirements or specifications and pinned sources.
- [ ] No source changed silently after the brief baseline was recorded.
- [ ] No unsupported scope or assumption is presented as confirmed.
- [ ] Blocking questions are visible.
- [ ] Corrections from the first pass were included before this review.

## 14. Readiness

Select exactly one:

- `Ready for task decomposition`
- `Ready with documented non-blocking assumptions`
- `Blocked by unresolved decisions`
