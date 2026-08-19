# Repository Guidelines

## Operating Environment

GitHub is the primary remote repository environment for this toolkit. When an agent is given GitHub repository, branch, pull request, or commit context, treat that context as authoritative repository identity instead of rediscovering it through filesystem traversal, `git remote`, package metadata, or README inspection.

Prefer GitHub-native repository access for remote file content, metadata, branches, commits, pull requests, and reviews. Do not clone or recreate a repository solely to inspect content already available through GitHub. Use a local checkout or shell when command execution is required, such as running the workflow CLI, validators, tests, builds, or repository scripts.

Keep repository access and workflow execution separate. GitHub identifies remote repository state; `design-workflow` owns executable workflow state for CLI-managed implementation projects. When working on such a project, begin with `design-workflow agent-context --json` and follow the exact toolkit repository/revision and resource resolution returned by the packet rather than reconstructing workflow state from GitHub files.

This is GitHub-first, not GitHub-only: if an explicit task uses another repository environment, follow that environment while preserving the same repository-state/workflow-state boundary.

## Project Structure & Module Organization

This is a dependency-free Node.js CLI and documentation toolkit. Put normative rules in `workflow/`, source inspection guidance in `source-adapters/`, writing guidance in `guidelines/`, reusable documents in `templates/`, and stage instructions in `prompts/`. CLI code lives in `cli/` and `cli/lib/`; schemas, repository checks, fixtures, and non-normative samples live in `schemas/`, `scripts/`, `tests/fixtures/`, and `examples/` respectively.

## Build, Test, and Development Commands

There is no compilation step or runtime dependency installation.

- `node cli/design-workflow.mjs help` runs the CLI locally.
- `npm run validate` runs all repository, record, generated-state, and CLI checks.
- `npm run test:records`, `npm run test:state`, and `npm run test:cli` run focused suites.

Run the full validator before submitting structural, schema, template, prompt, or CLI changes.

## Coding Style & Naming Conventions

Use ESM `.mjs`, two-space indentation, semicolons, single quotes, and descriptive `camelCase`. Keep the CLI dependency-free unless maintainers approve otherwise. Follow existing names such as `SOURCE-BASELINE.md`, `prompts/04-specification.md`, and `*.template.md`. Preserve identifiers like `SRC-DS-001`, `REQ-FR-001`, and `P01-T01`. Use relative Markdown links.

## Testing Guidelines

Add focused `scripts/test-*.mjs` coverage and update `tests/fixtures/` for semantic changes. Test accepted and rejected states. No numeric coverage target exists; new failure modes and the complete validator must pass.

## Commit & Pull Request Guidelines

Use short, imperative, sentence-case subjects, for example `Handle malformed records during state validation`. Keep commits narrowly scoped. Pull requests must explain the change, repository area, affected profiles or artifacts, compatibility impact, validation, and remaining risks. Review first for correctness, then for consistency and traceability. Add screenshots only for rendered or visual changes.

## Canonical State Rules

In CLI-managed projects, `.workflow/workflow-record.json` owns mutable state. Mutate executable workflow state only through `design-workflow`; never hand-edit `.workflow/workflow-record.json` or `.workflow/generated/*`.

`design-workflow sync` is a projection-recovery command, not a record-mutation path. Use it to reconcile stale or missing generated views after interrupted writes or other recovery conditions, then run `design-workflow sync --check` and `design-workflow validate`. Commit the canonical record and generated views together whenever a supported CLI mutation changes them.
