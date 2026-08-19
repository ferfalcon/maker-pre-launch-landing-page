# Stage 9 — Create the Implementation Task Set

Verify approved plan/review, architecture decision, repository snapshot, and traceability before decomposition.

## Profile targets

- Express: define exactly one task narrative inside `WORKPACK.md` and one canonical CLI task.
- Lite: use task artifact(s); use `TASKS-INDEX.md` only when multiple tasks/dependencies make it useful.
- Standard, Full: use `TASKS-INDEX.md` plus one `TASK` artifact per task.

Every task needs one independently verifiable objective, stable `P##-T##` ID, task-start `SRC-REPO-*`, prerequisites, references, repository context, scope/files, ordered non-code implementation steps, integrated accessibility/responsive/state/error/testing work, validation, acceptance criteria, risks/discoveries/deviations, and DoD.

Make every task Ready only after its prerequisites/required validation definitions/trace coverage are complete. Continuous-documentation mode stops at Stage 9 even when the gate passes; switch mode before entering Stage 10.
