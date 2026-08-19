# PDF Source Adapter

Use this guide when the design source is a PDF containing interface designs, specifications, wireframes, brand guidance, or mixed visual and textual evidence.

## Stage 0 capture

Create a `SRC-DS-*` or `SRC-DOC-*` record according to the PDF's authority and purpose.

Record:

- file name, size, page count, and PDF version when available;
- SHA-256 checksum when tooling permits;
- acquisition or upload date;
- included and excluded page ranges;
- whether pages represent designs, documentation, or both;
- embedded fonts, images, comments, layers, or forms when relevant;
- access restrictions and extraction limitations.

Use separate snapshot records when one PDF has materially different authority roles that must be tracked independently.

## Inspection method

Inspect the rendered pages, not only extracted text.

For each relevant page:

- record page number and region;
- identify page dimensions and orientation;
- inspect visual hierarchy, layout, imagery, diagrams, tables, and annotations;
- distinguish actual interface compositions from explanatory documentation;
- record cross-page flows and responsive alternatives;
- identify revisions, watermarks, status labels, and approval indicators;
- note missing pages, broken assets, or export artifacts.

## PDF limitations

A PDF may flatten:

- components and variants;
- layers and source semantics;
- responsive constraints;
- prototype interactions;
- animation;
- design tokens;
- accessibility metadata.

Do not infer these properties from a flattened export unless supporting documentation confirms them.

Page dimensions are not automatically browser viewport dimensions. Margins, print scaling, and export settings may alter the composition.

## Mixed design and specification content

When a PDF contains both design visuals and normative text:

- classify each section by authority;
- use `SRC-DS-*` for visual design evidence;
- use `SRC-DOC-*` for normative requirements or technical guidance;
- record conflicts between visual and textual sections;
- do not let a decorative example override explicit approved requirements.

## Accessibility observations

Inspect visible contrast, hierarchy, focus treatments, touch-target implications, error messaging, reflow risk, and alternative-text requirements.

A PDF export does not prove web semantics or keyboard behavior. Tagged-PDF accessibility is separate from the accessibility of the intended web implementation.

## Completion checklist

- [ ] File checksum and page scope are recorded when possible.
- [ ] Rendered pages and visual regions were inspected.
- [ ] Design and documentation authority are distinguished.
- [ ] Page size is not treated automatically as viewport size.
- [ ] Flattened-source limitations are explicit.
- [ ] Missing interaction, responsive, component, token, and accessibility evidence remains visible.
