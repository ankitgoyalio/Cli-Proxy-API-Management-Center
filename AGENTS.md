# Agent Guide

## Scope and sources of truth

This repository is the React/TypeScript management UI for CLI Proxy API. It is not the
proxy server. The UI talks to the Management API under `/v0/management`.

- Use the repository itself as the source of truth for commands, tooling, and structure;
  inspect `package.json`, configuration, and nearby code instead of copying them here.
- Use `../CLIProxyAPI` as the source of truth for backend contracts before changing
  endpoints, payloads, provider keys, OAuth callbacks, auth-file behavior, or plugin/config
  semantics. When that checkout is absent, report the missing evidence instead of guessing.
- Keep changes scoped. Preserve unrelated work in a dirty worktree and avoid opportunistic
  migrations or formatting.
- **Git/GitHub:** Before syncing or changing Git history, mutating GitHub state, or writing
  issue, pull-request, tag, or release references, read
  [`.agents/GIT-GITHUB.md`](.agents/GIT-GITHUB.md).
- **Fork maintenance:** Preserve the independence, no-promotion, link-ownership, plugin
  provenance, synchronization, and release rules in
  [`docs/fork-maintenance.md`](docs/fork-maintenance.md).

## Implementation boundaries

- Put feature-owned UI and logic in `src/features/<feature>/`. Follow nearby conventions in
  legacy `src/pages/`; migrate unrelated code only as a separate, requested change.
- Keep Management API access in `src/services/api/` and use its shared client. Normalize
  backend shapes at this boundary rather than in components.
- Preserve authentication/version/plugin-support events, stale-request guards, and cache
  cleanup across connection changes and logout. Reuse the config store's full-config cache
  and invalidate or update it after mutations.
- Extend provider behavior through `src/features/providers/descriptors.ts` and `adapters.ts`
  instead of adding provider conditionals throughout the UI.
- Preserve hash routing and the single-file production artifact. `dist/index.html` is renamed
  to `management.html` for releases; edit source and build configuration, never `dist/`.
- Keep user-facing and accessibility copy in all four locale files under
  `src/i18n/locales/`. Preserve keyboard access, focus behavior, accessible names, and
  reduced-motion behavior.
- Reuse shared UI components, SCSS modules, and theme tokens. Follow the formatter, linter,
  TypeScript configuration, and the style of neighboring files.

## Dependencies, verification, and security

- Use Bun and keep dependency changes in `bun.lock`; do not add another package manager's
  lockfile.
- Add focused regression coverage for behavior changes. Run focused checks while iterating
  and `bun run verify` before handoff. For UI changes, also inspect the affected route in a
  browser. Report commands run, failures, and any unavailable backend or browser coverage.
- Treat management keys, provider credentials, auth files, logs, screenshots, and fixtures as
  sensitive. Use synthetic data and redact secrets. `secureStorage` is obfuscation, not an
  encryption boundary.
- Use Conventional Commits when a commit is requested. Do not commit generated `dist/`
  output.

## Handoff

Summarize the behavior changed, list verification performed, and identify remaining risks or
unverified integration assumptions. If shared guidance changes and a local `CLAUDE.md` exists,
keep it byte-for-byte identical to this file.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `ankitgoyalio/Cli-Proxy-API-Management-Center`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default canonical labels. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a single-context layout. See `docs/agents/domain.md`.
