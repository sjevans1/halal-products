# Tayyib Halal — editorial review runbook (HUB-09)

**Status:** implemented code candidate, **not activated**. External Cloudflare Access/D1 security and human operational acceptance are required. An editor approval is *not* a public publication, not a certificate, and not a religious or food-safety ruling.

## Separation of authority

1. Anonymous visitors can read *source-listed* directory entries. No visitor profile, tracking, or identity is needed.
2. Visitor suggestions are blocked unless `HUB_SUBMISSIONS_ACTIVE=true`, Turnstile and D1 are configured, privacy/legal signoff recorded, and rate limits implemented. No automatic publishing.
3. The private operator UI at `/operator/` is a **review queue**. Even when activated, authenticated editors may only approve/reject existing *pending* suggestions with a note. They cannot edit or publish the public directory through the operator API.
4. New/updated published records require **a separate human-reviewed change** to `hub/hub.json`, generated output, and a release decision. Verify published source and record status; never copy a visitor assertion into a certification field.

## Required Cloudflare setup (staging first)

- Connect the branch to **Cloudflare Pages Preview** with build `npm run build` and output `public`. This repository does not publish by itself.
- In Cloudflare Zero Trust, create an **Access application** that covers the operator URL **and** the `/api/operator/*` API route on every permitted preview/production hostname. Restrict Access policy to explicitly nominated staff. Protect any alternate route/hostnames too. Prevent anonymous public requests from reaching protected paths (defence in depth).
- Configure environment variables for the Pages project (separately for preview and production):

| Variable | Required | Purpose |
|---|---|---|
| `HUB_OPERATOR_ACTIVE` | `true` **only after approval** | Fail-closed review API activation |
| `HUB_OPERATOR_TEAM_DOMAIN` | Exact host like `your-team.cloudflareaccess.com` | Trusted Access issuer and certificate URL; never URL or arbitrary host |
| `HUB_OPERATOR_AUD` | Access app audience tag | JWT application scope |
| `HUB_OPERATOR_EMAILS` | Comma-separated approved editor email addresses | Independent staff allowlist; empty = deny |
| `WAITLIST_DB` | D1 database binding | Moderation rows and audit storage |

- Access JWT signature is checked against the configured team's JWKS; issuer, audience, expiry, issue-time and editor email are validated server-side. `Cf-Access-Authenticated-User-Email` alone is not trusted. HTTPS cross-origin writes are rejected, and JSON payloads are bounded.
- Apply `migrations/0002_hub_suggestions.sql` **before** `migrations/0003_operator_moderation.sql`. Migration 0003 contains `ALTER TABLE` statements; apply only once through reviewed migration tracking, not repeatedly on every deployment.
- Review privacy/retention policy for visitor-submitted titles/URLs/notes and for editor identifiers in the audit table. Do not place personal details, restricted faith-related data, or unnecessarily sensitive content in reviewer notes. Decide deletion/export requests and retention before collecting actual submissions.

## Operational smoke in preview (not yet executed)

1. With `HUB_OPERATOR_ACTIVE` absent or false, `/api/operator/suggestions` must return 503 and not disclose records. Public suggestion intake stays disabled independently.
2. With Access configured, verify non-editor denied; editor with valid token and allowlisted email can view a bounded page of pending records. Verify invalid signature, expired token, wrong issuer/audience, disallowed email and Access downtime deny access.
3. Verify origin enforcement for POST; malformed note, unsupported transition and stale pending item denied; approved/rejected transition produces exactly one audit record, no unaudited partial state.
4. After a review decision, confirm that none of `/discover/`, `/community/` or `/events/` changes without an explicit separately approved content PR.
5. Test 320/390/768/1440 UX, keyboard focus and screen reader operation, especially the confirmation dialog and no-JS failure state.
6. Validate API and Access policies with actual Cloudflare Pages deployment; unit tests with mocked JWKS/D1 are **not** a substitute.

## Emergency rollback

- Disable `HUB_SUBMISSIONS_ACTIVE` immediately to stop new public submissions; disable `HUB_OPERATOR_ACTIVE` to stop operator API access. Restrict or remove Access application policies as necessary and preserve server-side audit records.
- Do not mark work accepted if D1 auditing fails; do not claim a decision was saved on client errors. Reconcile any discrepancies against D1 and migrate only under controlled procedures.
- For incorrect public directory or religious content, revert or correct the **GitHub content commit** and redeploy an approved revision. Editorial moderation does not publish.

## Next operational capability (not in this wave)

- Source evidence review screens, named partner/mosque content stewards, certificate scope/expiry records, discrepancy alerts, revalidation cadence, secure editorial publication PR generator, durable audit export, and role separation between submitter/reviewer/publisher.
- A verified commercial catalogue needs upstream supplier documents, ingredients/allergen declarations, packing/net weights, storage rules, lawful food import/sale obligations, independent halal certification checks, and real fulfillment and payment workflows. No checkout is to be exposed beforehand.
