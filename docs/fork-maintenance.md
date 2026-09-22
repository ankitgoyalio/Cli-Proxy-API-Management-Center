# Fork maintenance policy

This repository is an independently maintained fork. It stays in GitHub's fork network so
its provenance and relationship to the parent remain visible. The existing product name and
backend compatibility do not create an affiliation with Router-For.ME or with any provider
supported by the application.

## Terms

- **Management Center** is the Web UI maintained in this repository. It operates a compatible
  server through `/v0/management`; it is not the proxy server.
- **Compatible Backend** is a CLI Proxy API server supported by the Management Center.
- **Provider Integration** is functional support for configuring or authenticating an
  external AI service.
- **Promotion** is commercial placement, sponsor copy or sponsor placement, affiliate
  tracking, signup solicitation, or preferential commercial treatment. Promotion is not a
  Provider Integration.
- **Upstream-Published Plugin** is a plugin from the Compatible Backend project's organization
  that is recognized by the existing backend-ecosystem trust policy. It is a provenance term,
  not an “official plugin” designation by this fork.

## Independence and promotion boundary

Functional Provider Integrations are permitted. They may expose configuration,
authentication, usage, and neutral operational links that help a user manage a provider they
already configured.

Promotion is not permitted. The Management Center must not add sponsor placement, affiliate
tracking, signup solicitation, preferential commercial treatment, or marketing claims. An
integration must not be removed merely because the parent promoted that provider; remove the
promotion while preserving the useful behavior and backend-compatible configuration.

The terms “upstream-published” and “Upstream-Published Plugin” identify publisher provenance.
Using them does not change the trust result established by the Compatible Backend ecosystem
and does not imply endorsement, publication, review, or warranty by this fork. In particular,
the existing trust classification for plugins under `router-for-me/*` remains unchanged, and
plugins from other publishers continue to receive the existing third-party warnings.

## Link ownership

Outbound links must identify which project owns the resource:

- Management Center source, issues, releases, update checks, and downloadable update artifacts
  are fork-owned and must point to
  `ankitgoyalio/Cli-Proxy-API-Management-Center`.
- Compatible Backend source, help, and server-contract documentation are upstream compatibility
  resources. They may point to Router-For.ME when they are labelled as Compatible Backend or
  upstream resources rather than as ownership links for the Management Center.
- Provider destinations must be neutral operational resources for an existing integration.
  They must not contain referral parameters or solicit registration.

Keep ownership and promotion decisions at the centralized fork-policy boundary in
`src/policies/forkPolicy.ts`. Do not scatter replacement repository URLs, affiliate decisions,
or promotion flags across components.

## Git topology

- `origin` is `ankitgoyalio/Cli-Proxy-API-Management-Center`, this fork. Fetch and push fork
  branches explicitly through this remote.
- `upstream` is `router-for-me/Cli-Proxy-API-Management-Center`, the parent. It is fetch-only:
  its push URL is disabled and upstream tags are disabled with
  `remote.upstream.tagOpt=--no-tags`.

Before changing Git history or GitHub state, follow [`.agents/GIT-GITHUB.md`](../.agents/GIT-GITHUB.md)
and verify both remote ownership and the GitHub CLI's default repository. Pushing to the parent
requires separate, explicit maintainer authorization.

## Synchronizing from upstream

Integrate parent changes as reviewable repository work:

1. Start a short-lived synchronization branch from the fork's current `main`.
2. Fetch the intended upstream branch through `upstream`; do not fetch or import parent tags.
3. Merge or rebase the intended upstream commits without rewriting established project
   history. Resolve conflicts in favor of the policy in this guide.
4. Review the combined diff for ownership changes, Promotion, provider regressions, plugin
   provenance, generated artifacts, and unintended parent release configuration.
5. Run focused checks while resolving the integration, then run `bun run verify`. For affected
   UI routes, also inspect the built behavior in a browser.
6. Push the synchronization branch explicitly to `origin` and open a pull request targeting
   the fork's `main`. Merge only after review and successful verification.

Do not bypass the synchronization branch by pushing parent history directly to `main`.

## Fork releases

A fork-owned release may be created only after the integrated upstream and fork-specific
changes pass review and verification on the fork's `main`. Release tags, release notes, update
links, and `management.html` artifacts belong to this repository.

Upstream tags are not mirrored automatically, copied as fork tags, or treated as evidence that
the fork is ready to release. A parent release can inform a synchronization, but it does not
become a fork release until the resulting fork state has passed this repository's process.
Never commit generated `dist/` output.

## Preservation requirements

Every synchronization and release must preserve the existing MIT attribution and license,
Git history, and GitHub fork relationship. Do not remove legally required attribution, rewrite
authorship, detach the repository from the fork network, or add a downstream copyright claim
as part of routine synchronization.

Keep changes scoped to the integration. Provider removal, product renaming, backend-contract
changes, and redesigns require their own explicit decisions; upstream synchronization does not
authorize them.
