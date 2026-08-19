# Source Authority

Source authority defines which artifact or consolidated ownership section owns each kind of decision and how to handle disagreement between design, documentation, repository state, runtime behavior, and stakeholder direction.

Authority is contextual. A source may be authoritative for one question and insufficient for another.

## Authority hierarchy

Use this precedence when sources conflict, subject to the ownership rules below:

1. explicit current user or stakeholder decision;
2. applicable legal, contractual, regulatory, or policy requirement;
3. approved product requirements and business documentation;
4. approved design intent for visual, responsive, content, and demonstrated interaction decisions;
5. approved technical specification and architecture decisions;
6. repository evidence for the current implementation and technical constraints;
7. runtime evidence for current deployed behavior;
8. inference;
9. recommendation.

A higher position does not permit one source to decide outside its responsibility. For example, a visual composition cannot establish a data-retention policy.

## Decision ownership

| Decision type | Primary owner | Express owner | Supporting evidence |
|---|---|---|---|
| Project goal, scope, users, business rule, product quality | `REQUIREMENTS.md` | Workpack Requirements section | stakeholder documentation, design evidence |
| Visual hierarchy, layout intent, responsive transformation, interaction intent | `DESIGN.md` | Workpack Design intent section | pinned design source, requirements |
| Precise behavior, states, validation, accessibility behavior | `SPEC.md` | Workpack Specification section | requirements, design intent |
| System boundaries, responsibilities, dependency rules, data ownership | `ARCHITECTURE.md` | Not permitted; upgrade profile | repository, specification, constraints |
| File impact, implementation order, dependencies, validation approach | `PLAN.md` | Workpack implementation approach | repository, upstream responsibilities |
| Task scope, task-start state, and output lineage | Task file | Workpack single implementation unit and implementation record | plan, repository snapshots |
| Final acceptance and implementation findings | `IMPLEMENTATION-REVIEW.md` | Workpack final implementation review | exact inputs, output commit, validation evidence |
| Current code, dependencies, scripts, configuration | pinned repository snapshot | pinned repository snapshot | repository files and commit |
| Current deployed behavior | pinned runtime snapshot | pinned runtime snapshot | deployment and capture evidence |
| Source identity and revision | `SOURCE-BASELINE.md` | Workpack Source baseline section | immutable revision or time-bound evidence |
| Current operational stage and next action | `WORKFLOW-STATE.md` | Workpack Control state section | approved responsibilities and blockers |

Express consolidation changes file placement, not decision authority. A workpack section may not decide outside the responsibility represented by that section.

## Current versus target truth

Always distinguish:

- **Current repository behavior:** what the pinned code currently does.
- **Current runtime behavior:** what the pinned deployment currently does.
- **Approved target behavior:** what requirements and specifications require.
- **Reference design behavior:** what a named design snapshot demonstrates.
- **Transitional behavior:** temporary behavior approved during migration.

The current implementation may contain defects. It is evidence of present state, not automatic authority for target behavior.

The design may be aspirational or incomplete. It is evidence of visual and demonstrated interaction intent, not automatic authority for business rules, security, persistence, or complete accessibility behavior.

## Conflict protocol

When sources disagree:

1. identify the exact conflicting claims;
2. identify each source and snapshot ID;
3. classify the decision type;
4. identify the owning artifact, consolidated section, or human decision owner;
5. determine whether one source is outdated, incomplete, or outside its authority;
6. correct the owning area when evidence supports a resolution;
7. propagate affected references;
8. preserve superseded decisions when history matters;
9. record unresolved conflicts as blocking or non-blocking questions;
10. do not silently choose the most convenient interpretation.

Use a table such as:

| Conflict | Sources | Decision type | Owner | Impact | Resolution | Status |
|---|---|---|---|---|---|---|
| ... | `SRC-DS-*`, `SRC-DOC-*`, `SRC-REPO-*` | ... | ... | ... | ... | Open / Resolved / Blocked |

For Express, a material unresolved conflict that changes expected behavior is a profile-upgrade or blocking trigger. Do not hide it inside an implementation recommendation.

## Source limitations

### Design source

Can usually support:

- visual hierarchy and layout;
- supplied responsive examples;
- component appearance and visible states;
- content examples;
- prototype connections and demonstrated interactions.

Usually cannot independently confirm:

- business rules and permissions;
- backend behavior;
- data retention and privacy policy;
- security requirements;
- complete browser or performance targets;
- complete keyboard and screen-reader behavior.

### Repository

Can support:

- current framework, dependencies, scripts, and structure;
- current components, modules, APIs, tests, and conventions;
- technical constraints and existing behavior at a pinned commit.

Cannot independently determine:

- whether current behavior is correct;
- whether technical debt should be preserved;
- product priority or future scope.

### Runtime

Can support current observable deployed behavior under recorded conditions. It may differ from the repository because of deployment lag, configuration, feature flags, data, caching, or environment-specific behavior.

### Documentation

Its authority depends on status, owner, revision, scope, and whether it is normative, informative, historical, approved, or superseded.

## Uncertainty labels

Use consistently:

- **Confirmed:** established by an authoritative source or approved decision.
- **Observed:** directly visible in a pinned source.
- **Inferred:** strongly suggested but not confirmed.
- **Recommended:** proposed to resolve a gap or risk.
- **Open question:** cannot be resolved safely with current evidence.

Never promote an inference or recommendation to Confirmed without new authority.

## Review checklist

- [ ] Every material decision is in its owning artifact or consolidated section.
- [ ] Current and target behavior are distinguished.
- [ ] Repository and runtime evidence use pinned snapshots.
- [ ] Design evidence is not used to invent product, security, or backend rules.
- [ ] Conflicts identify source, owner, impact, and status.
- [ ] Superseded sources and decisions remain traceable.
- [ ] Unresolved decisions are visible in the active control record.
- [ ] Express work has no hidden architecture or material unresolved product decision.
