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

### Source and design-system context

The live `SRC-DS-001` scope was re-inspected for Stage 3 on 2026-08-19. The authorized `🤖 Workflow` page still contains `Style Guide` (`32:17743`), `Components` (`32:18709`), and `Main page` (`34:19665`), with the same Desktop (`32:10924`, 1440 px), Tablet (`32:11410`, 768 px), and Mobile (`32:11529`, 375 px) reference compositions used by the approved audit. The supplied widths remain reference evidence rather than prescribed breakpoints.

The observed design system uses Manrope text styles; a dark neutral page surface; cyan, blue, white, muted-neutral, and red color roles; the local `Foundations` variables; and local component sets for Header, Hero, Benefit Card/Benefits, Pricing Card/Pricing, Signup, Email Input, and Button. No external component-library dependency is implied by the approved audit. Implementation architecture and code-level token structure remain outside this stage.

### General design decisions

#### DES-001 — Preserve one continuous landing-page reading order

- Classification: Observed
- Intent: Keep the experience as one continuous page whose primary reading order is logo/header and Hero → Benefits → Pricing → Signup. Responsive layouts may change internal composition but must not reorder these major content groups.
- Snapshot and evidence: `SRC-DS-001`, `EVD-001`, `EVD-003`; live references `32:10924`, `32:11410`, `32:11529`.
- Requirement references: `REQ-FR-001`, `REQ-NFR-002`, `REQ-AR-001`.
- Confidence: High.

#### DES-002 — Maintain the demonstrated hierarchy and centered editorial emphasis

- Classification: Observed
- Intent: Preserve the hero headline as the dominant message, with `Our pricing plans` and `Get notified when we launch` as strong section-level headings and benefit/pricing titles as subordinate content. The page should retain the centered, spacious editorial rhythm visible in the references even when internal section layouts become row- or column-based.
- Snapshot and evidence: `SRC-DS-001`, `EVD-002`; live Main page references.
- Requirement references: `REQ-FR-001`, `REQ-NFR-001`, `REQ-AR-001`.
- Confidence: High.

#### DES-003 — Preserve the visual system roles rather than isolated raw values

- Classification: Observed
- Intent: Retain the dark neutral page background, bright cyan as the principal accent, blue as a supporting surface, white primary text, muted secondary text, and red for error emphasis. Preserve the Manrope hierarchy and the source's rounded-card/control language using the approved local typography, spacing, radius, and color evidence.
- Snapshot and evidence: `SRC-DS-001`, `EVD-005`, `EVD-006`; `Style Guide` (`32:17743`).
- Requirement references: `REQ-NFR-001`.
- Confidence: High.

#### DES-004 — Treat repeated source patterns as coherent visual families

- Classification: Observed
- Intent: Benefit cards, pricing cards, signup controls, and major page sections should remain visually coherent families across their demonstrated variants. Variant-specific layout changes may alter alignment, width, and composition while retaining content identity and recognizable styling.
- Snapshot and evidence: `SRC-DS-001`, `EVD-007`; component sets `70:2298`, `71:2973`, `72:2835`, `78:3069`, `79:3868`, `79:13338`, `79:14668`.
- Requirement references: `REQ-FR-001`, `REQ-FR-002`, `REQ-NFR-001`.
- Confidence: High.

#### DES-005 — Keep Hero illustration work subordinate to the proposition

- Classification: Observed
- Intent: The hero illustrations frame and reinforce the centered proposition rather than interrupting its reading order. On larger references they flank the copy; on mobile they become a top cluster before the headline. Their visual presence should remain strong without displacing the headline, supporting copy, or scroll cue from the primary hierarchy.
- Snapshot and evidence: `SRC-DS-001`, `EVD-003`, `EVD-004`; Hero set `79:3868`, asset components listed in `DESIGN-AUDIT.md` §14.
- Requirement references: `REQ-FR-002`, `REQ-NFR-001`, `REQ-AR-005`.
- Confidence: High for visual placement; semantic image treatment remains unresolved by Figma.

#### DES-006 — Preserve benefit-card content priority across layouts

