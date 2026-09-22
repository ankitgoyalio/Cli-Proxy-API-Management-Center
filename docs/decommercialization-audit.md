# De-commercialization audit

Audit date: 2026-09-22

This audit covers both READMEs, application source and assets, all four locale catalogs,
navigation and routes, the centralized fork policy, and the Vite single-file production output.
It applies the Provider Integration and Promotion definitions in
[the fork maintenance policy](fork-maintenance.md).

## Removed Promotion markers

The source and production-artifact regression test rejects these known markers:

- APIMart and BestProxy names or assets;
- the former APIKEY.FUN `/register` destination;
- `aff`, `ref`, `referral`, and `utm_*` query parameters;
- the former Kimi platform affiliate destinations;
- the former FennoAI registration and Qiniu referral destinations; and
- the removed English calls to action and recharge claim.

The audit found none in shipped source or the single-file build. Internal `Sponsor*` names remain
because they implement functional provider configuration and are explicitly outside the rename
scope. Plugin “registration” describes the backend lifecycle of an installed plugin, not user
acquisition or a commercial signup action. The `commercial-mode` setting remains because it is a
Compatible Backend configuration field rather than Management Center Promotion.

## Remaining provider-domain occurrences

| Domain or owner                       | Functional justification                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.apikey.fan`, `slb.apikey.fan`    | Backend-compatible APIKEY.FUN endpoints used to preserve existing configuration, protocol grouping, and usage lookup.                        |
| `apikey.fan/dashboard`                | Neutral operational link exposed only for an already configured APIKEY.FUN integration; it has no referral parameters.                       |
| `api.moonshot.ai`, `api.moonshot.cn`  | Kimi provider endpoints required to recognize and manage existing configurations.                                                            |
| `api.kimi.com`, `kimi.ai`, `kimi.com` | Kimi usage and OAuth service identifiers required by existing authentication and quota workflows.                                            |
| `api.fenno.ai`                        | FennoAI provider endpoint required to recognize and manage existing configurations.                                                          |
| `api.qnaigc.com`, `api.modelink.ai`   | Qiniu provider endpoints required to recognize and manage domestic and overseas configurations.                                              |
| `router-for-me/*`                     | Compatible Backend source/help ownership and upstream-published plugin provenance. These occurrences do not identify the owner of this fork. |

## Ownership, locale, and accessibility checks

- Management Center source, issue, release, and update-artifact links resolve through
  `src/policies/forkPolicy.ts` to `ankitgoyalio/Cli-Proxy-API-Management-Center`.
- Compatible Backend source and help links remain labelled as backend resources and point
  upstream.
- Both READMEs and every System/About locale contain the agreed independence statement.
- A static translation-key audit checks every literal application translation key directly in
  each locale, without allowing the configured fallback language to hide a missing entry.
- Focused rendering tests preserve ordinary provider management, Kimi OAuth, plugin trust,
  accessible link names, and external-link semantics.

## Integration limits

Browser inspection uses synthetic local state and mocked Management API responses. No live
Compatible Backend or real provider credentials are available in this audit, so live provider
mutations, OAuth completion, quota requests, plugin installation, and config persistence are not
claimed as verified.
