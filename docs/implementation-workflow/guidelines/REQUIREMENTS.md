# `REQUIREMENTS.md` Guidelines

`REQUIREMENTS.md` defines what the project or feature must accomplish and why. It owns product outcomes, capabilities, business rules, data expectations, constraints, and quality standards. It does not own detailed visual intent, repository structure, or implementation order.

Use [`../templates/REQUIREMENTS.template.md`](../templates/REQUIREMENTS.template.md) as the starting structure and [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md) for IDs.

## Required qualities

A material requirement must be:

- specific and unambiguous;
- necessary and prioritized;
- objectively testable;
- implementation-neutral unless a real constraint applies;
- traceable to evidence or an approved decision;
- honest about uncertainty.

## Identifier namespaces

Use:

- `REQ-FR-*` — functional requirements;
- `REQ-BR-*` — business rules;
- `REQ-DR-*` — data requirements;
- `REQ-NFR-*` — non-functional requirements;
- `REQ-AR-*` — accessibility requirements;
- `REQ-SEC-*` — security requirements;
- `REQ-CON-*` — constraints.

Do not use bare `FR-*` or reuse requirement identifiers as specification identifiers in new projects.

## Requirement structure

Each material requirement should include:

- classification: Confirmed, Inferred, or Recommended;
- priority: Must, Should, or Could;
- description;
- rationale;
- evidence, such as `EVD-*` or an authoritative source;
- acceptance criteria or links to `AC-*`;
- affected dependencies or risks when relevant.

## Evidence limits

A design source may demonstrate screens, content, visual states, responsive variations, and prototype interactions. It usually cannot confirm complete business rules, permissions, persistence, retention, security policy, performance thresholds, backend behavior, or complete accessibility requirements.

Do not invent:

- permissions or ownership rules;
- browser support;
- response-time targets;
- retention or privacy policy;
- authentication or authorization behavior;
- data volume or availability targets.

Carry unsupported needs as recommendations or open questions.

## Responsive requirements

Requirements should define user and product outcomes across layout conditions. They should not choose a familiar breakpoint value unless that value is an approved constraint.

Good:

> `REQ-FR-008`: Primary navigation must remain usable without overlap, clipping, or horizontal page scrolling across supported viewport widths.

The design and specification can then define intended transformations and testable behavior.

## Accessibility requirements

Accessibility is a product quality requirement, not a late implementation enhancement. Define applicable expectations for semantics, keyboard access, focus visibility, accessible names and relationships, announcements, contrast, zoom and reflow, touch targets, and reduced motion.

Do not claim compliance solely from visual design evidence.

## Acceptance criteria

A requirement states the expected capability or quality. Acceptance criteria describe observable evidence that it was satisfied.

Example:

```md
### REQ-FR-005 — Archive a note

A user must be able to archive a note they own without deleting its content.

Acceptance criteria:

- `AC-011`: Archiving removes the note from the active view.
- `AC-012`: The note appears in the archived view.
- `AC-013`: The note content remains unchanged.
- `AC-014`: A user cannot archive another user's note.
```

## Relationship to other artifacts

- `DESIGN.md` explains visual, responsive, content, and interaction intent supporting requirements.
- `SPEC.md` translates requirements into precise observable behavior.
- `ARCHITECTURE.md` defines structural decisions needed to support requirements.
- `PLAN.md` describes how the repository will be changed.

For Lite work, use the requirements section of `IMPLEMENTATION-BRIEF.md` while preserving `REQ-*` ownership and identifiers.

## Common failure modes

Avoid:

- converting visible interface elements directly into unsupported product rules;
- vague statements such as “fast,” “easy,” or “responsive” without testable meaning;
- implementation paths disguised as requirements;
- duplicate or renumbered identifiers;
- unsupported thresholds;
- mixing confirmed requirements with recommendations;
- treating every possible quality category as applicable.

## Review

### Pass 1 — Completeness and correctness

- [ ] Goals, non-goals, users, functional needs, rules, data, accessibility, quality, constraints, dependencies, risks, assumptions, questions, and Definition of Done are covered as applicable.
- [ ] Requirements are necessary, specific, prioritized, and testable.

### Pass 2 — Consistency, traceability, risks, and uncertainty

- [ ] IDs follow `Identifier-Conventions.md`.
- [ ] Every material requirement has evidence or approved authority.
- [ ] Confirmed, inferred, recommended, and open information remain distinct.
- [ ] No unsupported business rule, threshold, browser target, security policy, or backend behavior was invented.
