# Community stewardship — content and operations runbook

Scope: source-referenced public listing details + guided **suggestion-only** contributions. Cloudflare is deferred to Hermes, and all public submissions remain closed until that later release gate.

## Data flow

1. **Public browsing:** 15 public-source-referenced entries in `hub/hub.json` → deterministic `/places/<listing-id>/` detail pages. `scripts/build-hub.mjs` builds the pages from a checked-in source. Source-viewed date is **not** a claim that a venue operates today.
2. **Suggestion:** each detail links to `/contribute/?record=<listing-id>&intent=correction` with `record` looked up against canonical client data; no arbitrary URL or personal information is accepted from the query string. A single form supports correction/new listing/event/representative information. No user account, ID upload, or public profile claim is made.
3. **Conditional intake:** the form is disabled unless `/api/hub-config` returns an explicitly active D1 + Turnstile setup. The API re-verifies the Turnstile challenge and request hostname server-side, binds fields in SQL, and saves **pending**. Honeypot fields don't create a record. Never trust the client-supplied listing name, note, or “representative” intent as verified evidence.
4. **Private triage:** authorized staff review the pending D1 record under existing `operator/suggestions` Access policies. Staff can reject/approve intake but that does **not** publish a listing. Existing editorial CMS can prepare a reviewed content correction. `trust` evidence review remains separate and independent.
5. **Publication:** a human reviews the source, religious/halal/safety claims and accuracy, then approves a separate source-controlled PR updating `hub/hub.json`. Only a separately authorized release can make the change public.

## Responsibilities and operating boundary

| Responsibility | Current operator path | Required check |
|---|---|---|
| Source freshness | `npm run audit:content` | View actual original source, never refresh a date without viewing it |
| Intake triage | `/operator/` | Authenticated staff, audit, reasoned decisions |
| Editorial changes | `/operator/editorial/` | Independent reviewer, immutable revisions, publication packet |
| Certificate evidence | `/operator/trust/` | Independent verifier and scope-specific evidence; no badge auto-publishing |
| Future organization stewardship | Not activated | Proof of authority, scoped grants, revoke/delegate workflow, dispute and audit |

## Privacy and abuse constraints

No personal religious belief/affiliation, national ID, private contact details or certificate image is solicited in the public suggestion form. Avoid copying volunteered personal information into public records. Existing suggestion storage contains proposed text and source URLs; privacy policy, lawful basis, retention, contact/removal path, abuse-rate limits and access procedures require independent signoff before activation. The form does not provide case tracking or a guarantee of response.

## Deferred Hermes Cloudflare handoff

- Configure `WAITLIST_DB`, Turnstile hostname, `HUB_SUBMISSIONS_ACTIVE`, rate limits, real HTTPS environment, privacy/compliance approvals; run negative and positive submissions.
- Access-protect all operator routes and APIs, migrate D1 in order, validate revoked operators cannot access queues. Never turn on features just because source is merged.
- Validate consistent routes `/discover/`, `/places/*/`, `/contribute/`, `/events/`, `/partners/` and proxy/bot protections in real Cloudflare Pages branch preview.
- No automatic release, public verification badge, full steward login, production ordering or payments in this development package.

## Rollback

Disable `HUB_SUBMISSIONS_ACTIVE` independently of publication or operator features. Existing static pages remain readable, and the form returns the closed state. Content corrections are reverted with a reviewed GitHub change. Never “roll back” an audit trail by deleting it.
