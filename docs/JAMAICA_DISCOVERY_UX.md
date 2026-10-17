# DISC-01: Jamaica-first directory exploration

**Review state:** Development candidate. Not a real-time venue locator, certification register, restaurant endorsement, or availability service.

## Human journeys and product contract

1. **A Jamaican Muslim looking for somewhere to pray:** Open Find Halal, choose "Find a mosque" or select a parish, inspect a listing, read its *source viewed* date, confirm the address and current prayer/visitor arrangements with the organization before travelling. Do not infer prayer times or opening hours.
2. **A resident seeking community resources:** Choose "Meet the community", select a parish if useful and open the original public source. No email, account or declaration of religion is required.
3. **A Jamaican exploring halal food or the lifestyle:** Choose "New to halal?" for a guided learning path. When seeking restaurants, see an explicit notice that there are currently zero independently verified dining businesses, rather than an invented recommendation or certification badge.
4. **A visitor sharing information with someone else:** Apply parish, category, and optional search text; use "Copy search link". When clipboard permission is unavailable, a selectable read-only link appears. URL filtering uses browser history only and does not call an API or track location.

## UX and editorial principles

- Curated shortcuts use the **existing canonical `hub/hub.json`** and display real counts derived at build time. Parishes with no listed references are never presented as if Tayyib had coverage there. "Islandwide" is a directory classification, not a confirmed physical location.
- No new places, coordinates, routing metrics, verified restaurants, opening hours, service times, events or contact details are fabricated. A source-listed record is **not** Tayyib's independent confirmation or proof of halal certification.
- Category and parish shortcut controls are accessible native buttons with `aria-pressed` feedback. Search, select filters, a clear control, live result count and explicit empty state remain available and keyboard usable.
- Every modification stays within the source-controlled public static build. It does not activate Cloudflare Pages Functions, visitor collection, payments or an authenticated operator surface.
- The design reuses the existing site typefaces, emerald/ivory palette, source notices and links. It brings user choice ahead of the underlying technical filter panel.
- URLs support optional `q` (up to 80 characters), `kind`, and `parish`, validated against existing published options. URL state is best-effort on browsers that restrict history operations, and the visible filters always remain usable.

## Build and acceptance

- Generator: `scripts/build-hub.mjs`, which inserts the discovery wayfinder into generated `public/discover/index.html` without touching the canonical listing data.
- Assets: `public/discover-explore.css` and `public/discover-explore.js` loaded **only** by Discover. No new dependencies.
- Run `npm run check`, which now includes `tests/discovery.test.js`, then `python3 browser-discovery-check.py` and `python3 browser-hub-check.py` where Chromium is available.
- Browser checks cover 1440, 768, 390 and 320 px and simulate the real interactive elements. A controlled in-memory document is used because this execution environment blocks navigation to synthetic local hostnames; this **is not** a real Cloudflare network acceptance test.
- Hermes must deploy **only after separate human authorization**, rebuild and verify the sanitized static client-review artifact (PR #11), test without credentials against the actual hosted URL, and keep the protected internal preview and live operating features unchanged.

## Release gates

Before presenting directory information as verified: contact the named organization, check source date and actual details, document authority and evidence, obtain editorial signoff, and issue a separate approved content PR. Local community and accessibility testing with Jamaican Muslims and people new to halal remains necessary. Paid listings must be clearly labelled and never imply certification.
