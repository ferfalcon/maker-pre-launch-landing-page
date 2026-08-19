# Screenshot and Image Source Adapter

Use this guide when the design source consists of screenshots, mockups, exported images, or photographs of an interface.

## Stage 0 capture

Create a `SRC-DS-*` record for each materially different file or coherent image set.

Record:

- file name, type, dimensions, and size when available;
- SHA-256 checksum when tooling permits;
- acquisition or upload date;
- storage or attachment reference;
- included and excluded image regions;
- known cropping, scaling, compression, annotation, or editing;
- intended viewport or device when known;
- source provenance and limitations.

A checksum pins the supplied image, not the original design from which it may have been exported.

## What screenshots demonstrate

Screenshots can support observations about:

- visible layout and hierarchy;
- typography appearance;
- color and spacing relationships;
- visible content and assets;
- one captured viewport and state;
- visible browser or operating-system chrome when present.

They do not independently prove:

- source dimensions or tokens;
- component reuse;
- hidden or interactive states;
- keyboard, focus, or screen-reader behavior;
- responsive transformations;
- motion and timing;
- semantic structure;
- data, backend, or product rules.

## Audit method

For each image:

1. record pixel dimensions and likely viewport assumptions;
2. divide the interface into semantic regions;
3. identify repeated patterns and possible components without presenting them as confirmed source components;
4. record visible text, imagery, icons, and state;
5. identify clipping, overflow, and content-length clues;
6. compare multiple images for transformations, not only visual differences;
7. record what cannot be inferred safely.

## Scale and measurement

Do not assume one image pixel equals one CSS pixel. Device pixel ratio, resizing, export scale, browser zoom, and post-processing can change measurements.

Use measurements as relative evidence unless capture conditions are confirmed.

Prefer statements such as:

> The content column occupies approximately two thirds of the captured viewport.

Avoid unsupported precision such as:

> The production container must be exactly 1184px wide.

## Multiple screenshots

When screenshots show several widths or states:

- identify whether content and state are equivalent;
- compare hierarchy, order, visibility, density, and interaction affordances;
- distinguish responsive transformation from a different page or variant;
- record gaps between captured widths;
- do not invent transitions or breakpoints.

## Accessibility observations

Review visible evidence for contrast, focus states, touch-target implications, reading order, text density, error communication, and reflow risk.

Screenshot evidence cannot establish semantic or keyboard accessibility.

## Completion checklist

- [ ] File identity and checksum are recorded when possible.
- [ ] Image transformations and capture limitations are explicit.
- [ ] Measurements are not overstated.
- [ ] Visible state and viewport conditions are identified.
- [ ] Missing interactions, responsive behavior, semantics, and accessibility evidence remain open.
