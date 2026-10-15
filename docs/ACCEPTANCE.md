# Website Acceptance Contract

Status: **candidate, not yet accepted**. Applies to exact branch SHA. Approval and release remain human decisions.

## FAST

- `npm run check`: Node 22 syntax, native frontend content invariants, API failure cases, data protection tests.
- All concept imagery loaded from local repository content; no unverified external images, checkout links, domains, social accounts or fabricated certificates.
- No source secrets, migrations or operational planning exposed in static `public/` path.

## STANDARD

- Browser journeys: (1) responsive navigation, (2) collection filtering, (3) product detail, (4) favorites persist, (5) site search, (6) recipe, (7) FAQ, (8) signup in disabled state and explicit error.
- Chromium desktop 1440×900 and mobile 390×844 screenshots checked by a human for major overlaps, contrast, inconsistent spacing and missing imagery.
- Keyboard: Tab reaches controls, Esc closes dialogs, modal focus stays within dialog, visible focus indicators, screenreader labels/descriptions on essential actions.
- Responsive: 320, 390, 768, 1024, 1440 widths with no meaningful horizontal scrolling.
- Reduced-motion settings respected. No unexpectedly auto-playing visual/audio.

## FULL / activation

- Cloudflare Pages branch preview successfully served over HTTPS. Validate `_headers`, static routes, 404 behavior, Pages Functions and build output `public`.
- If activating signups, D1 migration applied, scoped D1 binding and server-side Turnstile secret configured, and `WAITLIST_ACTIVE=true` set only after approval; test real successful submission, invalid email, duplicate email, missing consent, invalid/reused challenge token, and DB outage. Verify unsubscribe and retention process. Consent/privacy/business contact approved.
- Privacy/security review, basic Lighthouse mobile + accessibility audit and product-owner walkthrough recorded at exact candidate SHA; no unsupported compliance claims.
- Launch content approved: imagery rights, halal certificates, product specs and all branded contact URLs verified. No checkout until commerce phase.
- Human authorizes merge; production deploy is a separate explicit gate. Keep records of git SHA, checks, previews, decisions, open exceptions.

## Known limitations

This is a **pre-commerce launch candidate**: no product ordering, inventory, pricing, shipping, email delivery, operator admin, search index, tracking analytics or certified halal claims. Assets are branded mockups. Signup endpoint will be unavailable until Cloudflare resources are configured. No acceptance check can substitute for actual human design and religious/food-safety verification.

## Catalogue-extension checks (CAT-01 to CAT-06)

- FAST: deterministic generator, unique product IDs, all corresponding WebP assets, 5 product routes, 3 curated-edit routes, relationships, no premature checkout and no advertised verification.
- STANDARD: review live-format (locally rendered) desktop/tablet/mobile imagery, category filters, saved products, quick look, recipe imagery, detail pages and edit pages; no image/network failure or horizontal overflow. Test 320/390/768/1440 widths.
- FULL: independent design review, production-equivalent Cloudflare Pages preview, actual browser keyboard and assistive-technology usability, provenance/right-to-use review, verified commercial product evidence before publication.
- **No commerce activation** until individually approved SKU specifications, food-safety, packaging and halal sourcing evidence exist. All concept art remains illustrative even where generated mockups include unverified labels.

## HUB Community Hub addition — acceptance matrix

| Gate | Required proof | Current expectation |
|---|---|---|
| FAST-HUB | validated source-reference directory data; distinct status semantics; no false certified badges; Node syntax; API gate failure tests; deterministic generated pages | `npm run check` |
| STANDARD-HUB | browser journeys 320/390/768/1440 (homepage, 6 hub pages, directory filters/no results, recipe serving controls, event empty state, disabled submissions), keyboard & focus plus content readability | `python browser-hub-check.py` + independent manual accessible review |
| FULL-HUB | exact-head Cloudflare Pages branch preview using `npm run build`/`public`, real HTML/JS/CSS/image loading, privacy/headers review, independent religious-content and directory source checks, community participant walkthrough | Outstanding; cannot assert before deployed evidence |
| ACTIVATION | source review by accountable editor, legal privacy controller/contact and retention approved, D1 migration, Turnstile hostname-bound live challenge, explicit `HUB_SUBMISSIONS_ACTIVE=true`, bounded abuse controls, moderation/withdrawal operations and rollback drill | Disabled until separately authorized |
| COMMERCE | supplier contracts, certifier evidence, approved food safety/labels, allergens/net weights and pricing, inventory, payments, fulfilment and returns | Deferred; no live sales promised |

Unverified or out-of-date information must be corrected or explicitly shown as pending/source-listed. Failed/absent evidence is not acceptance. Passing native/browser simulations is **not** equivalent to genuine Cloudflare deployment, live Turnstile or real D1 storage proof.

## HUB-09 operator/editorial acceptance

| Tier | Gate | State |
|---|---|---|
| FAST | Node syntax, no JWT header spoofing, JWKS signature check, issuer/audience/time/email rejection, Origin/JSON/notes bounds, atomic audit requirement, operator noindex and static output boundaries | Tested in Node simulation |
| STANDARD | Native `dialog` confirmation before any mutation, status navigation, queue rendering, clear errors, 1440/390/320 UI browser journeys, no overflow or JS errors, responsive focus/readability | Local Chromium simulated; independent WCAG review pending |
| FULL | Live Cloudflare Access policy on `/operator/*` and `/api/operator/*`, real JWTs, actual D1 migration + transactional audit, external actor denies, real preview, CSRF/abuse, privacy/retention and rollback drill | **Outstanding** |
| RELEASE | Owner approves branch merge separately from deploy; visitor suggestion intake and operator activation explicitly controlled, public publishing always via human-reviewed source-control change | **Not authorized** |
