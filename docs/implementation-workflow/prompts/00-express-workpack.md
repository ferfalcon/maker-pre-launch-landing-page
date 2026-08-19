# Express Profile — Workpack Reference

This is an Express profile reference, not an end-to-end execution prompt for CLI-managed orchestration.

When CLI-managed, execute Express one stage at a time using `prompts/00-intake.md` through `prompts/11-implementation-review.md`. Every stage writes its narrative responsibility into the appropriate section of the single `WORKPACK.md`; stage gates still apply between responsibilities.

Express remains eligible only while all are true:

- one bounded source scope and coherent implementation result;
- at most one task;
- no meaningful routing/shared state/persistence/auth/API/migration/deployment/security/privacy/rollback decision;
- no unresolved material product decision;
- no multi-contributor coordination requiring separate task ownership;
- independent validation remains possible.

If eligibility fails, stop affected work and upgrade. Preserve stable IDs and source records.

The workpack owns narrative evidence, requirements/design/specification/planning reasoning, implementation discoveries/deviations, risks, and final-review reasoning. In CLI-managed mode the workflow record owns mutable snapshot/task/validation/output-lineage state.
