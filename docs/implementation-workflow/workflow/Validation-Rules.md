# Validation Rules

Validation establishes whether an artifact, consolidated workpack section, task, or implementation satisfies its approved sources. It must be reproducible, scoped, and honest about what was and was not executed.

## Core rules

1. Never claim a check passed unless it was executed successfully.
2. Identify the exact source snapshots, artifact or workpack version, repository commit, runtime, environment, and conditions used.
3. Define the expected result before reporting the actual result.
4. Distinguish Passed, Failed, Blocked, Not executed, and Not applicable.
5. Explain every failed, blocked, skipped, unavailable, or not-applicable check.
6. Automated checks do not replace required manual interaction, responsive, accessibility, visual, or content review.
7. A check that cannot reproduce the required condition is incomplete, not passed.
8. Corrected findings require retesting.
9. Validation must cover the changed scope and likely regressions outside it.
10. A final result must reflect the highest unresolved material severity and source-lineage integrity.
11. Profile eligibility is part of validation; an Express result cannot be accepted if the work exceeded its one-result and one-task constraints without upgrading.

## Evidence requirements

Validation evidence should include, as applicable:

- command or tool;
- date and environment;
- repository and runtime snapshot IDs;
- browser, device, viewport, zoom, and input method;
- test data and account state;
- expected result;
- actual result;
- output, screenshot, recording, log, or reproducible steps;
- related requirement, specification, acceptance criterion, plan item, or task;
- finding ID when a failure exists.

Do not include secrets, tokens, personal data, or sensitive logs.

## Artifact and consolidated-section reviews

Documentation and planning reviews use two distinct passes. Express records both inside `WORKPACK.md`; Lite records consolidated reviews in `IMPLEMENTATION-BRIEF.md`; Standard and Full use their separate review artifacts.

### Pass 1 — Completeness and correctness

Check each artifact or ownership section against its responsibility, template, sources, and scope. Correct omissions and factual errors before beginning the second pass.

For Express, also confirm every eligibility condition remains true after source and repository inspection.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

Check the corrected artifact set or workpack against upstream and downstream responsibilities, snapshot metadata, identifiers, conflicts, assumptions, risks, blockers, and profile limits.

For Express, confirm one task remains sufficient and no separate architecture, integration, migration, operational, or product-decision work is hidden inside the implementation approach.

Rereading without changing review focus does not count as two reviews.

## Task validation

A task is complete only when:

- its objective is implemented within scope;
- required acceptance criteria pass;
- its task-start repository snapshot is known;
- its output commit is recorded as an Implementation output snapshot;
- required automated and manual checks were executed;
- no required check remains failing, blocked, or unverified;
- documentation discoveries and deviations are recorded;
- downstream tasks have an accurate starting state.

Express records these items in the Single implementation unit, Implementation record, and Validation evidence sections of `WORKPACK.md`. Express permits exactly one task and no task prerequisites.

## Implementation validation layers

Use only layers applicable to the project.

### Static and build validation

- formatting;
- linting;
- type checking;
- compilation or build;
- dependency and configuration validation.

### Automated behavioral validation

- unit tests;
- component tests;
- integration tests;
- contract tests;
- end-to-end tests;
- regression tests.

### Accessibility validation

- semantic structure and heading hierarchy;
- keyboard operation;
- focus order, movement, return, and visibility;
- accessible names, descriptions, relationships, state, and announcements;
- contrast;
- touch targets;
- zoom, text resizing, and reflow;
- reduced motion;
- screen-reader behavior when required.

Automated accessibility tools are useful but cannot establish complete accessibility compliance.

### Responsive and content validation

Test:

- supplied design widths;
- intermediate widths;
- unusually narrow and wide conditions;
- content-driven breakpoint transitions;
- long, short, missing, and localized content;
- missing and failed assets;
- zoom and text enlargement;
- overflow and scrolling.

### State and failure validation

Cover applicable:

- default;
- hover;
- focus;
- active and selected;
- disabled;
- loading;
- empty;
- error;
- success;
- partial data;
- slow or failed requests;
- duplicate actions;
- offline or recovery behavior.

### Visual fidelity validation

Compare against a named `SRC-DS-*` snapshot. Review hierarchy, layout relationships, spacing, typography, color roles, component variants, iconography, imagery, interaction states, and approved deviations.

Pixel-level comparison may support review but should not override intentional responsive behavior, font-rendering differences, or approved implementation constraints.

### Non-functional validation

Validate approved requirements for performance, compatibility, security, privacy, reliability, SEO, analytics, deployment, migration, rollback, and observability. Do not invent thresholds during validation.

If an Express workpack discovers a material non-functional concern that requires design or architecture decisions, upgrade before acceptance.

## Severity

Suggested severity model:

- **Critical:** unsafe, inaccessible, data-loss, security, or core-flow failure that blocks acceptance.
- **High:** must-have requirement failure, major accessibility barrier, broken primary responsive layout, or incomplete lineage.
- **Medium:** material defect with a workaround or limited scope.
- **Low:** minor fidelity, documentation, or polish issue that does not block required use.

Severity must reflect user and project impact, not implementation effort.

## Final acceptance gate

Before accepting implementation, confirm:

- all referenced snapshot IDs exist in the active baseline owner;
- no artifact or workpack section silently depends on newer input content;
- the original repository input baseline is identified;
- the reviewed commit is an Implementation output snapshot;
- the validation runtime is tied to the reviewed output when applicable;
- every must-have requirement and material specification was reviewed;
- required checks were executed;
- failed checks and unresolved findings are visible;
- corrected findings were retested;
- approved deviations include authority and impact;
- remaining risks are explicit;
- the selected profile remained valid, or an upgrade was completed before acceptance.

Allowed final results:

- `Implementation accepted`
- `Implementation accepted with documented non-blocking deviations`
- `Implementation requires corrections`

## Toolkit validation

Run:

```bash
node scripts/validate-workflow.mjs
node scripts/test-workflow-record.mjs
```

The toolkit validator checks required repository structure, prompt sequencing, legacy-path removal, internal Markdown links, JSON syntax, and discovered machine-readable workflow records. The self-test verifies general and Express semantic rules. These checks validate repository and control-record integrity, not the quality of a project-specific workflow application.
