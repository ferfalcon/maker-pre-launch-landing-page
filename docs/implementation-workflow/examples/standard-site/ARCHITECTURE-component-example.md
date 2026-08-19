# Component Architecture Example

> **Non-normative example:** This document demonstrates one possible architecture for a reusable FAQ accordion. Component names, state ownership, and interaction decisions are illustrative. Adopt them only when they match the design, specification, repository, and approved project decisions.

## 1. Purpose

This document describes the internal structure and behavioral boundaries of a reusable FAQ accordion component.

The component displays a collection of questions and answers and supports either one-item-open or multiple-items-open behavior according to its configuration.

## 2. Scope

Included:

- component anatomy;
- state ownership;
- accessibility behavior;
- responsive behavior;
- dependency rules;
- testing boundaries.

Excluded:

- FAQ content management;
- data fetching;
- persistence;
- page-level routing;
- analytics.

## 3. Component Structure

```text
FaqAccordion
└── FaqItem
    ├── FaqTrigger
    └── FaqPanel
```

### `FaqAccordion`

Responsible for:

- receiving FAQ content and configuration;
- owning the collection-level expansion state;
- enforcing one-item or multiple-item behavior;
- assigning stable item relationships;
- coordinating item callbacks.

Must not:

- fetch FAQ data;
- determine page layout;
- store duplicated item state in child components.

### `FaqItem`

Responsible for:

- rendering one question-and-answer pair;
- receiving whether it is expanded;
- forwarding activation to the parent;
- connecting the trigger and panel IDs.

### `FaqTrigger`

Responsible for:

- rendering a native `button`;
- exposing expansion state;
- providing the accessible name;
- receiving keyboard and pointer activation through native button behavior.

### `FaqPanel`

Responsible for:

- rendering the answer;
- exposing its relationship to the trigger;
- preventing hidden interactive descendants from receiving focus when collapsed.

## 4. State Ownership

`FaqAccordion` owns expansion state.

For one-item-open mode:

```text
expandedItemId: string | null
```

For multiple-items-open mode:

```text
expandedItemIds: Set<string>
```

Each `FaqItem` receives:

- `isExpanded`;
- `triggerId`;
- `panelId`;
- `onToggle`.

Children do not maintain independent expansion state. This prevents the visual state and accessibility attributes from diverging.

## 5. Data Boundary

The component receives content through props or an equivalent input boundary.

Conceptual data shape:

```text
FaqItemData
- id
- question
- answer
```

Rules:

- IDs must be stable within the rendered collection.
- The component does not modify the source content.
- Empty collections are handled by the parent or through an explicitly specified empty state.
- Rich answer content must use an approved rendering strategy.

## 6. Accessibility Architecture

Each trigger is a native `button`.

The trigger exposes:

- `aria-expanded` with the current state;
- `aria-controls` referencing the panel ID.

Each panel:

- has a stable `id`;
- references its trigger with `aria-labelledby` when the selected semantic pattern requires it;
- is hidden using a strategy that removes collapsed content from reading and keyboard order;
- preserves correct document order.

Keyboard behavior:

- `Enter` and `Space` activate the native button.
- `Tab` follows normal document order.
- Arrow-key navigation is not added unless the specification explicitly requires an accordion keyboard pattern beyond native disclosure behavior.
- Collapsing an item does not move focus when focus remains on its trigger.

Focus styles are visible and are not removed without an accessible replacement.

## 7. Dependency Rules

1. Presentation styles must not own or infer expansion state.
2. The component must not fetch or persist data.
3. Content data enters through the public component interface.
4. Keyboard behavior must remain independent from animation behavior.
5. Animation must not delay accessibility-state updates.
6. Page-specific business rules must stay outside the reusable component.
7. The component may depend on shared design tokens but not on a page-specific stylesheet.

## 8. Responsive Behavior

The accordion uses its container width and does not require viewport-specific JavaScript.

- Trigger content may wrap to multiple lines.
- Icons remain aligned without overlapping long text.
- The panel uses fluid width.
- Spacing may adapt through CSS tokens or container or viewport queries.
- No answer content is truncated solely to preserve a fixed component height.

## 9. Motion

Expansion animation is optional and must not control semantic visibility.

When motion is enabled:

- accessibility attributes update immediately;
- focusable descendants do not become available before the panel is considered open;
- reduced-motion preferences remove or substantially shorten non-essential transitions;
- content height changes do not rely on brittle fixed values.

## 10. Error and Edge Cases

The component must account for:

- long questions;
- long or structured answers;
- duplicate or missing IDs;
- one-item collections;
- initially expanded items;
- dynamic content updates;
- interactive content inside an answer;
- reduced motion;
- server-rendered hydration when applicable.

Invalid IDs should be rejected during development or normalized at the integration boundary according to project conventions.

## 11. Testing Boundaries

Component tests cover:

- pointer activation;
- `Enter` and `Space` activation;
- visible focus;
- expanded and collapsed accessibility states;
- trigger-panel relationships;
- one-item and multiple-item modes;
- initially expanded state;
- long content;
- interactive content inside panels;
- reduced-motion behavior where testable;
- state updates after content changes.

Visual validation covers:

- small and large containers;
- wrapped questions;
- open and closed states;
- focus and hover states;
- icon alignment.

## 12. Tradeoffs

- Parent-owned state makes behavior predictable but requires more prop coordination.
- Native buttons provide reliable keyboard semantics but may require style normalization.
- Removing collapsed panels from the accessibility tree is clear and predictable, but it may limit some animation techniques.
- Keeping data fetching outside the component improves reuse but requires integration code at the feature level.
