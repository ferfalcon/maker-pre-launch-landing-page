# Figma File Preparation and Normalization

This file is the single normative procedure for Figma file preparation and normalization. [`../AGENTS-PROMPT-Figma-file-preparation.md`](../AGENTS-PROMPT-Figma-file-preparation.md) is only a thin execution launcher and must delegate here rather than restating these steps.

Use this phase before the formal Figma developer-handoff audit. For source capture and audit rules, also use [`FIGMA.md`](FIGMA.md).

Its purpose is to make the selected Figma page, section, frame, or node structurally understandable and safe to inspect without disguising unresolved design, responsive, accessibility, content, or implementation problems.

Preparation and audit are separate activities:

- **Preparation** improves organization, naming, component integrity, design-system semantics, and documentation.
- **Audit** evaluates whether the design provides enough reliable evidence for implementation.

A cleanly named file is not automatically ready for developer handoff.

## Operating constraints

During preparation:

- Preserve the existing visual design, layout, interaction behavior, and product content.
- Do not invent missing product, responsive, accessibility, or interaction decisions.
- Do not detach instances, recreate components, or reorganize published resources without evidence that the change is safe.
- Treat prototype connections, component properties, instance overrides, variable aliases, export settings, reading order, and responsive behavior as potentially fragile.
- Record meaningful changes and unresolved risks so normalization does not erase evidence needed by the formal audit.
- Limit changes to the specified scope unless a dependency outside that scope must be inspected to verify component, style, variable, or documentation integrity.

## 1. Capture the baseline

Inspect the requested scope before changing it and record the most important existing problems.

Capture evidence of:

- Generic, visual, positional, or inconsistent layer names.
- Unclear page, section, screen, or component organization.
- Excessive nesting or ambiguous hierarchy.
- Empty layers and apparently unnecessary groups, frames, or wrappers.
- Repeated structures that are not components.
- Detached instances, missing main components, and duplicate components.
- Components stored in product screens, archives, experiments, or unrelated pages.
- Inconsistent component properties and variant names.
- Duplicate or inconsistently applied styles and variables.
- Hard-coded values that bypass the design system.
- Typography styles whose names, properties, usage, or documentation disagree.
- Outdated, incomplete, or misleading documentation.

Preserve a concise change log throughout the preparation work.

## 2. Rename layers semantically

Rename relevant pages, sections, frames, groups, text layers, images, icons, components, component sets, variants, and important nested layers according to responsibility and meaning.

Names should describe what an element represents in the interface rather than its appearance, position, Figma object type, or creation order.

Prefer names such as:

- `Article card`
- `Article card / Content`
- `Article card / Title`
- `Navigation / Primary`
- `Button / Label`
- `Icon / Arrow right`

Avoid names such as:

- `Frame 42`
- `Group 7`
- `Rectangle`
- `Text`
- `Left`
- `Blue box`
- `Component 3`

Keep names systematic and concise. Do not repeat unnecessary parent context in every descendant or create names so long that the layer panel becomes difficult to scan.

## 3. Review page and component architecture

Review the architecture of pages, sections, product screens, resource areas, components, component sets, frames, groups, and nested layers.

Determine whether the file clearly separates:

- Product screens.
- Design-system foundations.
- Components and patterns.
- Assets and resources.
- Documentation.
- Explorations or work in progress.
- Deprecated or archived content.

Review each relevant screen and component hierarchy for unnecessary structure, including:

- Groups that provide no meaningful organization.
- Frames that do not control layout, clipping, constraints, sizing, visual properties, prototyping, or export behavior.
- Nested frames that duplicate the responsibility of a parent.
- Empty frames, groups, sections, or layers.
- Single-child wrappers with no meaningful responsibility.
- Decorative rectangles that could safely be represented by a parent frame's fill, border, or effect.
- Sections that do not provide useful file organization.
- Duplicate resource or documentation pages.
- Excessive nesting that obscures reading order or implementation structure.

Simplify the hierarchy only when the change is safe.

Before removing or merging a layer, verify its effect on:

- Visual appearance.
- Auto Layout.
- Hug, fill, fixed, minimum, and maximum sizing.
- Constraints and responsive resizing.
- Clipping and masks.
- Layer order and reading order.
- Component inheritance and exposed properties.
- Instance overrides.
- Prototype connections and interactions.
- Export settings.