- Classification: Observed
- Intent: Each benefit remains an illustration + short title + supporting paragraph. Desktop presents the four benefits as peers in four columns, Tablet converts them to horizontal rows with illustration and copy grouped together, and Mobile presents centered vertical cards. The transformation should preserve equal conceptual weight and source order.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`, `EVD-007`; Benefit Card `70:2298`, Benefits `79:13338`.
- Requirement references: `REQ-FR-001`, `REQ-FR-002`, `REQ-NFR-001`.
- Confidence: High.

#### DES-007 — Preserve pricing comparison hierarchy and plan contrast

- Classification: Observed
- Intent: Keep the Free and Premium plans as a paired comparison with clear plan labels, descriptive copy, price treatment, and feature lists. The blue Free surface and bright cyan Premium surface should preserve their visual distinction. Desktop places the cards side by side; narrower supplied references stack them in the same Free → Premium order.
- Snapshot and evidence: `SRC-DS-001`, `EVD-001`, `EVD-004`, `EVD-007`; Pricing Card `71:2973`, Pricing `79:14668`.
- Requirement references: `REQ-FR-002`, `REQ-FR-006`, `REQ-BR-001`, `REQ-NFR-001`.
- Confidence: High.

#### DES-008 — Keep signup visually compact and clearly final

- Classification: Observed
- Intent: The signup remains the final focal section, with a centered heading and a compact email + Notify control group over the decorative background shape. Desktop and Tablet keep the controls inline; Mobile stacks them while retaining clear grouping and full-width usability within the narrow composition.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`, `EVD-007`; Signup `72:2835`, Main page signup instances `76:8902`, `76:8911`, `76:8920`.
- Requirement references: `REQ-FR-001`, `REQ-FR-002`, `REQ-FR-004`, `REQ-FR-005`, `REQ-AR-001`.
- Confidence: High.

### Responsive intent

#### DES-RWD-001 — Interpolate continuously between supplied compositions

- Classification: Confirmed
- Intent: Treat 375, 768, and 1440 px as authoritative composition examples, not literal breakpoint mandates. Between them, allow widths, gaps, and section spacing to adapt fluidly until a demonstrated structural transformation is needed to prevent crowding, clipping, or loss of hierarchy.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`, `AUD-004`.
- Requirement references: `REQ-FR-002`, `REQ-NFR-002`, `REQ-AR-006`, `REQ-CON-007`.
- Confidence: High for the transformation principle; exact thresholds remain a later specification/planning decision.

#### DES-RWD-002 — Hero changes from flanking imagery to a top cluster

- Classification: Observed
- Intent: Preserve centered hero copy throughout. Desktop uses broad flanking illustration groups; Tablet retains side imagery with reduced/repositioned presence; Mobile relocates the illustration group above the copy. The switch should occur when side imagery can no longer coexist with readable centered copy without collision or excessive compression.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`; Hero `79:3868`, live Main page references.
- Requirement references: `REQ-FR-002`, `REQ-NFR-001`, `REQ-NFR-002`.
- Confidence: High for the observed end states; Medium for the inferred transition trigger.

#### DES-RWD-003 — Benefits move from columns to rows to centered stacks

- Classification: Observed
- Intent: Preserve four-column comparison while space supports it; transition to the demonstrated horizontal row treatment at medium widths; transition again to centered vertical cards when row composition would constrain text or imagery. Source order remains unchanged through all transformations.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`; Benefit Card `70:2298`, Benefits `79:13338`.
- Requirement references: `REQ-FR-002`, `REQ-NFR-002`, `REQ-AR-006`.
- Confidence: High for end states; Medium for exact transition thresholds.

#### DES-RWD-004 — Pricing changes from comparison row to vertical sequence

- Classification: Observed
- Intent: Keep Free and Premium side by side only while both cards retain comfortable content width and separation. At narrower layouts use the demonstrated vertical Free → Premium sequence and preserve card distinction, feature readability, and balanced section spacing.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`; Pricing Card `71:2973`, Pricing `79:14668`.
- Requirement references: `REQ-FR-002`, `REQ-FR-006`, `REQ-NFR-002`, `REQ-AR-006`.
- Confidence: High.

