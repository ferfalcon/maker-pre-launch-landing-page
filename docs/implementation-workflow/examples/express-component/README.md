# Express Profile Example — Article Preview Card

This non-normative example demonstrates the Express profile for one isolated component correction.

## Scenario

A supplied design shows one article preview card at desktop and mobile widths. The repository already contains the component. The work is limited to correcting responsive layout, semantic structure, focus visibility, and long-title wrapping.

The work remains Express-eligible because it has:

- one design-source scope;
- one existing component;
- one coherent implementation result;
- one implementation task;
- no routing, shared state, persistence, authentication, external APIs, migration, or operational risk;
- independently verifiable acceptance criteria.

## Artifact

Use [`WORKPACK.md`](WORKPACK.md).

No separate source-baseline, context, audit, requirements, design, specification, plan, task, or implementation-review files are created.

## Upgrade examples

This work would upgrade to Lite or Standard if inspection revealed:

- the card is part of several connected listing and detail flows;
- a new shared content model or API contract is required;
- multiple independent components must be changed;
- repository-wide token migration is necessary;
- unresolved product decisions affect click targets, metadata, or responsive content priority.
