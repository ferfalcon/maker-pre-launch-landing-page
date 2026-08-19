# `SPEC.md` Guidelines

`SPEC.md` translates approved requirements and design intent into precise, observable, testable behavior. It should let implementation and review proceed without repeatedly guessing from the design source.

Use [`../templates/SPEC.template.md`](../templates/SPEC.template.md) and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md).

## Ownership

`SPEC.md` owns:

- required user-visible and system behavior;
- states, content rules, and edge cases;
- interaction, keyboard, and focus behavior;
- responsive behavior;
- accessibility behavior;
- conceptual data and interface requirements;
- validation, errors, recovery, and acceptance criteria.

It does not own repository paths, component filenames, task ordering, or unsupported architecture.

## Identifier namespaces

Use:

- `SPEC-BEH-*` for behavior;
- `SPEC-INT-*` for interactions;
- `SPEC-VAL-*` for validation and errors;
- `SPEC-ACC-*` for accessibility;
- `SPEC-DATA-*` for data and interfaces;
- `AC-*` for acceptance criteria.

Reference `REQ-*` requirements; do not reuse their identifiers as specification identifiers.

## Testable language

A material specification should identify:

- preconditions and trigger;
- required result;
- applicable states;
- success and failure behavior;
- responsive conditions;
- keyboard and focus behavior when applicable;
- acceptance criteria and validation method;
- supporting requirement and design references.

Avoid subjective terms unless they are defined by observable criteria.

## Responsive specifications

Describe behavior at supplied viewports, between them, and beyond them. Define:

- fixed and fluid behavior;
- wrapping, stacking, reordering, hiding, or replacement;
- overflow and long-content behavior;
- unusually narrow and wide conditions;
- the layout or content failure that requires a transition.

Do not default to `768px` or another familiar number without evidence. When the exact breakpoint is an implementation decision, specify the observable failure condition the plan must test.

## Interaction and focus specifications

Identify the interaction pattern before defining keyboard or focus behavior.

- A disclosure normally keeps focus on its trigger when expanded.
- A modal dialog normally moves focus into the dialog and contains focus while open.
- A menu widget has menu-specific keyboard behavior only when the interface truly uses that pattern.
- A non-modal drawer may require different focus handling depending on whether background content remains available.

Do not apply modal or menu rules to every mobile navigation. Record an open question when the pattern cannot be determined.

## Accessibility specifications

Define applicable semantics, keyboard operation, focus order and visibility, accessible names and relationships, state exposure, announcements, contrast, touch targets, reflow, zoom, and reduced motion.

Use native semantics where possible. Require ARIA only when native HTML cannot express the needed relationship or state.

## Data, validation, and errors

Describe conceptual inputs, outputs, required and optional fields, defaults, validation ownership, persistence or synchronization, partial data, failures, recovery, retry, and duplicate-action behavior when relevant.

Detailed repository architecture belongs elsewhere.

## Acceptance criteria

Each `AC-*` item must be objectively verifiable and reference its requirement or specification. One requirement may have several criteria.

Example:

```md
### SPEC-INT-004 — Expand an FAQ answer

Activating the question control reveals its associated answer without moving focus away from the trigger.

- `AC-021`: Pointer activation toggles the answer.
- `AC-022`: Enter and Space activate the native button.
- `AC-023`: The button exposes state with `aria-expanded`.
- `AC-024`: The answer is programmatically associated with the trigger.
```

## Lite profile

For Lite work, use the specification section of `IMPLEMENTATION-BRIEF.md`, preserving `SPEC-*` and `AC-*` ownership.

## Common failure modes

Avoid:

- repeating requirements without making behavior precise;
- using bare `FR-*` IDs that collide with requirements;
- arbitrary breakpoint values;
- unsupported focus movement;
- prescribing repository paths or task order;
- missing loading, empty, error, success, disabled, long-content, or failed-request behavior;
- vague accessibility statements;
- acceptance criteria that cannot be observed or reproduced.

## Review

### Pass 1 — Completeness and correctness

- [ ] Scope, terminology, behavior, interactions, states, responsive behavior, accessibility, data, validation, errors, edge cases, non-functional behavior, and acceptance criteria are covered as applicable.
- [ ] Material behavior is objectively testable.

### Pass 2 — Consistency, traceability, risks, and uncertainty

- [ ] IDs follow `Identifier-Conventions.md`.
- [ ] Every material specification references requirements and relevant design evidence.
- [ ] No unsupported breakpoint, focus rule, threshold, or architecture is presented as confirmed.
- [ ] Assumptions and open questions remain visible.
