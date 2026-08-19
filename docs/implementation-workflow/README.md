# Design-to-Implementation Workflow

A structured, evidence-driven toolkit for turning a Figma file or another design source into a documented, planned, implemented, and validated web project.

The workflow supports AI-assisted and human-led work with explicit source baselines, proportional documentation, accessibility, responsive behavior, repository-aware planning, small implementation tasks, evidence-backed validation, and machine-checkable workflow control.

## Choose your entry point

Use the smallest entry point that matches what you are doing:

- **Use the workflow in an implementation project:** start with [`QUICKSTART.md`](QUICKSTART.md) to choose a profile before initialization, then use [`workflow/Design-Implementation-Workflow.md`](workflow/Design-Implementation-Workflow.md) as the normative process overview.
- **Run the workflow with an AI agent:** use [`AGENTS-instructions.md`](AGENTS-instructions.md) as the permanent consumer-agent bootstrap. It delegates executable behavior to the canonical orchestration contract and the current agent packet.
- **Set up a ChatGPT Project around an implementation repository:** copy and adapt [`AI-project-settings.md`](AI-project-settings.md). It defines the ChatGPT host/tool posture and points the project back to the implementation repository and vendored workflow; it is not a workflow-state authority.
- **Prepare a Figma file before the formal developer-handoff audit:** invoke [`AGENTS-PROMPT-Figma-file-preparation.md`](AGENTS-PROMPT-Figma-file-preparation.md), which delegates to the single canonical preparation procedure.
- **Develop or change this toolkit:** follow [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Use the CLI or schemas directly:** see [`cli/README.md`](cli/README.md) and [`schemas/README.md`](schemas/README.md).

Do not read every reference document up front. The workflow and agent packet are designed to resolve the current profile, stage, task, and required resources without broad toolkit browsing.

## Workflow overview

### Choose a profile before initialization

Profile selection is a complexity and risk decision, not a shortcut choice. Start with [`QUICKSTART.md`](QUICKSTART.md) for a compact routing decision and use [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) as the canonical owner of eligibility, artifact, and upgrade rules.

### Express path

After Express eligibility is confirmed:

```text
WORKPACK.md
  ├── control + Express eligibility
  ├── source baseline + scope
  ├── design evidence + findings
  ├── requirements + design intent + specification
  ├── repository-aware approach + one task
  ├── implementation + output lineage
  └── validation + final review
```

Express keeps one narrow implementation result in one workpack and at most one task. Use [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) for the canonical profile rules and upgrade conditions.

### Lite, Standard, and Full path

```text
Stage 0 controls
    ↓
Pinned design-source audit
    ↓
Requirements → Design intent → Specification
    ↓
Documentation consistency gate
    ↓
Architecture, when applicable
    ↓
Implementation plan → Adversarial plan review
    ↓
Tasks → One-task-at-a-time implementation
    ↓
Pinned implementation output + validation runtime
    ↓
Final implementation review
```

The exact artifact set and architecture requirements depend on the selected profile. See [`workflow/Design-Implementation-Workflow.md`](workflow/Design-Implementation-Workflow.md) and [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md).

## State and agent execution

Projects can be CLI-managed or Markdown-only. In CLI-managed projects, `.workflow/workflow-record.json` owns mutable executable workflow state and `.workflow/generated/` contains read-only projections. One of those projections, `.workflow/generated/AGENT-CONTEXT.json`, provides portable current-stage/task/policy/resource routing for agents that can read the repository through GitHub but cannot execute the CLI; it does not own state or authorize CLI mutations. See [`workflow/State-Ownership.md`](workflow/State-Ownership.md) for the canonical ownership model.

AI-agent execution is defined by [`workflow/Agent-Orchestration.md`](workflow/Agent-Orchestration.md) and bootstrapped through [`AGENTS-instructions.md`](AGENTS-instructions.md). Use the executable agent packet when available; otherwise use the generated GitHub routing projection rather than reconstructing workflow state from record/generated Markdown or broad toolkit inspection. The consumer bootstrap owns the exact execution protocol.

## Repository map

| Area | Responsibility |
|---|---|
| `workflow/` | Normative process contracts: stages, profiles, execution, source authority, state ownership, identifiers, validation, and orchestration |
| `source-adapters/` | Source-specific inspection and preparation guidance |
| `guidelines/` | Artifact-writing and review guidance |
| `templates/` | Reusable project artifact structures |
| `prompts/` | Stage-specific and profile-specific executable instructions |
| `cli/` | Dependency-free `design-workflow` CLI and runtime behavior |
| `schemas/` | Machine-readable workflow control definitions |
| `examples/` | Explicitly non-normative examples |
| `scripts/` and `tests/` | Repository integrity, semantic validation, and regression coverage |
| Root `AGENTS*` files | Narrow launchers/contracts for toolkit development, consumer-agent execution, and Figma preparation |
| `AI-project-settings.md` | Optional ChatGPT Project host template; not part of canonical workflow state |

## Reference contracts

Read these when the current task needs the corresponding domain:

- [`workflow/Workflow-Profiles.md`](workflow/Workflow-Profiles.md) — profile eligibility, artifact sets, and upgrade rules.
- [`workflow/Source-Snapshots.md`](workflow/Source-Snapshots.md) — source identity, pinning, reverification, and supersession.
- [`workflow/Source-Authority.md`](workflow/Source-Authority.md) — evidence classifications and decision authority.
- [`workflow/State-Ownership.md`](workflow/State-Ownership.md) — record, generated-view, and narrative ownership.
- [`workflow/Identifier-Conventions.md`](workflow/Identifier-Conventions.md) — stable identifiers and traceability namespaces.
- [`workflow/Validation-Rules.md`](workflow/Validation-Rules.md) — validation evidence, review passes, retesting, and final acceptance.
- [`workflow/Agent-Orchestration.md`](workflow/Agent-Orchestration.md) — canonical AI-agent runtime behavior.

## Toolkit validation

When changing this toolkit, run:

```bash
npm run validate
```

Focused commands and contribution expectations live in [`CONTRIBUTING.md`](CONTRIBUTING.md) and `package.json`.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Structural changes must preserve one clear owner for each rule and pass the repository validator.

## License

Licensed under the MIT License. See [`LICENSE`](LICENSE).
