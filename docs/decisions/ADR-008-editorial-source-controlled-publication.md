# ADR-008 — Governed editorial workflow with source-controlled publishing

Status: **implementation candidate / independent security and operator review pending**

## Context
The Community Hub can collect visitor submissions and track internal trust evidence, but it needs a coherent staff authoring/revision workflow for sourced guides, directory updates, recipes and events. The public website currently uses deterministic source-control generation; auto-publishing D1 entries would undermine the established certification/source and release gates.

## Decision
Use the existing first-party HTML/CSS interface and Cloudflare Access-verified operator API, with D1 drafts and append-only revision audit. Implement separate editor and independent reviewer lists. Introduce a `draft → submitted → approved | changes_requested | rejected` workflow with optimistic versions. `changes_requested → draft` requires an author revision; submitted/approved entries are immutable. SQLite triggers enforce versioning, transition bounds, anti-self-approval and audit history against application mistakes. No public user account system, no third-party CMS SDK, no WYSIWYG HTML or direct publish API is added.

Export structured **publication packets** from accepted proposals for the human source-PR review. `approved` means only an internal editorial review outcome, not certification, proof of source validity, event organizer consent or permission to release. Human-reviewed `hub/hub.json` and generated static pages stay canonical public truth.

## Deferred
- Live Cloudflare provisioning and Access/D1 integration are reserved for Hermes.
- Rich text, translations, photo/media pipeline, scheduled publication, delegated mosque steward accounts, end-to-end real-world provenance checks and multi-author reconciliation are future scoped packages.
- Watermelon UI was not imported to avoid React or Tailwind for this lean operator surface. Reassess reusable accessible components before larger authenticated workflows.

## Consequences
No preview of untrusted user-generated HTML; safe plain-text DOM, no publicly exposed approval state. Authors cannot self-review. Real staff identity, data retention, permissions, source quality and production operations still need approval. New migration `0006` must be applied after the prior stack; no merge/release without exact-head review.
