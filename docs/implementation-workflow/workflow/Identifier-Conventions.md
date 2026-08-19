# Identifier Conventions

Stable, globally distinct identifiers make sources, evidence, decisions, tasks, and validation traceable without ambiguity.

## Identifier namespaces

| Prefix | Normal owner | Purpose |
|---|---|---|
| `SRC-DS-*` | Baseline owner | Design-source snapshots |
| `SRC-REPO-*` | Baseline owner | Repository and code snapshots |
| `SRC-RUN-*` | Baseline owner | Runtime and deployment snapshots |
| `SRC-DOC-*` | Baseline owner | Documentation snapshots |
| `SRC-ASSET-*` | Baseline owner | Asset and implementation-input snapshots |
| `EVD-*` | `DESIGN-AUDIT.md` | Evidence observed within pinned sources |
| `AUD-*` | `DESIGN-AUDIT.md` | Audit findings |
| `REQ-FR-*` | `REQUIREMENTS.md` | Functional requirements |
| `REQ-BR-*` | `REQUIREMENTS.md` | Business rules |
| `REQ-DR-*` | `REQUIREMENTS.md` | Data requirements |
| `REQ-NFR-*` | `REQUIREMENTS.md` | Non-functional requirements |
| `REQ-AR-*` | `REQUIREMENTS.md` | Accessibility requirements |
| `REQ-SEC-*` | `REQUIREMENTS.md` | Security requirements |
| `REQ-CON-*` | `REQUIREMENTS.md` | Constraints |
| `DES-*` | `DESIGN.md` | General design decisions |
| `DES-RWD-*` | `DESIGN.md` | Responsive design decisions |
| `DES-INT-*` | `DESIGN.md` | Interaction-design decisions |
| `SPEC-BEH-*` | `SPEC.md` | Behavioral specifications |
| `SPEC-INT-*` | `SPEC.md` | Interaction specifications |
| `SPEC-VAL-*` | `SPEC.md` | Validation and error specifications |
| `SPEC-ACC-*` | `SPEC.md` | Accessibility specifications |
| `SPEC-DATA-*` | `SPEC.md` | Data and interface specifications |
| `AC-*` | `SPEC.md` or requirement acceptance criteria | Acceptance criteria |
| `ADR-*` | `ARCHITECTURE.md` or ADR files | Architecture decisions |
| `PLAN-*` | `PLAN.md` | Material plan items |
| `P01-T01` | `TASKS-INDEX.md` and task files | Implementation tasks |
| `DOC-*` | `DOCUMENT-REVIEW.md` | Documentation-review findings |
| `PLANREV-*` | `PLAN-REVIEW.md` | Plan-review findings |
| `IMPL-*` | `IMPLEMENTATION-REVIEW.md` | Implementation-review findings |

Use zero-padded suffixes such as `SRC-DS-001`, `REQ-FR-001`, `SPEC-ACC-004`, and `PLAN-012`.

The normal owner column describes the separate-artifact model. Express defines the same namespaces in their matching `WORKPACK.md` sections. Lite defines requirements, design, specification, and planning IDs in their matching `IMPLEMENTATION-BRIEF.md` sections.

## Snapshot ownership rules

- Express defines every `SRC-*` identifier in the Source baseline section of `WORKPACK.md`.
- Lite, Standard, and Full define every `SRC-*` identifier in `SOURCE-BASELINE.md`.
- A snapshot ID identifies one source revision or one explicitly time-bound observation.
- Never edit a snapshot ID so it points to different content.
- Create a new snapshot ID when a source changes materially and follow [`Source-Snapshots.md`](Source-Snapshots.md).
- Evidence IDs reference the snapshot in which evidence was observed; they do not replace the snapshot ID.

## General ownership rules

- Each identifier is created and defined in exactly one owning artifact or consolidated ownership section.
- Other documents or sections reference the identifier; they do not redefine it.
- A specification must not reuse a requirement identifier as its own identifier.
- A finding identifier records the review finding, not the source item that caused it.
- A task identifier must remain synchronized between the task index and task file, or between the Express workpack task section and optional workflow record.

## Stability rules

- Never renumber an identifier after another artifact or section references it.
- Never reuse an identifier that was deleted, rejected, superseded, or invalidated.
- Update an item in place when its identity remains the same.
- Preserve superseded identifiers and point to replacements.
- Add new identifiers at the end of the relevant namespace.

Snapshot identity fields are stricter: correct recording mistakes explicitly, but never disguise a source change as a correction.

## Express profile

`WORKPACK.md` contains multiple ownership sections while preserving normal namespaces:

- source baseline section → `SRC-*`;
- evidence and audit section → `EVD-*` and `AUD-*`;
- requirement section → `REQ-*`;
- design section → `DES-*`, `DES-RWD-*`, and `DES-INT-*`;
- specification section → `SPEC-*` and `AC-*`;
- implementation approach → `PLAN-*` when material plan items need stable references;
- single task section → normally `P01-T01`;
- final implementation review → `IMPL-*`.

Consolidating one workpack does not merge identifier responsibilities. When Express upgrades, move each ID to the matching target artifact without renumbering it.

## Lite profile

`IMPLEMENTATION-BRIEF.md` may contain multiple ownership sections, but it still uses normal namespaces:

- requirement section → `REQ-*`;
- design section → `DES-*`;
- specification section → `SPEC-*` and `AC-*`;
- plan section → `PLAN-*`.

Consolidating files does not merge identifier responsibilities.

## References

Good:

```md
- Baseline: `SRC-DS-001`, `SRC-REPO-001`.
- Implements `SPEC-INT-003` and satisfies `AC-007`.
- Supported by `EVD-012` and `REQ-AR-004`.
```

Avoid ambiguous references such as “the latest design,” “interaction 3,” or `FR-004`.

## Migration from older documents

Existing artifacts using shorter identifiers may keep them to avoid breaking established references. For new projects, use the global namespaces in this document.

When migrating an unimplemented draft set:

1. migrate identifiers consistently across all artifacts or consolidated sections;
2. update every reference in the same change;
3. record the migration in the active control record;
4. verify that no old or duplicate reference remains.

Do not partially migrate a connected artifact set.
