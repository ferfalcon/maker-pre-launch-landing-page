# Existing Website Source Adapter

Use this guide when an existing live or local website is a design reference, current implementation baseline, migration source, or behavior reference.

## Stage 0 capture

Create appropriate records:

- `SRC-DS-*` when the site is used as visual or interaction design evidence;
- `SRC-RUN-*` when current deployed behavior is being inspected;
- `SRC-REPO-*` when the corresponding implementation repository is available.

Record:

- exact URLs and routes;
- capture timestamp with timezone;
- environment: production, staging, preview, or local;
- browser, operating system, viewport, zoom, and device context;
- authentication, role, personalization, locale, theme, feature flags, and consent state;
- test data and dynamic-content conditions;
- deployment or release ID and associated commit when known;
- screenshots, recordings, or archives when practical;
- known caching, network, geolocation, and access limitations.

A stable URL does not create an immutable snapshot. Live-site evidence is normally Time-bound.

## Separate current behavior from target behavior

An existing website may contain defects, technical debt, experiments, stale content, or behavior that conflicts with the approved design.

Distinguish:

- current observable runtime behavior;
- current repository behavior;
- approved target behavior;
- behavior preserved for compatibility;
- behavior intentionally replaced.

Do not copy current behavior merely because it exists.

## Inspection method

Inspect applicable:

- route and navigation structure;
- page hierarchy and landmarks;
- responsive behavior across a width range;
- keyboard operation and focus order;
- loading, empty, error, success, disabled, and partial states;
- forms, validation, authentication, and permissions;
- motion, scrolling, overlays, menus, and modals;
- network failures, slow responses, and recovery;
- metadata, SEO, analytics, and consent behavior;
- browser console and accessibility-tree evidence when available.

Capture reproducible steps for important flows.

## Dynamic and personalized content

Record values that can alter the experience:

- account or permission level;
- data population and ordering;
- locale and timezone;
- experiments and feature flags;
- cookies, consent, or session state;
- viewport and input method;
- server or client rendering differences.

Do not generalize one personalized observation to every user.

## Responsive review

Test supplied or known breakpoints plus intermediate and extreme widths. Record the actual failure condition and transformation, not only the CSS media-query value.

Check zoom, text resizing, long content, missing images, orientation changes, and horizontal overflow.

## Accessibility review

A live site permits stronger implementation evidence than a static design. Review semantics, landmarks, headings, keyboard interaction, focus, accessible names and relationships, announcements, contrast, reflow, reduced motion, and screen-reader behavior as required.

Do not claim accessibility compliance from automated tools alone.

## Completion checklist

- [ ] Environment and capture conditions are reproducible.
- [ ] Current behavior is distinguished from approved target behavior.
- [ ] Dynamic state, permissions, feature flags, and test data are recorded.
- [ ] Responsive, keyboard, focus, state, and failure behavior were inspected as applicable.
- [ ] Runtime evidence is tied to deployment and repository snapshots when possible.
