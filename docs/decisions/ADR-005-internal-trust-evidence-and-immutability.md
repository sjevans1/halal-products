# ADR-005 — Independent evidence review with immutable history

Status: **proposed implementation candidate; external staging acceptance outstanding**

## Context

Community and product concept pages require rigorous halal, supplier and community information governance before commerce or confident public verification claims. The existing HUB-09 queue collects untrusted suggestions but does not store provenance checks, certificate scope, expiry or independent review decisions. The public site is not a certification authority.

## Decision

Use one internal D1 trust register scoped to existing product and hub subject IDs, with explicit `unverified`/`source-listed-only` baselines. Keep the source-of-truth register in `trust/registry.json`; seed initial subjects through forward-only reviewed migrations. Avoid public evidence endpoints and public badges. Maintain claims, public HTTPS evidence pointers, issuer-as-supplied, scope, validity dates, review deadlines, independent reviewer, optimistic version, disputed state, and SQLite-triggered append-only audit records. Evidence is never modified after submission.

Access is required for **both web interface and API**, while API independently verifies Cloudflare Access JWT and operator allowlist. The `HUB_VERIFIER_EMAILS` allowlist grants a **separate independent review role**; the submitter cannot verify their own case. Review acceptance is an internal research decision, not a public publication or certification. Public publication is a separately authorized GitHub content change and human release decision.

## Alternatives not selected

- A public self-attested verification badge or instant directory write: allows misinformation and certification impersonation.
- Authorizing via Cloudflare email headers without JWT signature verification: header spoofing risk.
- Using JavaScript-only audit records or multiple unguarded SQL writes: allows lost/partial audit trails. Database triggers make successful mutations auditable atomically.
- Building a heavy multi-tenant CMS or payments platform now: unsupported by current operational readiness, hosting and suppliers. Evaluate Watermelon UI/shadcn and other accessible component libraries during the later CMS/commerce design stage, without introducing unnecessary dependencies into a lightweight editorial site.
- Uploading confidential certificates to public storage: prohibited until there is a reviewed secure file and retention workflow.

## Consequences

Schema and data migration ownership must be explicit, additional subject seed changes require a new forward-only migration, and real Cloudflare Access/D1 tests remain mandatory for activation. Operators will need recurring review-due processes and an adjudication policy. The registry has no public certification authority and cannot make a factual claim accurate by code alone.
