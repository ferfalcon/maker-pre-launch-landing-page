# Mixed Sources Adapter

Use this guide when implementation depends on more than one design or product source, such as Figma plus a live site, screenshots plus requirements, or a PDF plus an existing repository.

## Create separate snapshot records

Do not combine materially different sources into one vague baseline.

Create separate records for:

- each independently versioned design source;
- repository state;
- runtime deployments;
- normative documentation;
- assets that require independent pinning.

One source may require more than one role. For example, a live website can be both `SRC-DS-*` visual evidence and `SRC-RUN-*` current-behavior evidence when those responsibilities are recorded clearly.

## Build a source map

Record:

| Source | Snapshot | Authority | Scope | Overlaps | Limitations |
|---|---|---|---|---|---|
| ... | `SRC-*` | Design / Product / Current implementation / Technical / Other | ... | ... | ... |

Then map important regions or decisions:

| Area or decision | Primary source | Supporting source | Conflict status |
|---|---|---|---|
| Header visual design | `SRC-DS-001` | `SRC-RUN-001` | Resolved / Open |

Apply [`../workflow/Source-Authority.md`](../workflow/Source-Authority.md).

## Typical mixed-source patterns

### Figma plus existing website

Use Figma for approved visual and demonstrated interaction intent. Use the website for current behavior, integration constraints, edge cases, and regression evidence. Do not assume either source completely replaces the other.

### Screenshots plus requirements

Use screenshots for visible composition and content examples. Use requirements for product outcomes and rules. Carry hidden states, responsive transformations, semantics, and interaction behavior as open until supported.

### PDF plus Figma

Determine whether the PDF is normative documentation, an older design export, or supporting presentation material. Record revision and conflict status.

### Multiple Figma files

Record a separate snapshot per file or independently versioned library. Identify which file owns foundations, components, screens, prototypes, and documentation.

### Design source plus design system

Treat the product design and design-system library as related but separate sources. Record token and component mappings, version compatibility, and deviations.

## Conflict handling

When sources disagree:

1. identify the exact region or decision;
2. name every snapshot involved;
3. classify each source's authority for that decision;
4. identify whether the difference is a defect, stale source, intentional variation, or unresolved decision;
5. correct the owning artifact or record an open question;
6. do not merge incompatible evidence into an invented compromise.

## Scope control

A source being available does not make all of it in scope. Record included and excluded pages, nodes, routes, files, document sections, and asset sets for each snapshot.

## Completion checklist

- [ ] Every material source has its own snapshot record.
- [ ] Authority and scope are explicit.
- [ ] Overlapping sources are mapped.
- [ ] Conflicts identify owner, impact, and status.
- [ ] No source silently overrides another outside its authority.
- [ ] Downstream artifacts reference only the snapshots they actually use.
