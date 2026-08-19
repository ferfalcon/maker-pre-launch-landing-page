# Stage 10 — Implement One Task

Implementation edits require task authorization plus current source/repository integrity.

- In an executable CLI context, `policy.codeEdits: allowed-with-current-task-scope` means the current Stage 10 task is authorized after local workflow diagnostics have passed.
- In the portable GitHub projection, `policy.implementationAuthorization: current-task-authorized` and `policy.codeEdits: allowed-after-source-integrity-check` authorize only the persisted task scope. The projection does not evaluate runtime integrity, so verify the relevant active inputs and repository state before editing. If that verification cannot be completed, do not edit implementation code.

## Profile targets

- Express: implement the single CLI task and record implementation discoveries/deviations/completion narrative in `WORKPACK.md`.
- Lite, Standard, Full: implement the current CLI task and update its `TASK` narrative artifact.

Before editing, verify active design/documentation inputs, verify the task-start `SRC-REPO-*` commit, inspect affected files/conventions, and classify differences as Unchanged, Expected workflow output, Unexpected upstream/concurrent change, or Unavailable. Stop for impact assessment on unexpected material changes.

Implement only the current task in small reviewable changes. Integrate required semantics/keyboard/focus, responsive behavior, states/errors/content edges, and tests.

Run all required validations honestly. Record structured check results/output lineage through the CLI; keep implementation discoveries/deviations/rationale in narrative Markdown. Commit the approved result and complete the task with the exact HEAD commit so the CLI creates the Implementation-output `SRC-REPO-*`.
