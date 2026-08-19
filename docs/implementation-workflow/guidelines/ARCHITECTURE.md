# `ARCHITECTURE.md` Documentation Guidelines

An `ARCHITECTURE.md` file explains how a software system is organized and why its structural decisions were made.

It should let a developer understand:

- the major parts of the system;
- the responsibility of each part;
- how parts communicate;
- how data and state move through the system;
- which dependency rules must be preserved;
- which constraints and tradeoffs shaped the structure;
- which decisions are confirmed, proposed, or unresolved.

The central question is:

> How is this system structured, and why?

## Document responsibility

`ARCHITECTURE.md` owns structural technical decisions and boundaries.

It is not:

- a product requirements document;
- a visual design description;
- a complete behavioral specification;
- a step-by-step implementation plan;
- an API reference;
- a database-schema dump;
- a list of every source file;
- a record of every minor coding choice.

| Document | Main responsibility |
|---|---|
| `REQUIREMENTS.md` | Product outcomes, rules, constraints, and quality expectations |
| `DESIGN.md` | Visual, responsive, and interaction intent |
| `SPEC.md` | Precise and testable behavior |
| `ARCHITECTURE.md` | System structure, boundaries, dependencies, and technical decisions |
| `PLAN.md` | Implementation order, affected files, dependencies, and validation |

## When a separate architecture document is appropriate

Create a separate `ARCHITECTURE.md` when the project or feature has meaningful structural decisions involving one or more of these areas:

- multiple applications, packages, services, or runtime boundaries;
- routing or navigation architecture;
- significant component or feature boundaries;
- shared state or complex data flow;
- APIs or third-party integrations;
- persistence or migrations;
- authentication or authorization;
- background processing;
- build and deployment infrastructure;
- security, reliability, or observability boundaries;
- architectural migration from an existing system.

A separate architecture document may be unnecessary for a genuinely small static page or isolated component with no meaningful structural decisions. In that case:

1. record why the architecture stage was skipped in `WORKFLOW-STATE.md`;
2. put behavioral structural constraints in `SPEC.md`;
3. put repository and implementation structure in `PLAN.md`;
4. keep architecture references optional in later stages.

## Evidence before decisions

Architecture must be grounded in the actual project.

Inspect:

- pinned repository structure and commit;
- package and dependency files;
- build and deployment configuration;
- existing components, modules, services, and utilities;
- current data-access and state-management patterns;
- tests and validation infrastructure;
- `REQUIREMENTS.md`;
- `DESIGN.md`;
- `SPEC.md`;
- existing technical documentation;
- approved stakeholder or technical decisions.

Do not infer architecture from filenames or framework stereotypes alone.

Distinguish clearly between:

- **Current architecture:** observed in the pinned repository now.
- **Target architecture:** proposed for the implementation.
- **Transitional architecture:** temporary structure required during migration.

Never describe proposed files, layers, or services as if they already exist.

## Examples are non-normative

Technology names, directory structures, hosting providers, and architectural patterns in examples are illustrative only.

Do not adopt them unless supported by repository evidence, project constraints, requirements, specifications, or an approved architectural decision.

See:

- [`../templates/ARCHITECTURE.template.md`](../templates/ARCHITECTURE.template.md)
- [`../examples/full-application/ARCHITECTURE-full-stack-example.md`](../examples/full-application/ARCHITECTURE-full-stack-example.md)
- [`../examples/standard-site/ARCHITECTURE-component-example.md`](../examples/standard-site/ARCHITECTURE-component-example.md)

## Required content

Not every project needs every subsection, but a useful architecture document should address the following concerns when they apply.

### 1. Purpose and scope

Define what system, application, feature, or component is covered; why the document exists; what is outside scope; and whether it describes current, target, or transitional architecture.

### 2. Sources and evidence

Record repository snapshots, inspected paths, project documents, infrastructure configuration, requirement and specification IDs, and approved decisions.

Important structural claims should be traceable to evidence.

### 3. System context

Identify users and actors, external systems, third-party services, major inputs and outputs, and trust boundaries.

```text
Actor → System boundary → External dependency
```

### 4. Architectural goals

State project-specific qualities the architecture prioritizes, such as maintainability, accessibility, testability, security, reliability, performance, scalability, simplicity, or replaceable infrastructure.

Do not list generic qualities without explaining relevance or tradeoffs.

### 5. High-level structure

Describe major runtime and code boundaries, how they communicate, where responsibilities belong, and which boundaries are current or proposed.

The description should remain useful even when individual filenames change.

### 6. Components and responsibilities

For each architecturally significant part, define responsibilities, owned state or data, dependencies, public boundaries, and responsibilities it must not absorb.

Good architecture protects responsibility boundaries, not only directory names.

### 7. Dependency rules

State what may depend on what, including layer or module direction, framework-independent boundaries, feature-to-shared-code rules, UI-to-data-access restrictions, allowed integration paths, and prohibited cycles.

Only define layers or abstractions the project actually needs.

### 8. Data and interaction flows

Document important flows that clarify initiator, validation, authorization, business-rule ownership, data access, side effects, and success or failure results.

Avoid documenting every minor function call.

### 9. State and data ownership

Define authoritative data sources, persistent and transient state, client or server ownership, caching and synchronization, validation ownership, concurrency or consistency concerns, and sensitive-data boundaries.

### 10. Interface architecture

For frontend systems, address routing and navigation, feature organization, shared-component boundaries, page and layout composition, server versus interface state, data access, styling and design-system integration, rendering strategy, and error boundaries.

Do not turn this section into a list of every component.

