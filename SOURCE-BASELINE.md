---
artifact: SOURCE-BASELINE
project: Maker pre-launch landing page
profile: Lite
execution_mode: Gated
created: 2026-08-19
updated: 2026-08-19
---

# Source Baseline

## 2. Document Information

- Project:
- Created: 2026-08-19
- Last updated: 2026-08-19
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
- **Captured or inspected at:** 2026-08-19THH:MM:SS±HH:MM
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
- **Captured at:** 2026-08-19THH:MM:SS±HH:MM
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
- **Captured at:** 2026-08-19THH:MM:SS±HH:MM
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
- **Captured at:** 2026-08-19THH:MM:SS±HH:MM
- **Access and reproduction instructions:**
- **Known limitations:**

## 7. Asset Source Evidence

### SRC-ASSET-001 — Asset or bundle title

- **Type:** Image / Icon / Font / Archive / Other
- **Path or reference:**
- **Included contents:**
- **Format and size:**
- **SHA-256 checksum evidence:**
- **Captured at:** 2026-08-19THH:MM:SS±HH:MM
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
