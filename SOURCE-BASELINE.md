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

- Project: Maker pre-launch landing page
- Created: 2026-08-19
- Last updated: 2026-08-19
- Owner: Project owner / workflow operator
- Related context: `PROJECT-CONTEXT.md`
- Operational state: `WORKFLOW-STATE.md`

## 3. Design Source Evidence

### SRC-DS-001 — Figma `🤖 Workflow` page

- **Source type:** Figma design file
- **File key:** `ooEONYJXXgjZkQNmTh6dfV`
- **Purpose:** Authoritative visual/design source for the landing-page implementation workflow.
- **Included scope:** Page `🤖 Workflow` (`29:4756`), including sections `Style Guide` (`32:17743`), `Components` (`32:18709`), and `Main page` (`34:19665`). `Main page` contains Desktop (`32:10924`, 1440 px), Tablet (`32:11410`, 768 px), and Mobile (`32:11529`, 375 px) compositions.
- **Excluded scope:** Figma pages `👋 Overview` (`3:2`), `🎨 Design System` (`3:69`), `🖱️ Prototype` (`3:70`), and `✨ Designs` (`3:134`) unless a later stage explicitly rebaselines them.
- **Captured or inspected at:** 2026-08-19T16:54-03:00
- **Version, revision, or checksum evidence:** No named Figma version or checksum-backed export is registered. The normal Figma URL is mutable, so this snapshot is intentionally Time-bound.
- **Captured evidence:** Connected Figma metadata and Plugin API structural inspection. The scoped page contains 58 local components, 9 component sets, 202 instances, and 37 local variables in the `Foundations` collection (single `Default` mode).
- **Access and reproduction instructions:** Open the project Figma file and inspect page/node `29:4756`; connected Figma tooling can read the page directly.
- **Dependencies:** All 202 inspected instances resolve to local main components; no remote-library component dependency was detected in the authorized page. Local `Foundations` variables are part of the source.
- **Authority for this project:** Primary design authority inside the explicitly authorized `🤖 Workflow` scope.
- **Known limitations:** The source is mutable and not pinned to a named Figma version. Stage 0 establishes structure and scope, not a full design audit. Figma does not by itself prove semantic HTML, keyboard/screen-reader behavior, in-between responsive behavior, browser rendering, or runtime behavior.

## 4. Repository Source Evidence

### SRC-REPO-001 — Implementation repository baseline

- **Repository:** `https://github.com/ferfalcon/maker-pre-launch-landing-page`
- **Relevant application, package, or directory:** `frontend/`
- **Branch at capture:** `main`
- **Pinned implementation-input commit:** `e49ba2886a9a982c4d8d0aa31d2a7adf7460778d` (canonical identity is owned by the workflow record).
- **Captured at:** 2026-08-19T16:50-03:00
- **Lockfile, submodule, or workspace state:** `frontend/pnpm-lock.yaml` and `frontend/pnpm-workspace.yaml` are present; no submodule evidence was found in the inspected root.
- **Uncommitted changes or patch:** Not applicable to the immutable GitHub commit snapshot.
- **Access and reproduction instructions:** Inspect repository commit `e49ba2886a9a982c4d8d0aa31d2a7adf7460778d`; implementation work is rooted at `frontend/`.
- **Build or inspection context:** GitHub inspection only at Stage 0. `frontend/package.json` declares Astro `^7.2.3`, Node `>=22.12.0`, and `astro build` as the production build command.
- **Existing implementation state:** `frontend/src/pages/index.astro` still renders the default Astro `Welcome` starter component; the Maker design has not been implemented in the application baseline.
- **Known limitations:** No local build/runtime execution was performed during Stage 0. Newer commits after the pinned input are workflow-control/bookkeeping changes and are classified separately from implementation-source changes.

## 5. Other Source Categories

No runtime, documentation, or standalone asset snapshot is registered as an active Stage 0 input. The repository README references the production Vercel URL, but runtime state has not been promoted to a canonical `SRC-RUN-*` baseline yet.

## 6. Source Verification Log

| Date and time | Snapshot | Verification method | Result classification | Change detected | Action |
|---|---|---|---|---|---|
| 2026-08-19T16:54-03:00 | `SRC-DS-001` | Connected Figma structural inspection | Unchanged | No | Canonical verification recorded by remote `design-workflow snapshot verify` (issue #2). |
| 2026-08-19T16:55-03:00 | `SRC-REPO-001` | Git ancestry and commit-purpose comparison | Expected workflow output | Yes, workflow-only | Canonical verification recorded by remote `design-workflow snapshot verify` (issue #3); retain `e49ba288…` as the implementation-input baseline. |

## 7. Upstream Rebaseline and Impact Assessments

No unexpected upstream or concurrent source change is known at Stage 0. No rebaseline is required.

## 8. Baseline Review

### Pass 1 — Completeness and correctness

- [x] Every material Stage 0 source has a canonical snapshot ID and evidence section.
- [x] Exact design and repository scope are recorded.
- [x] Repository evidence is pinned to a commit SHA in canonical workflow state.
- [x] Mutable Figma evidence is explicitly Time-bound rather than presented as immutable.
- [x] Access and reproduction limitations are explicit.
- [x] Unregistered runtime/document/asset references are not presented as canonical inputs.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [x] Generated source state was freshness-checked against `.workflow/workflow-record.json` before use.
- [x] Design scope matches the project-authorized `🤖 Workflow` page and node ID.
- [x] Expected workflow commits are distinguished from implementation-input changes.
- [x] No unexpected source change is being silently absorbed into the baseline.
- [x] Evidence sections do not redefine record-owned mutable status or lineage.
- [x] The remaining material uncertainty—the mutable Figma URL—is explicit and will require re-verification at later gates.
