# EDIT-01 — Editorial Studio operating and release runbook

**Status:** SOURCE-CODE CANDIDATE, NOT LIVE. Deployment, Cloudflare Access, D1 and activation belong to Hermes at final infrastructure acceptance. This feature never publishes or certifies anything.

## Purpose and roles

The private operator route `/operator/editorial/` and API `/api/operator/content` enable source-attributed, plain-text proposals for **guides, directory updates, events and recipes**. It is an editorial *draft/approval queue*, not a live WYSIWYG publishing CMS. Editors must be authenticated through signed Cloudflare Access JWTs and present in `HUB_OPERATOR_EMAILS`. Reviewer role additionally requires `HUB_EDITORIAL_REVIEWERS`; reviewers cannot approve their own authored entries. Anonymous visitors cannot access these endpoints. Do not paste personal customer details, health/religious affiliations or confidential supplier documents into text fields.

## Lifecycle

1. An authorized editor creates a private **draft** with a unique human-readable slug, title, summary, plain-text body and primary HTTPS source. Directory and event entries also need locality; events need a valid date.
2. The author can edit and resave **draft** content. Each saved revision increments the compare-and-swap version and writes a database audit entry.
3. The author explicitly **submits** a draft for independent review. Submitted content becomes immutable pending review.
4. A different allowlisted reviewer may **accept internally**, **reject**, or **request changes**, with a review note of 20–500 characters and explicit confirmation. Decisions and version changes are audited atomically via SQLite triggers. Changes-requested entries may be edited by their original author and resubmitted.
5. Internally accepted content exposes a **Copy publication packet** action. It copies a structured proposal, source reference and review rationale to the staff member's clipboard. A separate PR against checked-in `hub/hub.json` or other content files, factual/religious review and human merge/release approval remain mandatory. There is **no write to the public directory, no auto-publish, no checkout and no verification badge**.

## Cloudflare / Hermes handoff (do not activate now)

- Apply migrations `0001` through `0006` **in strict order**, with a staging backup and rollback/recovery plan. Migration `0006_editorial_workflow.sql` is additive.
- Attach the existing D1 `WAITLIST_DB` binding, protect **both** `/operator/*` and `/api/operator/*` on *every* preview and production hostname via Cloudflare Access, configure server-side `HUB_OPERATOR_ACTIVE=true`, `HUB_OPERATOR_TEAM_DOMAIN`, `HUB_OPERATOR_AUD`, `HUB_OPERATOR_EMAILS`, and separately `HUB_EDITORIAL_REVIEWERS`. Enable `HUB_EDITORIAL_ACTIVE=true` **only** after security, privacy and staff-owner approval. No client secrets are shipped.
- Verify signed JWT issuer/audience/expiry/email, deny unlisted writers/reviewers, deny private console without Access, deny cross-origin posts, verify D1 returned `meta.changes`, and test stale revisions, concurrent approvals, self-review, immutable submitted content, audit tampering and rollback.
- Confirm the lawful basis/retention for staff email identities and content revision history. Validate data correction/removal requests and operational incident process. Use Web Application Firewall/rate limits as appropriate.
- Confirm no approved or exported packet appears on any public route without explicit checked-in content and source PR approval. Check generated Pages output, content-security headers and non-indexing of operator routes.

## Offline QA

```sh
npm run check                    # FAST native tests + SQLite trust and editorial invariants
python3 browser-editorial-check.py   # mocked Chromium at 1440/768/390/320; not live Access
```

An automated green test does not replace formal accessibility assessment or deployed Cloudflare smoke. Independent UI, security and content reviews remain release gates. No permission to merge other stacked PRs or deploy is conferred by this package.
