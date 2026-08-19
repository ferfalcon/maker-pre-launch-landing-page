# Stage 6 — Define or Explicitly Skip Architecture

Decide whether meaningful architecture reasoning is required based on actual scope/repository risk.

## Profile targets

- Express/Lite: record the decision rationale in the consolidated artifact; if architecture is Required, do not continue—record the CLI decision and upgrade profile.
- Standard: use `ARCHITECTURE.md` only when architecture is Required.
- Full: update `ARCHITECTURE.md`.

Routing/shared state/data/API/integration/persistence/auth/build/deployment/security/privacy/reliability/observability/migration concerns normally require architecture reasoning. Record `architecture decide required|not-required` through the CLI.

Review the decision twice, then run stage preflight. Express/Lite with Required architecture should produce `Must upgrade`, not a passing gate.