Do not remove a group, frame, or wrapper solely because it appears redundant.

Record structural elements that were reviewed and intentionally retained, especially when their purpose is not visually obvious.

## 4. Review components, component sets, and variants

Review repeated interface patterns and determine whether their component architecture is understandable, reusable, and proportionate to the product.

Check:

- Component boundaries and responsibilities.
- Main components and component sets.
- Nested component use.
- Exposed text, boolean, instance-swap, and variant properties.
- Variant property names and values.
- Instance overrides.
- Detached instances.
- Duplicate or visually equivalent components.
- Components that combine unrelated responsibilities.
- Components that are fragmented into pieces too small to be useful.
- Repeated structures that remain disconnected.
- Components with very limited use that add more complexity than value.

Name properties and values semantically. For example:

- `Variant: Primary | Secondary | Ghost`
- `Size: Small | Medium | Large`
- `State: Default | Hover | Focus | Disabled`
- `Icon: None | Leading | Trailing`

Do not combine unrelated dimensions into one value when they can be modeled independently.

Avoid names that encode arbitrary visual values or implementation details unless those values represent an intentional design-system distinction.

Do not detach instances or significantly restructure component architecture merely to make the file look cleaner. Record potentially disruptive changes before applying them.

## 5. Verify every instance has an accessible source component

Review every component instance in the specified scope and verify that it remains linked to an identifiable main component.

For each instance, confirm that:

- The source component exists.
- The instance is not detached.
- The source component is not hidden inside an unrelated product screen.
- The source component is stored in the intended resource page or library.
- The source can be located and understood without searching through unrelated pages.
- Its name matches the instance's semantic responsibility.
- It is not an obsolete duplicate of another source component.
- It is not linked unintentionally to an experimental, archived, or deprecated component.

Unless the file establishes another explicit convention, keep local main components used by the audited screens in one designated resource page, such as:

- `Components`
- `UI Library`
- `Design System`
- `Resources`

Do not create competing resource pages without a clear architectural reason.

When an instance does not have an appropriate source in the designated resource page:

1. Locate the original main component, when it exists.
2. Determine whether it should be moved, reorganized, replaced, or safely recreated.
3. Preserve existing instance relationships whenever possible.
4. Avoid detaching and manually rebuilding instances.
5. Check whether moving the source could affect documentation, variants, prototypes, publishing, or consumers in other files.
6. Record unresolved dependencies separately.

Distinguish between:

- Local instances linked to local main components.
- Instances linked to a published external library.
- Detached instances.
- Missing or inaccessible main components.
- Instances linked to deprecated components.
- Visually similar instances linked to duplicate main components.

Do not duplicate an external-library component locally merely to satisfy the same-page convention. Document the library source and verify that the implementation team is expected to have access to it.

## 6. Rename styles and variables semantically

Review text, color, effect, and grid styles together with variable collections, variables, modes, and aliases.

Rename them according to design-system purpose rather than raw visual value.

Prefer names such as:

- `Color / Background / Page`
- `Color / Background / Surface`
- `Color / Text / Primary`
- `Color / Text / Secondary`
- `Color / Border / Focus`
- `Color / Feedback / Error`
- `Space / 200`
- `Radius / Medium`

When appropriate, preserve a distinction between primitive and semantic tokens:

```text
Primitive / Blue / 500
Primitive / Neutral / 900

Semantic / Background / Brand
Semantic / Text / Primary
```

Identify:

- Duplicate styles or variables.
- Hard-coded values.
- Unclear or broken aliases.
- Inconsistent variable usage.
- Unused or obsolete resources.
- Semantic tokens connected directly to arbitrary values without a clear token model.
- Modes with incomplete coverage.
- Styles and variables that express the same concept inconsistently.

Do not rename or reorganize published resources without recording potential downstream impact on connected files and consumers.

## 7. Normalize typography

Rename text styles according to semantic role and hierarchy.

A suitable structure may include:

- `Typography / Display / Large`
- `Typography / Heading / H1`
- `Typography / Heading / H2`
- `Typography / Heading / H3`
- `Typography / Body / Large`
- `Typography / Body / Medium`
- `Typography / Body / Small`
- `Typography / Label / Medium`
- `Typography / Caption`

