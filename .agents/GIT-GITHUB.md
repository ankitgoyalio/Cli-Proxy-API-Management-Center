# Fork-safe Git and GitHub

This project intentionally remains a GitHub fork so it can sync with its parent:

- Project repository (`origin`): `ankitgoyalio/Cli-Proxy-API-Management-Center`
- Parent repository (`upstream`): `router-for-me/Cli-Proxy-API-Management-Center`

Keep every operation's owner and direction explicit. Preserve the fork relationship and use
ordinary, reviewable history integration rather than detaching or rewriting history.

## Before changing state

1. Inspect `git status --short --branch` and `git remote -v`.
2. Confirm `origin` fetches from and pushes to the project repository.
3. Before a GitHub mutation, confirm `gh repo set-default --view` names the project repository.
   Set it when needed with:

   ```bash
   gh repo set-default ankitgoyalio/Cli-Proxy-API-Management-Center
   ```

4. For issues, pull requests, releases, workflow actions, and other consequential GitHub
   operations, also pass `--repo ankitgoyalio/Cli-Proxy-API-Management-Center` when supported.

The target is verified only when both the owner and repository name match. Stop and resolve
any mismatch before changing state.

## Syncing from the parent

Treat `upstream` as fetch-only and set `remote.upstream.tagOpt=--no-tags`. Upstream tags belong
to the parent; they are not releases of this project.

Sync in one direction:

1. Fetch `upstream`.
2. Integrate the intended upstream branch locally with a normal merge or rebase appropriate to
   the task.
3. Review and verify the integrated result.
4. Push the resulting branch explicitly to `origin`.

Pushes to the parent and pull requests targeting the parent require an explicit user request
for an upstream contribution.

## Project branches, tags, and releases

- Push project branches and tags explicitly to `origin`.
- Base project pull requests on `ankitgoyalio/Cli-Proxy-API-Management-Center:main`; verify the
  owner and base before creation because GitHub's fork UI may propose the parent.
- Create and link releases under the project repository. Use full URLs in the
  `ankitgoyalio/Cli-Proxy-API-Management-Center` namespace.
- Write issue and pull-request references as `owner/repository#number`. Bare numbers, tag names,
  and relative `/compare` or `/releases` links are ambiguous in a fork network.
