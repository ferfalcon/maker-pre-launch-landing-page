# GitHub Remote Execution

This document defines the GitHub-native execution bridge for agents that can read and mutate a repository through GitHub but cannot run `design-workflow` locally. The bridge is a transport for the canonical CLI, not a second workflow engine.

## Boundary

The canonical `design-workflow` CLI still owns executable workflow state and transition legality. GitHub Issues carry authenticated command requests, and GitHub Actions provides the temporary execution environment in which the pinned CLI runs against the requested project branch.

The bridge must never edit `.workflow/workflow-record.json` or `.workflow/generated/*` directly. It executes the same CLI commands used locally, then validates the resulting record and generated projections before any mutation is committed.

Use the local CLI when it is available. Use this bridge only when GitHub is the available execution environment.

The portable `AGENT-CONTEXT.json` projection can report direct CLI capability as unavailable because it cannot discover optional repository-installed execution transports. An installed bridge does not rewrite that projection capability field; it provides an external transport for the same named canonical CLI executor. The agent must discover only the known caller workflow path described below and then continue to obey projection state, authority, and gate policy.

## One-time repository installation

Copy [`../templates/github/design-workflow-command.yml.template`](../templates/github/design-workflow-command.yml.template) into the implementation repository as:

```text
.github/workflows/design-workflow-command.yml
```

Replace `<REMOTE_EXECUTOR_REVISION>` with an exact 40-character commit SHA that contains the remote executor. Do not replace it with `main`, another branch, or a floating tag. This pins the transport itself. For an initialized project, the executor separately resolves and runs the workflow toolkit revision recorded in `.workflow/workflow-record.json`; for a new `init`, the executor revision is also the initial toolkit runtime/pin.

The caller workflow must be present on the implementation repository's **default branch** before issue commands can run. GitHub resolves the `issues` event from workflow files on the default branch, so installing the caller only on a feature branch is insufficient.

The caller grants only the permissions required by the executor:

- `contents: write` to commit canonical CLI output to the target branch;
- `issues: write` to report the result and close the command issue.

Repository/organization Actions policy must permit the pinned public reusable workflow. Protected target branches must also permit the workflow token to push; otherwise the command fails closed and no force push is attempted.

Install this caller before initializing the design workflow when possible. Adding the caller later is a real repository commit and may affect implementation lineage if it is introduced after planning baselines are already approved.

## Command issue protocol

Create one GitHub Issue with the exact title:

```text
[design-workflow] command
```

The body must contain exactly one fenced JSON command envelope:

````markdown
```design-workflow-command
{
  "protocolVersion": 1,
  "targetRef": "feature/example",
  "expectedHead": "0123456789abcdef0123456789abcdef01234567",
  "args": ["stage", "advance"]
}
```
````

Fields:

- `protocolVersion` must be `1`;
- `targetRef` is the existing target branch to operate on;
- `expectedHead` is the exact 40-character Git SHA observed for that branch immediately before submitting the request;
- `args` is the argument vector passed to the canonical `design-workflow` CLI, excluding the executable name.

Never put credentials, access tokens, private keys, or other secrets in the issue body or command evidence. Issue visibility follows repository visibility.

Each command issue is single-use. The executor posts a result and closes it. If the target branch moved or another condition changed, inspect the new state and create a new issue with a fresh `expectedHead`; do not reopen and reuse a stale request.

## Agent procedure

When local CLI execution is unavailable:

1. Read `.workflow/generated/AGENT-CONTEXT.json` when it exists.
2. Verify `generated.recordGitBlobSha` against GitHub's current `.workflow/workflow-record.json` blob `sha` at the same ref before trusting the projection.
3. Load only the exact pinned workflow resources it identifies and perform the design/repository/narrative work required by the current stage or task.
4. Verify `.github/workflows/design-workflow-command.yml` exists on the repository default branch before treating remote execution as available.
5. If runtime preflight is required, submit a remote `stage check --json` request and use the reported CLI output before deciding the gate result.
6. When a CLI-owned transition is permitted, read the current target branch HEAD from GitHub and submit a command issue using that SHA as `expectedHead`.
7. Wait for the issue result before treating the transition as recorded. Re-read the branch and `.workflow/generated/AGENT-CONTEXT.json` after a successful mutating command.
8. Continue only as allowed by the refreshed state and workflow execution mode.

If `AGENT-CONTEXT.json` is missing or stale but the record exists, remote `sync` can regenerate it through the canonical CLI. If no workflow record exists, remote `init` is the bootstrap path.

A remote command issue is an execution request, **not approval evidence**. In Gated mode it must not replace human approval. An agent may submit a command containing `--approved-by` only after the required explicit human approval already exists; GitHub write access or the ability to create an issue does not grant approval authority.

## Supported remote commands

The bridge intentionally exposes a narrow allowlist rather than arbitrary process execution.

Read-only commands used to complete the remote control loop are:

