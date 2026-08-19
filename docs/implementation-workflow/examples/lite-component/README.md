# Lite Component Example

This directory represents the expected shape of a Lite-profile example for an isolated component or small static interface that exceeds Express limits.

A complete Lite example should contain:

```text
SOURCE-BASELINE.md
PROJECT-CONTEXT.md
WORKFLOW-STATE.md
DESIGN-AUDIT.md
IMPLEMENTATION-BRIEF.md
Phase-01--Task-01.md
IMPLEMENTATION-REVIEW.md
```

Use Express instead when one narrow result can be owned by one `WORKPACK.md`, needs at most one task, and carries no meaningful architecture, integration, operational, or unresolved product-decision risk.

Use Lite when separate source control, audit, task tracking, or final review improves clarity; when more than one tightly related task is required; or when one workpack would become difficult to maintain.

Lite keeps requirements, design intent, specification, and planning clear inside separate sections of one `IMPLEMENTATION-BRIEF.md` without hiding architecture, dependencies, or risk.

A suitable demonstration component should include:

- at least one interaction;
- keyboard and focus behavior;
- responsive or container behavior;
- visible states;
- long-content handling;
- objective validation;
- enough scope or uncertainty to justify the separate Lite control artifacts.

Do not treat this directory as a normative implementation. Apply the workflow to the actual design source and repository.
