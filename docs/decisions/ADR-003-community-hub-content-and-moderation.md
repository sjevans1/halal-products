# ADR-003 — Community Hub content and review architecture

Status: proposed candidate, owner acceptance pending. Framework: project-pinned OpenJM Development Framework.

## Context
Tayyib Halal aims to be genuinely useful to Jamaican Muslims and curious visitors, while maintaining boundaries between editorial content, independent certification and the brand's future commerce offerings. Existing website is a Cloudflare Pages static experience with D1 reserved for a controlled launch-list feature.

## Options
1. Static + governed JSON for public records; dedicated Pages Functions + D1 pending-only suggestions; GitHub PR content approval. Low initial operations/dependencies and explicit provenance; editorial updates require a code PR.
2. Third-party hosted CMS with content admin + dynamic feeds. Faster editorial edits, but new commercial costs, data location, credentials, and authorization/security surface.
3. Full marketplace, self-service business accounts, interactive map and per-mosque dashboards from day one. Rich features but high trust, verification, abuse, privacy and operational burden before sufficient verified data exists.

## Decision
Use **option 1** for the initial hub expansion. Keep `hub/hub.json` under review, validate records/guides/recipes/events in `scripts/build-hub.mjs`, render six consistent content pages and provide non-personal contribution suggestions to D1 only when expressly activated. Public site never reads pending DB rows. No claim of religious ruling or certification without source/issuer evidence.

## Consequences
- Website visitors can browse, search and learn without an account. Operator must maintain directory and event evidence through GitHub PRs; a genuine browser administration portal is deferred.
- Approved community content may later be migrated into an authenticated CMS or D1 read API without changing public URL contracts.
- Listings are source-referenced only; local public directory is not independently verified. No businesses/certified providers have been seeded without approved certificate evidence.
- Live D1 moderation needs real rate controls, retention, privacy and live Turnstile testing before enabling. CAPTCHA alone is not robust abuse prevention.
- A later architecture decision is required for editorial roles, audit controls, protected map data, paid sponsors, payments and fulfilment.
- Watermelon UI can be assessed again for authenticated administration and advanced commerce; it is not copied or installed for this low-dependency editorial surface.
