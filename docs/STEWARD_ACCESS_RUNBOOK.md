# Community stewardship — secure but approachable local participation

**State:** reviewed development candidate only. This wave is not production identity acceptance or owner-approved access. Cloudflare setup remains deliberately deferred to Hermes. **No claims of mosque endorsement, product halal certification, ownership, or authority may be inferred from these grants.**

## Three human journeys

1. A **Jamaican Muslim resident** or **person learning about halal living** browses public source-listed resources without registration. A listing links to its original source, source-viewed date and a correction action. No one is asked to disclose religion.
2. A **mosque or local business representative** first uses `/contribute/?intent=representative` to submit a source-based suggestion. This is **not an account creation** or proof of ownership. An accountable Tayyib operator obtains independent confirmation through the organization, records that verification outside the public form, and submits a narrowly scoped grant to another independent operator for review. The grant includes an email identity, one canonical listing ID, original public source and review note, and an expiry within a year. Nothing is auto-issued from an anonymous request.
3. An **approved representative** enters `/steward/` through a *separate* Cloudflare Access policy and can view only authorized, current listing assignments. They can submit a bounded source-referenced proposal. Public pages are updated only via a separately reviewed source-control publication; verification remains a different, independently assessed process.

## Trust boundary

- Public visitors have **no required account**. The existing anonymous suggestion route remains disabled until legal/privacy and D1/Turnstile authorization. It does not create a grant.
- Staff: `HUB_STEWARD_GRANTS_ACTIVE=true` plus the existing restricted `HUB_OPERATOR_ACTIVE`, `HUB_OPERATOR_AUD`, `HUB_OPERATOR_TEAM_DOMAIN`, `HUB_OPERATOR_EMAILS`, a separate `HUB_STEWARD_GRANT_REVIEWERS` allowlist, and D1 `WAITLIST_DB`. The operator endpoint is `/api/operator/stewards`. An operator cannot grant access to their own email. A second operator should verify the evidence independently of the contact and initial intake reviewer.
- Representatives: separate `HUB_STEWARD_ACTIVE=true`, `HUB_STEWARD_AUD`, `HUB_STEWARD_TEAM_DOMAIN` (may be same organizational team domain but a **different audience**), and D1 `WAITLIST_DB`. Identity is verified from a cryptographically signed Access JWT, never from an untrusted header, browser email or query parameter. Access **must protect both `/steward/*` and `/api/steward/*`** on each preview/production hostname. Staff policies protect `/operator/*` and `/api/operator/*` separately. In a public preview all staff/representative flags stay **false**.
- Grants are email + listing scoped, expire automatically for API reads/writes, and are revocable by a reviewed decision. An expired row is still retained as `active` for audit history: the operator must explicitly revoke the old row before issuing a fresh authorization, with a new evidence review. The client never chooses another listing ID for its proposal; the SQL `INSERT ... SELECT` obtains the ID from the current grant atomically, and a database trigger double-checks status, expiry and identity.
- `steward_grants`, `steward_audit` and `steward_proposals` contain sensitive professional contact emails and private review notes. Minimize collection, use staff-only access, have a lawful basis and deletion/retention schedule approved before enabling. No public exposure or CSV export is included.
- Staff recording an authorization **does not confer endorsement**, any halal status, religious authority, editorial reviewer status, publication rights or access to another listing. Where authority is revoked or disputed, revoke the grant immediately and keep an immutable audit of the decision. Pending suggestions remain for independent editorial review.

## Migration and later deployment handoff to Hermes

- Existing migrations 0001–0006 must run first. Then run `0007_steward_grants.sql` and `0008_steward_proposals.sql` forward-only on staging, validate indexes/triggers and test revocation. Do not delete audit history to revert an authorization.
- Gate activation behind configured, confirmed Cloudflare Access application audiences, default-deny policy, scoped operator/editor roles, security review, privacy approval and production-equivalent negative tests. Protect both static and API routes. Test tampered/wrong-audience JWTs, expired grants, changing/competing grants, cross-site writes, D1 outage and operator revocation.
- Rollback: first set `HUB_STEWARD_GRANTS_ACTIVE=false` and `HUB_STEWARD_ACTIVE=false`, and revoke Access policies if needed. Existing public directory remains available; account and audit records remain retained according to approved policy. Individual revoked grant status cannot be restored; issue a new verified grant after fresh review.
- Production publication, commerce, certification validation, domain purchase and Cloudflare provisioning are **out of scope** for this build.

## Acceptance evidence

`npm run check`, `python browser-steward-access-check.py`, `python browser-steward-check.py`, existing catalogue/hub/ingredient/operator/trust/editorial browser regression checks. Real Access/D1/Turnstile smoke and independent assistive-technology testing remain pending for Hermes and product-owner signoff.
