# Architecture Template

Use this template to create a project-specific `ARCHITECTURE.md`. Do not adopt example technologies or patterns without project or repository evidence.

Reference only snapshot IDs defined in `SOURCE-BASELINE.md`.

<!-- artifact:start -->

```yaml
---
artifact: ARCHITECTURE
status: Draft
baseline:
  design:
    - SRC-DS-001
  repository:
    - SRC-REPO-001
  runtime:
    - SRC-RUN-001
  documentation:
    - SRC-DOC-001
  assets: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

<!-- control:cli-managed:start -->
<!-- control:cli-managed:end -->
<!-- control:markdown-only:start -->
<!-- control:markdown-only:end -->

# Architecture

## 1. Document Information

- Status: Draft
- Version: 0.1
- Last updated: YYYY-MM-DD
- Owners:
- Scope:
- Source baseline: `SOURCE-BASELINE.md`
- Repository snapshot: `SRC-REPO-*`
- Runtime snapshots: `SRC-RUN-*` / None
- Related documents:
  - `REQUIREMENTS.md`
  - `DESIGN.md`
  - `SPEC.md`
  - `PLAN.md`

## 2. Purpose and Scope

Explain what part of the system is covered, which structural decisions are protected, and what remains outside scope.

## 3. Evidence and Sources

- Repository snapshot and paths inspected:
- Runtime snapshots:
- Documentation snapshots:
- Requirement IDs:
- Specification IDs:
- Stakeholder decisions:

Classify statements as confirmed, observed, inferred, recommended, or open. Current-state claims must reference pinned repository or runtime snapshots.

## 4. System Context

Identify users, actors, external systems, third-party services, major inputs and outputs, and trust boundaries.

```text
Actor → System boundary → External dependency
```

## 5. Architectural Goals

Document project-specific priorities and tradeoffs for maintainability, accessibility, testability, security, performance, reliability, simplicity, and other relevant qualities.

## 6. Current Architecture

Describe the applications, packages, runtime boundaries, important directories, dependency direction, constraints, and technical debt observed in `SRC-REPO-*` and applicable `SRC-RUN-*` snapshots.

Do not describe branch-head or deployed behavior absent from the referenced snapshots.

## 7. Target and Transitional Architecture

Describe proposed boundaries, responsibilities, migration path, compatibility requirements, and temporary structure. Keep current, target, and transitional architecture distinct.

## 8. High-Level Structure

Describe principal parts and communication paths.

```text
Interface → Application boundary → Data or external boundary
```

## 9. Components and Responsibilities

For each architecturally significant component or subsystem, record:

- responsibilities;
- responsibilities it must not absorb;
- dependencies;
- owned data or state;
- public interfaces;
- source evidence or decision references.

## 10. Dependency Rules

State allowed and prohibited dependency directions. Define only layers or abstractions the project needs.

## 11. Important Data and Interaction Flows

For each material flow, document initiator, validation, authorization, business-rule ownership, data access, side effects, success, and failure behavior.

## 12. State and Data Ownership

Document authoritative sources, persistent and transient state, client and server ownership, caching, synchronization, validation, consistency, concurrency, and sensitive-data boundaries.

## 13. Frontend Architecture

When applicable, cover routing, navigation, feature and shared-component organization, state, data access, design-system integration, rendering, error boundaries, and reusable accessibility behavior.

## 14. Backend, API, and Integration Architecture

When applicable, cover request handling, validation, business rules, services or use cases, API conventions, integration adapters, background work, compatibility, and error translation.

## 15. Persistence Architecture

When applicable, cover entities, relationships, ownership, transaction boundaries, migrations, retention, deletion, and model mapping.

## 16. Authentication and Authorization

When applicable, cover identity source, authentication flow, enforcement boundaries, session or token lifecycle, protected operations, logout, revocation, and tradeoffs.

## 17. Accessibility Architecture

Document semantic component boundaries, keyboard ownership, focus management, accessible naming and relationships, announcements, reduced motion, and testing responsibility.

Accessibility must be integrated into component and system boundaries rather than deferred.

## 18. Error Handling and Reliability

Document error categories, propagation, translation, recovery, retry, idempotency, fallback, logging, sanitization, and failure boundaries.

## 19. Security and Privacy

Document trust boundaries, input validation, authorization, secrets, sensitive data, logging restrictions, network controls, abuse protection, and privacy constraints supported by approved sources.

## 20. Build, Deployment, Runtime, and Observability

When applicable, document build outputs, environments, hosting, configuration, networking, deployment ordering, migrations, rollback, logs, metrics, traces, health checks, alerts, and prohibited recorded data.

Tie observed deployment claims to `SRC-RUN-*`.

## 21. Testing Architecture

Define responsibilities for unit, component, integration, contract, end-to-end, accessibility, visual, performance, and security validation as applicable.

## 22. Architectural Decisions

### ADR-001 — Decision title

- **Status:** Proposed / Accepted / Superseded
- **Context:**
- **Source snapshots:**
- **Decision:**
- **Rationale:**
- **Alternatives considered:**
- **Tradeoffs and consequences:**
- **Requirement and specification references:**

Use separate ADR files when independent history or review is useful.

## 23. Constraints, Risks, Assumptions, and Open Questions

| Item | Type | Impact | Evidence or snapshot | Mitigation or owner | Status |
|---|---|---|---|---|---|
| ... | Constraint / Risk / Assumption / Question | ... | ... | ... | ... |

## 24. Source-change Handling

- Snapshot verification required before implementation:
- Source changes that invalidate current architecture claims:
- Earliest workflow stage to revisit:

Create new snapshot IDs and perform a rebaseline impact assessment rather than silently updating current-state evidence.

## 25. Traceability

| Architecture item | Snapshot | Requirement or specification | Repository or runtime evidence | Validation |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 26. Architecture Validation

### Pass 1 — Completeness and correctness

- [ ] Scope and pinned current-state observations are accurate.
- [ ] Current, target, and transitional architecture are distinct.
- [ ] Responsibilities, dependencies, state, and flows are explicit.
- [ ] Accessibility, security, errors, deployment, and testing are addressed where relevant.

### Pass 2 — Consistency, traceability, source integrity, risks, and uncertainty

- [ ] Snapshot IDs exist and were actually used.
- [ ] No current-state claim silently relies on newer repository or runtime content.
- [ ] Decisions are traceable to requirements, specifications, and source evidence.
- [ ] Tradeoffs, risks, assumptions, and open questions are visible.
- [ ] No example technology or pattern was adopted without evidence.

<!-- artifact:end -->