#### DES-RWD-005 — Signup stacks only when the inline group stops fitting comfortably

- Classification: Observed with inferred transition trigger
- Intent: Preserve the inline email + Notify grouping through wider and medium layouts, then stack the controls vertically at narrow widths as shown on Mobile. The stacked form should preserve visual grouping, readable error space, and a clear single-column interaction order.
- Snapshot and evidence: `SRC-DS-001`, `EVD-004`; Signup `72:2835`.
- Requirement references: `REQ-FR-002`, `REQ-NFR-002`, `REQ-AR-002`, `REQ-AR-006`.
- Confidence: High for supplied layouts; Medium for the transition trigger.

#### DES-RWD-006 — Favor reflow over clipping at unsupported extremes

- Classification: Recommended
- Intent: At widths below or between supplied references, preserve content access by wrapping/reflowing rather than clipping, overlapping, or forcing page-level horizontal scrolling. At widths above the desktop reference, preserve the centered composition and hierarchy rather than stretching text and card content indefinitely.
- Snapshot and evidence: `AUD-004`, live Main page references; no direct extreme-width composition is supplied.
- Requirement references: `REQ-NFR-002`, `REQ-AR-006`.
- Confidence: Medium; this resolves a documented evidence gap without asserting a source breakpoint.

### Interaction intent

#### DES-INT-001 — Button feedback includes distinct default, hover, and focus states

- Classification: Observed
- Intent: The Notify control should expose the demonstrated Default, Hover, and Focus visual states. Hover is a pointer-specific enhancement and must not replace the explicit focus indication needed for keyboard use. The source prototype demonstrates a 200 ms Ease In dissolve for hover; no broader motion system is implied.
- Snapshot and evidence: `SRC-DS-001`, `EVD-010`, `EVD-011`; Button `32:17765`.
- Requirement references: `REQ-FR-003`, `REQ-AR-002`, `REQ-AR-003`.
- Confidence: High.

#### DES-INT-002 — Email control preserves state distinction without over-interpreting `Active`

- Classification: Observed with unresolved semantics
- Intent: Preserve visually distinguishable Default, Active, Focus, and Error treatments. The live prototype maps hover to `State=Active`, while the variant name could also imply an engaged or filled state; Stage 3 therefore preserves the visual state but does not define its final semantic trigger.
- Snapshot and evidence: `SRC-DS-001`, `EVD-008`, `EVD-009`, `EVD-011`, `AUD-001`; Email Input `32:17773`.
- Requirement references: `REQ-FR-003`, `REQ-AR-003`.
- Confidence: High for state inventory; Low for the semantic meaning of `Active` until specification resolves it.

#### DES-INT-003 — Validation errors use the source error treatment and remain attached to the email field

- Classification: Confirmed design intent with requirement-supplied content
- Intent: Empty and malformed email failures should share the source-authorized error visual treatment and occupy the field's error-message area, while using their distinct approved messages. The visual design must leave enough space for the message without breaking the form grouping. Programmatic association and announcement are accessibility requirements to be specified later, not visual evidence from Figma.
- Snapshot and evidence: `SRC-DS-001`, `SRC-REPO-001`, `EVD-008`, `AUD-002`.
- Requirement references: `REQ-FR-004`, `REQ-FR-005`, `REQ-AR-004`.
- Confidence: High.

#### DES-INT-004 — Do not invent a valid-submission success state or navigation

- Classification: Open question / constraint
- Intent: The current design contains no submit transition, success state, loading state, destination, persistence indication, or completion feedback. Stage 3 therefore defines no success-state visual behavior; that decision remains blocking before behavior specification can be completed.
- Snapshot and evidence: `SRC-DS-001`, `AUD-003`.
- Requirement references: `REQ-DR-001`, `REQ-CON-006`.
- Confidence: High that the current source is silent.

### Content, accessibility, and asset intent