```text
design-workflow stage check --json
design-workflow validate
design-workflow sync --check
```

The bridge reports their bounded CLI output on the issue and never commits repository changes. A `stage check` exit code of `1` is still reported as an executed preflight so the agent can inspect the CLI findings; it is not converted into a passing stage decision.

Supported mutations are the canonical workflow transitions and registries needed by the normal process:

```text
init
migrate
sync
toolkit pin|migrate
snapshot add|verify|supersede
artifact adopt|scaffold|review|approve|reopen|supersede|baseline
stage review|advance|rewind
architecture decide
profile upgrade start|finish
trace define|update|supersede
task create|ready|start|block|unblock|complete
task validation set
review set-result
mode set
```

The bridge rejects arbitrary shell commands, unsupported/read-only CLI commands, `migrate --check`, explicit `--record`, all `--control` overrides, filesystem paths that escape the checked-out project lexically or through symlinks, and toolkit identity overrides. Remote initialization may use `--repository` only as `--repository .`, binding the project to the checked-out repository.

## Execution and integrity contract

For every accepted issue, the reusable workflow:

1. checks out the remote bridge from `job.workflow_repository` at `job.workflow_sha`, so the parser/executor is exactly the reusable-workflow revision selected by the caller;
2. validates the issue envelope and applies a coarse author-association screen before any target checkout;
3. queries GitHub's calculated repository permission for the requester and requires effective `write` or `admin` access before the write-capable job proceeds;
4. checks out the caller repository's requested branch with full Git history only after authorization;
5. verifies every remote filesystem-bearing command path remains inside the real project checkout, including through existing symlink ancestors;
6. resolves the runtime toolkit from project state. Canonical or legacy pins may select an older exact revision, but the recorded toolkit repository must match the trusted bridge repository; uninitialized/unpinned projects bootstrap from the bridge revision;
7. checks out that exact runtime toolkit revision separately and runs its canonical CLI, so installing a newer transport does not silently upgrade an existing workflow toolkit;
8. requires the checked-out project `HEAD` to equal `expectedHead` and the worktree to be clean;
9. invokes the CLI with a process argument vector rather than shell interpolation;
10. for mutations, runs `design-workflow validate` and `design-workflow sync --check` before committing;
11. rolls back the local checkout when the command or post-mutation validation fails;
12. creates one workflow-state/narrative commit only after the canonical CLI operation succeeds;
13. rechecks the remote branch still equals `expectedHead` immediately before push;
14. pushes normally to the target branch and never uses force or force-with-lease;
15. posts the result on the command issue and closes it.

The reusable workflow serializes remote commands per caller repository. `expectedHead` plus the final non-force push still provide optimistic concurrency protection against branch changes that occur outside that queue.

## Implementation lineage

The command issue lives outside Git history. This is deliberate.

A transport file committed to the target branch before execution would change `HEAD` and could invalidate `task start` or `task complete` lineage. The issue transport avoids that contamination:

- `task start` executes against the exact committed planning HEAD, then the bridge commits the resulting workflow-control update;
- implementation work is committed normally by the implementation agent/user;
- `task complete` executes while that implementation commit is still `HEAD`, allowing the canonical CLI to bind validation/output lineage to it;
- only after completion succeeds does the bridge add the separate workflow bookkeeping commit.

The bridge therefore preserves the CLI's distinction between implementation-output commits and workflow/documentation commits.

## GitHub Actions behavior and limitations

The executor uses the caller repository's `GITHUB_TOKEN`. GitHub does not normally start new workflow runs for events caused by that token, including a push produced by this executor. This prevents recursive automation, but it also means the bridge's bookkeeping commit should not be expected to trigger ordinary `push` CI.

That limitation is intentional for this transport: implementation code should already have been committed and validated through the project's normal implementation/CI path before `task complete`; the remote bridge commit is workflow control, generated state, or narrative scaffolding. If a project intentionally requires CI on workflow-generated commits, use a separately approved GitHub App/PAT design rather than weakening this bridge implicitly.

The bridge does not bypass branch protection, environment protection, required human approvals, repository Actions policy, source-authority rules, or workflow validation rules. Any of those can still block execution.

## Failure semantics

The bridge fails closed. A rejected or failed command does not push workflow state.

Typical failures include:

- malformed/unsupported command envelope;
- requester without effective write/admin repository permission;
- stale `expectedHead`;
- missing target branch;
- dirty checkout;
- unsafe or symlink-escaping command path;
- untrusted/malformed toolkit binding or unavailable pinned toolkit revision;
- canonical CLI rejection;
- failed post-mutation validation or generated-state check;
- protected-branch or repository-policy denial;
- concurrent remote branch movement before push.

After failure, inspect the reported reason, refresh repository/workflow state, correct the cause, and submit a new command issue. Never repair a failed remote transition by hand-editing the canonical record or generated projections.
