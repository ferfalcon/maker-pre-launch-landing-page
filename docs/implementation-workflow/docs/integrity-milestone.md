# Immutable subject integrity

The workflow treats evidence as trustworthy only when the subject that was reviewed or validated has an immutable identity.

The integrity chain is:

`source snapshot -> approved artifact revision -> stage gate -> task baseline -> validation subject -> implementation output -> final-review artifact revision`

## Subject identities

- Toolkit execution is pinned to an `owner/name` repository plus an exact 40-character Git revision. A source checkout may discover Git identity only when the toolkit directory is itself the Git worktree root. Package creation stamps that identity into `cli/toolkit-provenance.json` inside the tarball and removes the transient stamp from the source checkout afterward; an installed package trusts that embedded identity instead of walking upward into the consumer repository.
- An Approved narrative artifact records a SHA-256 digest in `approvedRevision`. Editing the narrative afterward makes the approval stale until the artifact is reopened, reviewed, and approved again.
- Passing gates pin the approved revisions they relied on through `artifactRevisions`. A gate preserves the revisions authoritative at its decision point; later artifact approvals do not retroactively rewrite or invalidate historical gates. The active gate for the current stage must match the revisions authoritative now.
- Executed task validation records a `subject.commit` and, when present, a validation-runtime snapshot. Stage 9 may define checks but may not record executed Passed/Failed results.
- A completed task requires every Passed check to target the exact Implementation output commit.
- Accepted final implementation review pins the approved revision of its review artifact.

## Diagnostics and repair

`design-workflow validate`, `status`, `context`, and stage preflight include subject-integrity findings. Missing narrative files, stale Approved content, invalid or unpinned toolkit identity, stale validation subjects, and stale final-review evidence make the workflow non-executable.

A mutation may proceed from invalid state only when it is a strict repair: the candidate must reduce the existing finding set and introduce no new finding. This keeps recovery commands such as `artifact reopen` and `toolkit pin` usable without allowing unrelated workflow progress through broken evidence.

## Compatibility and migration

Schema-v2 keeps the new identity fields optional at the structural JSON-schema layer so older records remain readable. Runtime integrity diagnostics enforce the fields only when their lifecycle state makes them authoritative, such as Approved artifacts or executed validation.

Schema-v1 migration distinguishes current execution identity from historical evidence:

- the toolkit executing the migration may be pinned when its immutable source identity can be resolved safely, because that is the dependency used from the migration point forward;
- legacy `Approved` artifacts are migrated as `Reviewed`, because schema v1 cannot prove which exact bytes were approved; they require an explicit v2 approval before a later gate can rely on them;
- legacy Passed validation remains downgraded to `Not executed` until it is rerun against an exact implementation commit;
- historical artifact approvals or validation subjects are never reconstructed from current file contents or current repository HEAD.

If the executing toolkit or an active narrative cannot be identified safely, migration may still preserve the record while diagnostics keep execution blocked until the remaining integrity findings are repaired.
