# Source Baseline Template

Use this template during Stage 0 to create `SOURCE-BASELINE.md`. Follow [`../workflow/Source-Snapshots.md`](../workflow/Source-Snapshots.md), [`../workflow/Identifier-Conventions.md`](../workflow/Identifier-Conventions.md), and [`../workflow/State-Ownership.md`](../workflow/State-Ownership.md).

When `.workflow/workflow-record.json` exists, it owns mutable snapshot identity, status, role, pin strength, reference, commit, parent, and producing-task fields. Use `.workflow/generated/SOURCE-INDEX.md` as the human-readable registry and do not maintain a second mutable snapshot table here.

This document owns detailed scope, evidence, reproduction instructions, authority, dependencies, limitations, verification narrative, and rebaseline impact.

<!-- artifact:start -->

```yaml
---
artifact: SOURCE-BASELINE
project: Project name
profile: Lite | Standard | Full
execution_mode: Gated | Continuous documentation | Task-by-task
status: Draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->

# Source Baseline

## 1. State Ownership Mode

- [ ] CLI-managed — snapshot registry: `.workflow/generated/SOURCE-INDEX.md`
- [ ] Markdown-only — complete the fallback registry in Appendix A

Run `design-workflow sync --check` before relying on generated source status.

## 2. Document Information

- Status: Draft
- Project:
- Created: YYYY-MM-DD
- Last updated: YYYY-MM-DD
- Owner:
- Related context: `PROJECT-CONTEXT.md`
- Operational state: `WORKFLOW-STATE.md`

## 3. Design Source Evidence

### SRC-DS-001 — Snapshot title

The ID and current registry fields belong in the workflow record in CLI-managed mode.

- **Source type:** Figma / Screenshot / Image / PDF / Existing website / Other
- **Purpose:**
- **Included scope:**
- **Excluded scope:**
- **Captured or inspected at:** YYYY-MM-DDTHH:MM:SS±HH:MM
- **Version, revision, or checksum evidence:**
- **Captured evidence:**
- **Access and reproduction instructions:**
- **Dependencies:**
- **Authority for this project:**
- **Known limitations:**

For Figma, record file key, page and node IDs, named version when available, library dependencies, and inspection mode.

## 4. Repository Source Evidence

### SRC-REPO-001 — Repository snapshot title

- **Repository:**
- **Relevant application, package, or directory:**
- **Branch at capture:**
- **Captured at:** YYYY-MM-DDTHH:MM:SS±HH:MM
- **Lockfile, submodule, or workspace state:**
- **Uncommitted changes or patch:** None / reference
- **Access and reproduction instructions:**
- **Build or inspection context:**
- **Known limitations:**

Commit, parent, role, task, and current status belong in the workflow record in CLI-managed mode.

## 5. Runtime Source Evidence

### SRC-RUN-001 — Runtime snapshot title

- **Environment:** Production / Preview / Staging / Local / Other
- **URL or entry point:**
- **Deployment or release evidence:**
- **Associated repository evidence:**
- **Captured at:** YYYY-MM-DDTHH:MM:SS±HH:MM
- **Browser, viewport, and device context:**
- **Authentication, personalization, or feature-flag state:**
- **Test data context:**
- **Captured evidence:**
- **Known limitations:**

## 6. Documentation Source Evidence

### SRC-DOC-001 — Document title

- **Authority:** Normative / Informative / Historical
- **Path or URL:**
- **Included sections:**
- **Revision, version, date, commit, or checksum evidence:**
- **Captured at:** YYYY-MM-DDTHH:MM:SS±HH:MM
- **Access and reproduction instructions:**
- **Known limitations:**

## 7. Asset Source Evidence

### SRC-ASSET-001 — Asset or bundle title

- **Type:** Image / Icon / Font / Archive / Other
- **Path or reference:**
- **Included contents:**
- **Format and size:**
- **SHA-256 checksum evidence:**
- **Captured at:** YYYY-MM-DDTHH:MM:SS±HH:MM
- **Licensing or usage constraints:**
- **Known limitations:**

## 8. Source Verification Log

| Date and time | Snapshot | Verification method | Result classification | Change detected | Action |
|---|---|---|---|---|---|
| ... | ... | Commit comparison / named-version check / visual comparison / checksum / other | Unchanged / Expected output / Unexpected change / Unavailable | Yes / No / Unknown | ... |

Record checks before stages, after meaningful pauses, before tasks, and before final acceptance. Current snapshot status remains in the workflow record in CLI-managed mode.

## 9. Upstream Rebaseline and Impact Assessments

| New snapshot | Previous snapshot | Change summary | Affected artifacts | Earliest affected stage | Required action | Status |
|---|---|---|---|---:|---|---|
| ... | ... | ... | ... | ... | ... | Open / In progress / Complete |

Use this table for changed upstream inputs or unexpected concurrent changes, not for approved task output commits.

## 10. Baseline Review

### Pass 1 — Completeness and correctness

- [ ] Every material source has a snapshot ID and evidence section.
- [ ] Exact scope and capture time are recorded.
- [ ] Repository snapshots use commit SHAs in the canonical registry.
- [ ] Task outputs have parent snapshots and task IDs in the canonical registry.
- [ ] Mutable sources are not mislabeled as immutable.
- [ ] Access and reproduction limitations are explicit.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Generated source state is current in CLI-managed mode.
- [ ] Identifiers follow `Identifier-Conventions.md`.
- [ ] Expected implementation outputs are distinguished from upstream source changes.
- [ ] Rebaseline impact assessments cover unexpected upstream changes.
- [ ] Evidence sections do not redefine record-owned status or lineage.
- [ ] No artifact silently relies on undefined or newer source content.

<!-- control:markdown-only:start -->

---

# Appendix A — Markdown-only Snapshot Registry

Complete this appendix only when the project does not use `.workflow/workflow-record.json`.

## A1. Active Baseline and Lineage

| Purpose | Active snapshot IDs | Required for current scope | Notes |
|---|---|---|---|
| Design input | `SRC-DS-001` | Yes / No | ... |
| Repository input baseline | `SRC-REPO-001` | Yes / No | ... |
| Documentation input | `SRC-DOC-001` | Yes / No | ... |
| Asset input | `SRC-ASSET-001` | Yes / No | ... |
| Current task start | `SRC-REPO-001` | Yes / No | ... |
| Latest implementation output | `SRC-REPO-002` / None | Yes / No | ... |
| Current validation runtime | `SRC-RUN-001` / None | Yes / No | ... |

## A2. Snapshot Registry

| ID | Role | Status | Pin strength | Canonical reference | Commit or version | Parent | Produced by task |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... |

<!-- control:markdown-only:end -->

<!-- artifact:end -->