### 11. Service, API, and integration architecture

When applicable, define request and message boundaries, external input validation, business-rule ownership, service or use-case boundaries, integration adapters, error translation, compatibility, and background work.

Detailed payloads belong in `SPEC.md`, OpenAPI, or dedicated API documentation.

### 12. Persistence architecture

When applicable, describe main entities and relationships, persistence ownership, transaction boundaries, migration strategy, retention or deletion behavior, model mapping, and consistency constraints.

Avoid copying the complete schema unless essential to understanding decisions.

### 13. Authentication and authorization

When applicable, explain identity source, authentication flow, authorization enforcement, protected boundaries, session or token lifecycle, logout and revocation, and tradeoffs.

Do not assume a model from an example.

### 14. Accessibility architecture

Document structural decisions needed to preserve accessibility across components and features, including semantic boundaries, keyboard interaction ownership, focus management, names and relationships, announcements, reduced motion, reusable behavior, and testing responsibility.

Accessibility is architectural when behavior is shared across the system.

### 15. Error handling and reliability

Define error categories, propagation and translation, user recovery, retry and idempotency, fallback behavior, failure boundaries, logging and sanitization, and rollback or recovery where applicable.

### 16. Security and privacy

Document relevant trust boundaries, input validation, authorization enforcement, secret management, sensitive-data handling, origin and network controls, logging restrictions, abuse protection, and privacy constraints.

Do not invent security or retention policies. Carry unsupported decisions as recommendations or open questions.

### 17. Build, deployment, and runtime

When applicable, describe build outputs, environments, hosting boundaries, configuration, networking, deployment ordering, migrations, rollback or recovery, and runtime constraints.

### 18. Observability

When relevant, define logs, metrics, traces, health checks, alerts, diagnostic identifiers, and information that must not be recorded.

### 19. Testing architecture

Explain responsibilities for unit, component, integration, contract, end-to-end, accessibility, and visual validation.

Testing boundaries should align with architectural boundaries.

### 20. Architectural decisions

Record significant decisions with status, context, selected option, rationale, alternatives, tradeoffs, consequences, and traceability.

Use separate Architecture Decision Records when decisions require independent review, history, or replacement.

### 21. Constraints and tradeoffs

State accepted limitations honestly. Architecture always involves tradeoffs; a document describing only benefits is incomplete.

### 22. Risks, assumptions, and open questions

Record architectural risks, unsupported assumptions, unresolved decisions, decisions requiring stakeholder approval, and blocking status.

Do not silently resolve uncertainty through convention or preference.

### 23. Future evolution

Describe likely extension points only when useful. Future possibilities must not become accidental current requirements.

### 24. Traceability and validation

Map important decisions to requirement IDs, specification IDs, repository evidence, implementation tasks, and validation methods.

## Evidence and uncertainty labels

Use:

- **Confirmed:** established by project documentation or an approved decision.
- **Observed:** directly visible in a pinned repository or infrastructure snapshot.
- **Inferred:** strongly suggested but not confirmed.
- **Recommended:** proposed to resolve a structural concern.
- **Open question:** cannot be determined safely.

Do not blur observed current structure with recommended target structure.

## Level of detail

The correct level is detailed enough to guide implementation and protect boundaries, but not so detailed that routine code changes make the document obsolete.

Good:

```md
Feature modules may depend on shared UI primitives, but shared primitives must not import product-feature code.
```

Too vague:

```md
The project follows best practices.
```

Too implementation-specific:

```md
Line 42 of feature-service.ts calls repository.findById().
```

Prefer stable boundaries, ownership, flows, and rationale over temporary implementation details.

## Common failure modes

Avoid:

- documenting imagined architecture without inspecting the repository;
- copying an example stack into an unrelated project;
- listing folders without responsibilities;
- introducing layers that solve no current problem;
- mixing product requirements with technical decisions;
- duplicating the specification or plan;
- treating proposed structure as current;
- omitting dependency rules;
- ignoring accessibility, security, errors, or testing where relevant;
- describing only advantages and hiding tradeoffs;
- turning future ideas into current commitments;
- leaving major decisions without evidence or traceability.

## Review checklist

### Completeness and correctness

- [ ] Scope is clear.
- [ ] Current, target, and transitional architecture are distinguished.
- [ ] Repository observations reference a pinned snapshot.
- [ ] Major boundaries, responsibilities, and dependency rules are explicit.
- [ ] Important data, state, and interaction flows are covered.
- [ ] Relevant accessibility, security, error, deployment, and testing concerns are included.
- [ ] Tradeoffs, constraints, and risks are stated.

### Consistency, traceability, risks, and uncertainty

- [ ] Decisions support `REQUIREMENTS.md` and `SPEC.md`.
- [ ] The document does not contradict `DESIGN.md`.
- [ ] Proposed structures are not presented as existing.
- [ ] Decisions reference evidence or approved constraints.
- [ ] Inferences and recommendations are labeled.
- [ ] Open questions remain visible.
- [ ] Example technologies were not adopted without evidence.
- [ ] Architecture can guide `PLAN.md` without duplicating sequencing.

## Quality test

After reading `ARCHITECTURE.md`, a developer should be able to answer:

1. What are the major parts of the system?
2. What responsibility belongs to each part?
3. Which dependencies are allowed or prohibited?
4. How do data and state move?
5. Where do validation and business rules belong?
6. How are external systems and persistence isolated?
7. How are accessibility, errors, security, and testing supported structurally?
8. What is current versus proposed?
9. Which tradeoffs and risks were accepted?
10. Which decisions must not change casually?