Review font family, weight, size, line height, letter spacing, text case, intended use, hierarchy, responsive behavior, and consistency.

Update text layers to use intended styles and consolidate accidental duplicates when safe.

Avoid names based only on visual properties, such as `Inter 16 Medium`, `Text 24 Bold`, `Big Heading`, or `Desktop H2`.

Use device-specific names only when desktop and mobile styles represent intentionally different design-system roles rather than different implementations of the same semantic role.

## 8. Update Typography documentation

Find the Typography documentation and update it so it accurately represents the normalized system.

Include:

- current semantic style names;
- font families, weights, sizes, line heights, and letter spacing;
- intended usage and hierarchy;
- responsive differences;
- accessibility guidance;
- intentional exceptions;
- deprecated or replaced styles.

Documentation examples should use the styles they describe whenever practical.

Each documented role should explain what it is called, where it should and should not be used, its properties, responsive changes, and likely semantic HTML relationship when relevant.

Remove or clearly mark documentation for styles that no longer exist.

## 9. Perform the first verification review

After preparation, review the entire specified scope for completeness and consistency.

Confirm that:

- all relevant pages, sections, screens, and resource areas were inspected;
- relevant layers, components, sets, variants, and properties use semantic names;
- generic names do not remain unintentionally;
- page and component architecture is understandable;
- unnecessary structure was removed where safe;
- retained structural layers have clear responsibility;
- repeated patterns were reviewed for componentization;
- component boundaries, variants, and properties are coherent;
- every local instance is connected to an identifiable main component;
- external-library dependencies are documented;
- detached, missing, duplicated, deprecated, or inaccessible relationships are recorded;
- styles and variables use consistent semantic naming;
- typography styles and documentation match;
- deprecated resources are identified;
- the change log is complete.

Search specifically for omissions rather than reviewing only changed elements.

## 10. Perform the second verification review

Perform a separate safety and regression review focused on unintended consequences and inaccurate documentation.

Confirm preparation did not unintentionally change:

- visual appearance;
- layout, spacing, or alignment;
- Auto Layout behavior;
- sizing and constraints;
- clipping, masks, or layer order;
- component inheritance;
- variant behavior or exposed properties;
- instance overrides;
- prototype connections or interaction behavior;
- export settings;
- visibility or reading order;
- product content.

Also verify that:

- no required structural layer was removed only because it appeared redundant;
- no component was recreated when its source could be preserved;
- no instance was detached unnecessarily;
- no local component was duplicated only to satisfy organization;
- no external-library component was copied locally without need;
- no published resource was renamed without recording downstream impact;
- no documentation claims behavior absent from the design;
- no unresolved problem was hidden by normalization.

Correct issues discovered during either review. Repeat relevant checks after material corrections.

Do not proceed while known preparation inconsistencies remain unresolved unless correction is unsafe, depends on unavailable resources, requires a product or design decision, or could cause significant downstream changes. Record those exceptions as risks.

## 11. Assess developer-handoff readiness

Evaluate:

- file and page organization;
- page and component architecture;
- hierarchy depth and structural clarity;
- semantic naming;
- component source organization and instance integrity;
- variants and properties;
- styles, variables, typography, and documentation;
- responsive behavior and interaction states;
- accessibility and content edge cases;
- asset readiness;
- implementation ambiguity.

Classify the file:

- **Ready:** implementation can begin with only minor clarification.
- **Mostly ready:** implementation can begin, but documented gaps remain.
- **Partially ready:** major responsive, state, accessibility, component, or specification gaps remain.
- **Not ready:** developers would need to reconstruct significant design decisions.

Do not classify a file as ready solely because it is clean or consistently named.

## 12. Report the result

Report:

1. preparation summary and baseline problems;
2. naming conventions;
3. page and component architecture changes;
4. removed and intentionally retained structure;
5. consolidated components, variants, styles, or variables;
6. instance-to-component integrity and external dependencies;
7. Typography documentation changes;
8. findings and corrections from both reviews;
9. remaining inconsistencies, limitations, risks, and unverified areas;
10. readiness rating and evidence;
11. prioritized issues for the formal audit;
12. concise change log of renamed, moved, consolidated, recreated, retained, or removed resources.
