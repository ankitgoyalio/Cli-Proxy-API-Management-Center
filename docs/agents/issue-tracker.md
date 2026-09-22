# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in
`ankitgoyalio/Cli-Proxy-API-Management-Center`. Use the `gh` CLI for all operations.

Follow `.agents/GIT-GITHUB.md` before changing GitHub state. Verify the repository and pass
`--repo ankitgoyalio/Cli-Proxy-API-Management-Center` when the command supports it.

## Conventions

- **Create an issue**: `gh issue create --repo ankitgoyalio/Cli-Proxy-API-Management-Center --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --comments`, filtering comments with `jq` and also fetching labels.
- **List issues**: `gh issue list --repo ankitgoyalio/Cli-Proxy-API-Management-Center --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --add-label "..."` or `--remove-label "..."`
- **Close**: `gh issue close <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr`
equivalents:

- **Read a PR**: `gh pr view <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --comments` and `gh pr diff <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center`.
- **List external PRs for triage**: `gh pr list --repo ankitgoyalio/Cli-Proxy-API-Management-Center --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `authorAssociation` values `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`.
- **Comment, label, or close**: use `gh pr comment`, `gh pr edit`, or `gh pr close` with `--repo ankitgoyalio/Cli-Proxy-API-Management-Center`.

GitHub shares one number space across issues and PRs. Resolve an ambiguous number with
`gh pr view <number>` and fall back to `gh issue view <number>`.

## When a skill says “publish to the issue tracker”

Create a GitHub issue in `ankitgoyalio/Cli-Proxy-API-Management-Center`.

## When a skill says “fetch the relevant ticket”

Run `gh issue view <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue. Where sub-issues are unavailable, add the child to a task list in the map body and put `Part of ankitgoyalio/Cli-Proxy-API-Management-Center#<map>` at the top of the child body. Labels use `wayfinder:<type>` (`research`, `prototype`, `grilling`, or `task`).
- **Blocking**: GitHub’s native issue dependencies are canonical. Add an edge with `gh api --method POST repos/ankitgoyalio/Cli-Proxy-API-Management-Center/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where the database ID comes from `gh api repos/ankitgoyalio/Cli-Proxy-API-Management-Center/issues/<number> --jq .id`.
- **Frontier query**: list the map’s open children, drop assigned tickets and tickets with an open blocker, then take the first in map order.
- **Claim**: `gh issue edit <number> --repo ankitgoyalio/Cli-Proxy-API-Management-Center --add-assignee @me`.
- **Resolve**: comment with the answer, close the child, then append a context pointer to the map’s Decisions-so-far.
