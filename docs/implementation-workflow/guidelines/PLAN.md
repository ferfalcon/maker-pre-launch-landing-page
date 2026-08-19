# `PLAN.md` Guidelines

`PLAN.md` explains how approved requirements and specifications will be implemented in the actual repository. It owns technical approach, file impact, ordering, dependencies, risks, and validation—not new product requirements.

Use [`../templates/PLAN.template.md`](../templates/PLAN.template.md), [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md), and the inspected repository.

## Evidence before planning

Before naming files, commands, dependencies, conventions, or modules, inspect:

- repository structure and package boundaries;
- framework, dependency, build, and deployment files;
- reusable components, utilities, tokens, styles, and tests;
- current data, state, API, and error-handling patterns;
- approved upstream artifacts.

Distinguish observed existing files and patterns, proposed files and patterns, and unresolved locations or decisions. Never describe a proposed path as existing.

## Plan item identifiers

Use stable `PLAN-*` IDs. Every material plan item should include:

- one meaningful objective;
- `REQ-*`, `SPEC-*`, and relevant design references;
- affected existing or proposed files;
- dependencies and ordering;
- implementation approach;
- integrated accessibility, responsive, state, error, and test work;
- validation method and expected result;
- risks, assumptions, and compatibility implications.

## Integrated implementation quality

Do not create a late Accessibility phase where semantics, keyboard behavior, focus handling, accessible relationships, or reduced-motion behavior are first added.

Accessibility belongs in the plan item that creates or changes the component or interaction. The same rule applies to responsive behavior, loading, empty, error, success, disabled, long-content, failed-request states, and relevant tests.

A final validation phase may verify these concerns and correct residual defects.

A suitable phase shape may be:

1. accessible foundation and design-system integration;
2. core behavior, data, keyboard, focus, validation, and errors;
3. responsive, content, and edge-case completion;
4. regression protection and final validation.

Adapt this to the project rather than copying it mechanically.

## Responsive planning

Do not select `768px` or another familiar breakpoint without evidence.

For every layout transition:

1. identify design-source evidence;
2. describe the content or layout failure condition;
3. inspect existing project or design-system breakpoints;
4. select the narrowest justified transition;
5. test intermediate widths, long content, zoom, and reflow;
6. record the final value and rationale.

When the exact value is not yet known, the plan may make selection and validation part of the relevant `PLAN-*` item.

## Interaction planning

Use the pattern defined in `DESIGN.md` and `SPEC.md`. Do not assume all mobile navigation is a modal or menu widget. Plan focus movement, Escape handling, focus return, and background availability according to the specified pattern.

## Architecture handling

Create or use `ARCHITECTURE.md` when meaningful structural decisions exist.

When architecture is skipped:

1. record the reason in `WORKFLOW-STATE.md`;
2. keep behavioral structural constraints in `SPEC.md`;
3. put repository and implementation structure in `PLAN.md`;
4. do not invent an architecture section merely to satisfy the workflow.

## Files and modules

For every affected path, record:

- action: Create, Modify, Delete, Move, or Unresolved;
- whether it exists or is proposed;
- responsibility;
- evidence supporting the location;
- compatibility or migration impact.

## Dependencies and ordering

Order work by real prerequisites. Avoid generic sequences when the repository suggests another dependency order.

Identify safe parallel work only when file ownership and interfaces do not conflict.

## Validation

Every material plan item must define supported validation, such as:

- unit, component, integration, contract, or end-to-end tests;
- type checking, linting, and build;
- keyboard, focus, screen-reader, and automated accessibility checks;
- responsive and visual comparison;
- content and error scenarios;
- API, persistence, migration, deployment, rollback, or regression checks.

Do not list commands that were not confirmed in the repository.

## Lite profile

For Lite work, use the plan section of `IMPLEMENTATION-BRIEF.md`, preserving `PLAN-*` ownership. Upgrade the profile when the brief cannot express architecture, dependencies, risk, or task decomposition clearly.

## Common failure modes

Avoid:

- repeating the specification without translating it into repository work;
- invented paths, commands, dependencies, or conventions;
- accessibility or responsiveness deferred to cleanup;
- arbitrary breakpoint values;
- phases that produce no independently verifiable result;
- unsupported abstractions or dependencies;
- ignored migration, compatibility, deployment, rollback, security, privacy, or regression work;
- missing validation for material items;
- implementation code during planning.

## Review

### Pass 1 — Feasibility and completeness

- [ ] Current repository state is accurate.
- [ ] Scope, technical approach, files, ordering, dependencies, integration, migration, and validation are complete as applicable.
- [ ] Plan items are concrete and decomposable.
- [ ] Accessibility, responsiveness, states, errors, and tests are integrated.

### Pass 2 — Consistency, traceability, risks, and uncertainty

- [ ] IDs follow `Identifier-Conventions.md`.
- [ ] Every plan item maps to approved requirements or specifications.
- [ ] Existing and proposed files are distinguished.
- [ ] Architecture-skip handling is consistent.
- [ ] No arbitrary breakpoint, unsupported interaction rule, or product scope was introduced.
- [ ] Risks, assumptions, blockers, and accepted tradeoffs remain visible.
