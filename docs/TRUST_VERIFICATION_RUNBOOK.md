# Tayyib Halal — internal evidence and verification runbook (TRUST-01)

**Status:** implemented code candidate. **No live Cloudflare authentication, database, certification or public claims have been approved.** Deployment and infrastructure configuration are intentionally deferred to Hermes at final release.

## What this workflow IS (and is not)

The private `/operator/trust/` page supports evaluating **public evidence references** for the five concept products and 15 source-listed Jamaican community records. The starting registry is entirely `unverified` or `source-listed-only`. The system does not issue halal certificates, certify religious authorities, create active suppliers, process orders, publish events, or alter any public site content. A URL is not proof of certification, and **internal acceptance is not permission to publish**.

### Authority separation

- **Editor**: allowlisted Cloudflare Access user can record a claim, scope, source and review due date. Can raise an evidence dispute. The editor cannot independently approve their own record.
- **Independent verifier**: editor whose email also appears in the separate `HUB_VERIFIER_EMAILS` allowlist. Can accept or reject a pending record **provided they are not its submitting editor**. An authenticated staff member alone does not qualify as an accredited halal certifier.
- **Publisher**: separate, human-approved GitHub content change, qualified content/legal/food-safety/religious review and release authorization. No route in this package can publish a claim.
- **System**: derives `recheck-required` from `review_due` or `valid_until` for accepted cases; no schedule is assumed verified or current after expiry. Evidence is immutable; revise by submitting a new case and flagging the prior one as disputed.

## Internal states

`pending → accepted | rejected` and `accepted → disputed`. Neither `rejected` nor `disputed` can be silently reopened. A corrected claim is a **new** record; prior cases remain auditable. This prevents repackaging a rejected claim as verified without new evidence.

The D1 database installs triggers to audit submissions, decisions and disputes in the **same SQLite statement**. Triggers reject self-verification, unsupported transitions, insufficient review notes, evidence mutation, and audit log modification. API also enforces JWT, role, origin, content and version checks. Acceptance requires an evidence note and an independent reviewer, but is still an **internal research decision**.

## When Hermes configures Cloudflare at final deployment

Do not do this until the product owner authorizes staging deployment and security/privacy owners approve. Apply migrations in order: `0001_waitlist.sql`, `0002_hub_suggestions.sql`, `0003_operator_moderation.sql`, `0004_trust_register.sql`, `0005_trust_subjects.sql`. Note `0003` contains non-repeatable `ALTER TABLE` and must be tracked as applied. `0005` uses `INSERT OR IGNORE` so seeding cannot overwrite existing evidence. **Never edit a previously applied migration**; add a forward-only migration for future subjects or schema changes.

Protect **both** `/operator/*` and `/api/operator/*` on every production and preview hostname via Cloudflare Access, including `/operator/trust/` and `/api/operator/trust`. Check Access policy and the app JWT audience. Apply D1 binding and these environment settings only after review:

| Variable | Purpose |
|---|---|
| `HUB_TRUST_ACTIVE=true` | Separate explicit enablement of evidence APIs; default is closed |
| `HUB_OPERATOR_ACTIVE=true` | Existing staff gate; default is closed |
| `HUB_OPERATOR_TEAM_DOMAIN` | Exact trusted `*.cloudflareaccess.com` team issuer |
| `HUB_OPERATOR_AUD` | Exact Access audience |
| `HUB_OPERATOR_EMAILS` | Editor email allowlist |
| `HUB_VERIFIER_EMAILS` | **Independent verifier** email allowlist, separate from ordinary editors |
| `WAITLIST_DB` | Existing D1 binding, containing hub and trust tables |

Do not grant a user both review authority and publication authority by default. Do not place Access secrets, certificates or private documents in browser code, repository history, D1 text fields, public object storage, or public evidence URL parameters. Current UI accepts **public references only**; confidential certificate uploads would require a later private storage service, scanning, staff-only signed downloads and a retention/deletion policy.

## Staging acceptance / falsification

1. Keep `HUB_TRUST_ACTIVE` absent: GET/POST returns 503 and writes nothing. Confirm Access denies unauthorized people even if they know the URL.
2. In staging, validate a real, allowlisted editor can read only the internal records, submit a source-referenced claim, and see the immutable `submitted` audit event. Unknown subject must not create a case.
3. A regular editor cannot accept/reject. A verifier **cannot** review their own case. A separate verifier can reject or accept with a substantive note, valid scope and future dates.
4. Simultaneous reviewers: only the first `pending`+version transition succeeds. Confirm the other gets a conflict and no additional audit event.
5. A certificate past `valid_until` or `review_due` may not be accepted as current. Existing accepted cases past dates show in `Review due` with `recheck-required` effective state. Trigger does not rewrite the record.
6. A disputed accepted record stops being current. Review history lists the original submission, independent decision and dispute. Attempts to alter original evidence or edit/delete audit entries must fail at the database level.
7. Reject forged JWTs, wrong Access audience/issuer, non-allowlisted email, cross-origin writes, malformed payloads and invalid URLs. Check private API responses use `no-store` and public routes never expose the evidence or editor identity.
8. Compare homepage, product pages, `/discover/`, `/community/` and `/events/` before and after internal decisions: **no public facts or halal claims may change**.
9. Perform human UX/accessibility review with keyboard, screen reader, contrast and real devices. Test Access session expiry, operator error states, audit export policy, source take-down and rollback.

## Release blocks and operating model

Do not activate until the organization identifies accountable editors/verifiers, documents a source-review procedure and disputes/takedown contact, chooses evidence-review cadence, establishes legal privacy/retention controls, and has verified issuer/supplier relationships where factual certification claims are contemplated. Include a way to report expired/revoked certificates and avoid paid listings appearing as independently verified.

**Emergency:** set `HUB_TRUST_ACTIVE=false` and revoke Access policy; retain audit history under the applicable retention policy. For an incorrect public claim, roll back its separate published content change through the normal human-reviewed GitHub flow. Never claim a rollback of this internal API changes the public website automatically.

### Future waves

- Signed, confidential evidence handling via private R2 + malware scanning and role-aware downloads, if legal reviewers require document storage.
- Partner/venue onboarding, designated mosque stewards, reviewer queues by subject and automatic scheduled **review-due notifications** with evidence freshness recertification.
- A separate GitHub-backed editorial publishing workflow, including independent religious-content and supplier-claim approvals.
- Commercial product activation only after actual supplier contracts, valid certifications with SKU/facility scope, food-safety/import/label approval, pricing, inventory, payments and fulfilment exist.
