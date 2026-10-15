# Tayyib Halal — public source freshness and editorial follow-up (FRESH-01)

**Prelaunch preparation, no Cloudflare dependency.** Public directory information points to original source listings; no source date constitutes an independent site inspection, business endorsement, halal certification or confirmation of opening or prayer hours.

## Why this exists

A community directory is useful only while its information remains maintainable. The original source may change or disappear without warning. Do not represent a source viewed months ago as freshly confirmed. A passing website build does not prove that an organization, mosque, food business or certifier operates today.

## States and thresholds

| Age of source-viewing date | UI state | Operator action |
|---|---|---|
| 0–90 days | Source recently viewed | Continue the routine editorial cadence; no verified label implied |
| 91–180 days | Source recheck suggested | Follow the original source and seek current owner/organizer confirmation before adding hours/events/halal claims |
| More than 180 days | Older source — confirm directly | Prioritize rechecking, contact original source, update approved content via separate human-reviewed GitHub PR or remove inaccurate material |
| Future or invalid date | Blocking error | Correct source metadata before building/publishing |
| Claimed certified record missing support or with expired certificate | Blocking error | Prevent release; never show a current certificate claim without independent evidence |

Thresholds are **editorial follow-up policies**, not proof a mosque closed or that a business is no longer halal. Our current directory has 15 source-listed organizations/mosque locations and no separately verified restaurant or certifier listing. Existing product art is illustrative; no product is commercially certified by software.

## Editor workflow

1. Run `npm run audit:content` (or `node scripts/content-audit.mjs --json`, optionally `--out /tmp/tayyib-content-audit.json`). It reads only local checked-in files; it does **not** crawl websites or update public data automatically.
2. Investigate warnings individually by opening the cited original public source, contacting the legitimate venue/organization when appropriate and documenting the result. Update `hub/hub.json`'s `sourceCheckedAt` only for a **genuine new viewing of the source**, not merely to silence a warning.
3. If information has changed, propose an accurate source-backed amendment in a reviewed PR. Do not treat an approved visitor submission as true without verification.
4. Never publish an event without organizer-approved primary source, or a halal certification without valid issuer/facility/product scope and specialist oversight.
5. Re-run source generation, native tests, Chromium journeys and content audit before release. Cloudflare final staging and deploy checks remain reserved for Hermes after owner approval.

## Safety and service design

- The public page labels `sourceCheckedAt` as **Source viewed**, never **last verified by Tayyib**.
- The browser computes a warning from elapsed time. Older references are not automatically removed, since age alone does not establish factual error. Source-specific corrections or takedown require reviewed changes.
- A claimed certified listing whose certificate expires blocks a new static build. The editor must also account for deployed pages between builds (future automated freshness/scheduled redeployment plan remains outstanding).
- Audit output contains public listing identifiers, display names, parishes, source dates and classification. It does not store IP addresses, private cert PDFs or operator identity. No internet call is made during an audit.
- This package does **not** automatically schedule background monitoring. Hermes may later configure reporting/alerts with reasonable cadence and release governance after the final Cloudflare integration.
