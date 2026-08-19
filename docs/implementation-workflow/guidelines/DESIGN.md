# `DESIGN.md` Guidelines

`DESIGN.md` records project-specific visual, responsive, content, and interaction intent. It explains relationships and purpose rather than copying every property from the design source.

Use [`../templates/DESIGN.template.md`](../templates/DESIGN.template.md) and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md).

## Ownership

`DESIGN.md` owns:

- information architecture and reading order;
- layout, hierarchy, typography, color, spacing, imagery, and assets;
- component anatomy, variants, and visual states;
- responsive transformations;
- interaction and motion intent;
- content behavior and edge cases;
- accessibility intent visible or implied by the design;
- design-system mapping and deviations.

It does not own business rules, precise testable behavior, repository structure, or task order.

## Identifiers

Use:

- `DES-*` for general design decisions;
- `DES-RWD-*` for responsive decisions;
- `DES-INT-*` for interaction decisions.

Each decision should reference supporting `EVD-*` evidence and relevant `REQ-*` requirements.

## Observation and uncertainty

Separate:

- **Observed:** directly visible or explicitly defined;
- **Inferred:** strongly suggested but not demonstrated;
- **Recommended:** proposed to resolve a gap;
- **Open question:** requires a decision;
- **Confirmed:** approved through authoritative documentation or a user decision.

Do not make a recommendation appear to be part of the source design.

## Responsive intent

Do not document only supplied viewport widths. Explain:

- what remains fixed and what becomes fluid;
- what wraps, stacks, reorders, hides, or is replaced;
- how hierarchy and content priority change;
- how the design behaves between supplied examples;
- what happens at unusually narrow or wide widths;
- the content or layout failure that requires a transition.

Do not infer a breakpoint merely because `768px` or another familiar value is common. The design document should describe the intended transformation and evidence. The specification makes it observable, and the plan selects and validates an implementation value when needed.

## Interaction intent

Identify the intended pattern before describing behavior. A disclosure, menu widget, non-modal drawer, and modal dialog have different semantic, keyboard, and focus implications.

Document:

- trigger and intended result;
- open, closed, selected, or active states;
- cancellation and closing intent;
- motion and reduced-motion implications;
- focus and keyboard implications appropriate to the identified pattern;
- missing evidence or unresolved pattern choices.

Do not prescribe moving focus merely because content becomes visible.

## Accessibility intent

Document expected semantic hierarchy, reading order, keyboard implications, visible focus, contrast, touch targets, zoom and reflow, alternative text, announcements, and reduced motion.

A design source can suggest accessibility intent but cannot prove implementation compliance.

## Design-system mapping

Map important patterns to existing tokens, components, and resources when evidence exists. Distinguish:

- observed design-source resources;
- observed repository resources;
- proposed mappings;
- missing or conflicting resources.

Do not turn this section into an implementation plan.

## Lite profile

For Lite work, use the design section of `IMPLEMENTATION-BRIEF.md`, preserving `DES-*` ownership and identifiers.

## Common failure modes

Avoid:

- a raw property or CSS dump;
- invented responsive behavior presented as observed;
- arbitrary breakpoint values;
- generic component descriptions without anatomy, variants, states, or content rules;
- treating hover as a substitute for focus;
- applying one interaction pattern's focus rules to another pattern;
- omitting long content, missing content, or intermediate widths;
- describing proposed project components as already existing.

## Review

### Pass 1 — Completeness and correctness

- [ ] Purpose, hierarchy, structure, visual system, components, interactions, responsive intent, states, content, accessibility, assets, and design-system mapping are covered as applicable.
- [ ] The document captures intent rather than copying properties.

### Pass 2 — Consistency, traceability, risks, and uncertainty

- [ ] IDs follow `Identifier-Conventions.md`.
- [ ] Decisions reference evidence and requirements.
- [ ] Observed, inferred, recommended, confirmed, and open information remain distinct.
- [ ] No arbitrary breakpoint or unsupported interaction rule appears as confirmed.