- Content examples are treated as approved display content, not evidence of dynamic data models. Benefit and pricing copy should preserve its intended grouping and hierarchy; longer or reflowed text must not overlap adjacent content (`DES-006`, `DES-007`, `DES-RWD-006`).
- The logical reading order should follow the visual content order from `DES-001`; semantic heading levels remain an implementation/specification responsibility under `REQ-AR-001`, not something proven by Figma.
- Email and Notify controls must retain explicit visible focus treatment and a straightforward single interaction order. Error communication must not rely only on color or visual placement (`REQ-AR-002`–`REQ-AR-004`).
- Hero and benefit illustrations, pricing icons, the mouse-scroll icon, and decorative shapes have visual roles but Figma does not establish their accessibility semantics. Their decorative versus meaningful treatment remains to be resolved under `REQ-AR-005` and `AUD-006`.
- The mouse-scroll icon's interaction role is still unresolved: no click/tap destination is demonstrated, so Stage 3 does not promote it to an interactive control.
- Reduced-motion intent is not otherwise defined. The only observed prototype motion is the 200 ms hover dissolve for Email Input and Button states; later specification should avoid extrapolating additional motion from that evidence.

### Stage 3 open questions and downstream decisions

#### Blocking before Stage 4 behavior specification can be finalized

1. What is the intended outcome after a syntactically valid email is submitted? No success state, navigation, persistence, delivery, or completion feedback is currently authorized (`AUD-003`, `DES-INT-004`).

#### Non-blocking for Stage 3 closure

2. What exact semantic trigger should map to the Email Input `Active` visual state (`AUD-001`, `DES-INT-002`)?
3. Is the mouse-scroll icon interactive or purely instructional/decorative?
4. What exact responsive thresholds best realize `DES-RWD-002`–`DES-RWD-005`? They should be chosen from layout failure/fit needs, not copied from the Figma frame widths.
5. What formal contrast/conformance target, browser/device support matrix, and performance thresholds will govern final validation? These are not established by the design source.

### Stage 3 Review Pass 1 — Completeness and correctness

- [x] Information architecture, visual hierarchy, visual system, component families, responsive transformations, interaction states, validation visuals, content edges, accessibility intent, assets, and design-system mapping are covered as applicable.
- [x] Design intent explains relationships and transformations rather than copying a raw property/CSS dump.
- [x] Desktop, Tablet, and Mobile supplied references are represented, including behavior that should remain fluid between them.
- [x] The design section does not prescribe implementation architecture, repository structure, or arbitrary breakpoint values.
- [x] Unsupported success/loading/disabled states and unproven accessibility behavior are not presented as observed design facts.

Corrections applied during Pass 1:

- Kept the exact responsive thresholds unresolved and described transition triggers in terms of layout fit/failure.
- Separated the observed Email Input `Active` visual from its unresolved semantic trigger.
- Kept illustration/icon accessibility roles and mouse-scroll interactivity unresolved instead of treating their visual appearance as semantic proof.
- Limited motion intent to the observed 200 ms hover dissolves and did not invent broader animation behavior.

### Stage 3 Review Pass 2 — Consistency, traceability, risks, and uncertainty

- [x] Design IDs use `DES-*`, `DES-RWD-*`, and `DES-INT-*` namespaces and are unique within the consolidated Lite brief.
- [x] Every material design decision references approved `EVD-*`/`AUD-*` evidence, live source nodes, and relevant approved `REQ-*` requirements.
- [x] Observed, Confirmed, Recommended, inferred transition triggers, and Open questions remain explicitly distinguished.
- [x] `DES-RWD-*` decisions preserve all three supplied reference outcomes without asserting 375, 768, or 1440 px as required CSS breakpoints.
- [x] Interaction intent remains consistent with `EVD-008`–`EVD-011` and does not turn hover wiring into keyboard/focus semantics.
- [x] No Stage 3 decision introduces backend delivery, billing, extra routes, dynamic plan behavior, or a valid-email success flow.
- [x] The current design intent remains compatible with the Lite profile and does not require a separate architecture artifact.

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