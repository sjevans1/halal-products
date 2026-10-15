# ADR-004 — Operator moderation without automatic publishing

Status: **proposed candidate; no Access deployment or privacy approval claimed.**

## Context
Public suggestions are stored in D1 pending review. The Community Hub needed an authenticated staff workflow before any moderated submissions are activated. This must not turn unverified claims or event dates into public content, and GitHub branch approval remains human-only.

## Alternatives
- Public-facing admin page backed by a shared password/API key: rejected (shared credentials, poor revocation and weak audit).
- Direct API write to `hub/hub.json`/GitHub on reviewer button: rejected (allows accidental public trust claims; conflates review with publication).
- Cloudflare Access JWT-bound, allowlisted review-only API with separate GitHub editorial publication: **selected** for initial deployment alignment and least authority.

## Decision
Create `/operator/` as a premium responsive editor surface with explicit confirmation for each change. Add `GET/POST /api/operator/suggestions` guarded by JWT cryptographic verification (team issuer and Access audience), approved editor email list, HTTPS same-origin POST, D1 binding, `HUB_OPERATOR_ACTIVE` flag. Add migration 0003 recording editor review note, identity, timestamp and an append-only transition audit record. Transitions are pending→approved/rejected only, with atomic batch and conflict feedback. 

Approval is **only** an internal triage decision. Site content remains generated exclusively from the checked-in source-controlled data and requires separate human review and authorization. Zero public changes from an API review click. Secrets never ship to the browser. The site does not try to implement its own identity provider.

## Limitations and risks
- Production-equivalent Access JWT, D1 transaction behavior, privacy policy, accessibility, WAF and deployment smoke remain blocking gates.
- Auditor/operator identities and submitted notes can be personal data; define retention, subject correction/removal and access logging policy before real collection.
- Operator access must be protected in Cloudflare Access for both static operator UI and API on every hostname. JWT verification is defence-in-depth; do not depend on concealment or `robots.txt`.
- No reviewed suggestion is ever auto-promoted to certified status; no religious or food-safety ruling or certification implied.
