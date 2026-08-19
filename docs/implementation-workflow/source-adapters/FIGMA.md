# Figma Source Adapter

Use this guide when the design source is a Figma design, FigJam board, or Figma Slides file.

For file normalization before audit, use [`FIGMA-PREPARATION.md`](FIGMA-PREPARATION.md).

## Stage 0 capture

Create a `SRC-DS-*` record containing:

- file URL and file key;
- source type;
- named version or version URL when available;
- inspection timestamp with timezone;
- included and excluded pages, sections, frames, components, and node IDs;
- access mode: edit, view, dev mode, prototype only, export, or screenshot;
- local and external library dependencies;
- captured exports when practical;
- pin strength and limitations.

A normal Figma URL is mutable. Without a named version or checksum-backed export, classify it as Time-bound.

## Inspect the actual scope

Inspect applicable:

- pages and page purpose;
- sections, frames, screens, flows, and node IDs;
- desktop, tablet, mobile, and alternative compositions;
- local components, component sets, variants, properties, and instances;
- external-library components and access requirements;
- variables, modes, aliases, styles, and tokens;
- Auto Layout, constraints, resizing, min/max behavior, clipping, and overflow;
- prototype connections and interaction details;
- assets, export settings, masks, images, icons, and illustrations;
- layer order, reading order, hidden content, and alternative states;
- documentation pages and design-system guidance.

Do not rely only on Dev Mode generated values or code. Translate evidence into project intent and repository-aware implementation.

## Evidence references

Use the most precise stable reference available:

```text
SRC-DS-001 → Page “Product Screens” → Frame “About / Desktop” → node 41:22
```

Record node IDs for material evidence. Names alone may change or be duplicated.

## What Figma can support

Figma can directly demonstrate:

- composition and visual hierarchy;
- supplied viewport examples;
- visible component variants and states;
- styles, variables, and library relationships;
- prototype transitions and demonstrated interactions;
- content examples and asset intent.

It does not independently prove:

- semantic HTML;
- keyboard or screen-reader behavior;
- actual responsive behavior between supplied widths;
- backend, data, permission, security, privacy, or retention rules;
- final browser rendering or performance;
- that every implementation state is present.

## Component and design-system review

Check:

- repeated patterns not represented as components;
- detached instances;
- missing or inaccessible main components;
- duplicate components;
- unclear variant dimensions;
- overrides that indicate an insufficient component API;
- hard-coded values bypassing variables or styles;
- primitive versus semantic token responsibilities;
- incomplete modes;
- inconsistent typography or documentation.

Do not restructure published resources or detach instances merely to make the file cleaner.

## Responsive review

Record supplied frame widths and observed transformations, but do not treat frame widths as automatic implementation breakpoints.

Document:

- fixed versus fluid regions;
- wrapping, stacking, reordering, hiding, or replacement;
- content priority changes;
- intermediate-width gaps;
- unusually narrow and wide behavior;
- Auto Layout and constraints that suggest intent;
- contradictions between frames and component behavior.

## Interaction review

Inspect prototype connections, overlays, scroll behavior, transitions, smart animation, component interactions, and conditional states.

Identify the intended pattern before specifying keyboard or focus behavior. Figma may demonstrate opening and closing but still leave semantics and focus management unresolved.

## Accessibility observations

Record evidence and gaps for:

- reading and focus order;
- heading hierarchy implied by composition;
- focus-state designs;
- contrast;
- touch targets;
- zoom and reflow implications;
- alternative text needs;
- error and status communication;
- reduced motion.

A design can suggest accessibility intent but cannot establish implementation compliance.

## Completion checklist

- [ ] Snapshot scope and node references are explicit.
- [ ] Mutable-source limitations are recorded.
- [ ] Pages, frames, components, variants, tokens, prototypes, and assets were inspected as applicable.
- [ ] External-library dependencies are documented.
- [ ] Missing responsive, state, interaction, content, and accessibility evidence is visible.
- [ ] Observations are not confused with recommendations.
