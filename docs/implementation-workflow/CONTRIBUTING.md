# Contributing

Contributions should improve the workflow without weakening evidence, accessibility, proportionality, source integrity, or honest validation.

## Before proposing a change

1. Read [`workflow/Design-Implementation-Workflow.md`](workflow/Design-Implementation-Workflow.md) and [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md). If the change affects CLI-managed or AI-agent execution, also read [`workflow/Agent-Orchestration.md`](workflow/Agent-Orchestration.md).
2. Identify which artifact or consolidated section owns the decision.
3. Check whether the change is normative guidance, a template, an adapter, a prompt, an example, a schema, or validation tooling.
4. Preserve existing identifier and snapshot semantics.
5. Avoid adding a new document when an existing owner can express the concern clearly.
6. When adding or changing a profile, update its normative rules, template path, prompt path, example, machine-readable schema, semantic validation, and tests together.

## Repository conventions

- Normative process rules belong in `workflow/`.
- Source-format inspection rules belong in `source-adapters/`.
- Artifact-writing guidance belongs in `guidelines/`.
- Reusable project artifact structures belong in `templates/`.
- Stage-specific or profile-specific executable instructions belong in `prompts/`.
- Machine-readable control definitions belong in `schemas/`.
- Non-normative demonstrations belong in `examples/`.
- Repository and semantic checks belong in `scripts/`.
- Validator fixtures belong in `tests/fixtures/`.

## Profile consistency

A profile change is incomplete unless all affected surfaces agree.

For Express, preserve:

- one normative `WORKPACK.md`;
- at most one task and no task prerequisites;
- explicit eligibility and upgrade triggers;
- source snapshots, normal ID namespaces, two reviews, output lineage, and final validation inside the workpack;
- semantic validator coverage that rejects accidental larger-profile artifacts.

For Lite, Standard, and Full, preserve their documented artifact ownership and architecture rules.

## Quality expectations

Changes should:

- distinguish confirmed, observed, inferred, recommended, and open information;
- avoid inventing product or technical decisions from design evidence;
- preserve accessibility as integrated work;
- avoid arbitrary breakpoints and unsupported focus behavior;
- keep current, target, and transitional states distinct;
- define validation without claiming unexecuted checks passed;
- preserve backwards traceability when identifiers or source snapshots change;
- keep low-risk workflows proportionate without hiding complexity that should trigger an upgrade.

## Release and discovery consistency

Repository-level contracts must evolve together:

- the version in `package.json` must have a dated release heading in `CHANGELOG.md`;
- new work after the current release belongs under `## [Unreleased]` until the next version is intentionally released;
- a canonical workflow entry point must be linked from the README `Start here` section when it is required to operate the toolkit correctly;
- canonical workflow contracts must be added to `scripts/validate-workflow.mjs` required paths so CI detects accidental removal.

Do not fix release drift by inventing a version bump. Decide the intended released version first, then align package metadata, changelog history, discovery links, and validation together.

## Validation

Run:

```bash
node scripts/validate-workflow.mjs
node scripts/test-workflow-record.mjs
```

Both commands must pass before a structural, profile, schema, semantic-rule, or link change is considered complete.

Also perform two review passes:

1. completeness and correctness;
2. consistency, traceability, source integrity, risks, and uncertainty after corrections.

## Pull requests

Explain:

- what changed;
- why it belongs in the selected repository area;
- affected workflow profiles, stages, artifacts, and consolidated sections;
- compatibility or migration impact;
- validation performed;
- remaining risks or follow-up work.

Examples must remain explicitly non-normative.
