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

## TRUST-01 — Internal evidence acceptance matrix

| Tier | Gate | Evidence / state |
|---|---|---|
| FAST | 20 initial unverified/source-listed records, referential integrity, documented source origin; syntax, negative authorization, URL/date/claim boundary, no-publication; only forward-only seed migrations | Native tests and `scripts/build-trust.mjs` |
| STANDARD | Real SQLite schema/trigger assertions: atomic automatic audit, self-review denial, state machine, evidence immutability, version conflict, dispute; desktop/tablet/mobile/320 UI controls, explicit confirmation | `tests/trust-sqlite-check.py`, `browser-trust-check.py`; external WCAG review not complete |
| FULL | Independent security and UX review, real Cloudflare Access JWT/JWKS in a staging deployment, exact-head D1 migration and audit rollback, confidentiality/privacy/retention, hostname/CSRF verification, no public disclosure | **Deferred to Hermes final Cloudflare acceptance** |
| ACTIVATION | Editors and independent verifiers nominated, documented issuer-check method and dispute/takedown policy, signed-off retention and audit exports, `HUB_TRUST_ACTIVE=true` only after security approval | **Not authorized** |
| PUBLICATION | Independent source/claim assessment, qualified food-safety/halal/religious signoff where relevant, human-approved content PR and production release decision | **No publication path in this package** |

Internal `accepted` is never a halal accreditation, even while a certificate is valid. The case status is for internal evidence workflow only; `review_due` or expired `valid_until` causes a derived recheck flag without mutating or hiding audit history. A URL alone is not proof of the issuer or of current halal status.

## LEARN-01 — Label-reading guide

| Gate | Acceptance evidence |
|---|---|
| FAST | 14 distinct sourced topics, four validated categories, generated standalone page, source link and non-classification disclaimers; no checkout, tracking, invented certification or user upload |
| STANDARD | Search, category filters, native question reveals, accessible status and checklist, honest no-results, copy fallback, 1440/768/390/320 browser rendering without JS errors or overflow |
| FULL | Independently verify religious/food science wording, Arabic, accessibility/contrast, source rights and community comprehension; real Pages deploy smoke delegated to Hermes at final acceptance |
| RELEASE | Human content-owner approval, verified source policy, no misleading binary product results or certifier endorsement, no public indexing before product/company legal review |

## FRESH-01 — Source audit & display

- FAST: all public source dates are valid and non-future; no unapproved events or expired certification claims; `npm run audit:content` reports dated review tasks but never auto-publishes.
- STANDARD: source reference is explicitly labelled as viewed, not independently verified; old records show a warning after 90 days, with an elevated warning after 180. Directory filtering, keyboard operation, empty states and responsive 320/390/768/1440 browser tests remain green.
- FULL: content owners independently verify significant public listings, source permissions, certification and event claims; actual Pages branch preview, security/URL headers and scheduled freshness approach delegated to Hermes at final infrastructure phase.
- RELEASE: operator logs genuine source visits, commits reviewed updates, obtains community/legal owner approval and manages takedown procedure. Stale data warning is a recheck task, not proof a business is closed.

## EDIT-01 editorial authoring and independent approval

| Tier | Required evidence | State |
|---|---|---|
| FAST | Static Node checks; fail-closed flags, verified operator JWT and reviewer allowlist, same-origin POST, input/date/source bounds, reviewer separation, CAS update and SQL trigger/audit invariants | Implemented local tests |
| STANDARD | Real Chromium mock-browser review at 1440/768/390/320, create/edit, confirmation cancel, independent review, workflow status, audit visibility, accessible keyboard semantics and no overflow | Local browser script; independent manual review pending |
| FULL | Real Cloudflare Access JWT/Zero Trust application, D1 migration, concurrency/integrity, backup/restore, privacy, security/CSRF, accessibility audit, real branch preview and smoke | Deferred to Hermes |
| RELEASE | Owner approves the exact-head PR stack and the separate public content PR; accepted editorial entries are not automatically published or verified | NOT AUTHORIZED |

No status of an internal proposal is proof that a company, mosque, product or religious event has been independently verified. Public content must have a separate source-controlled review and release.

## COMM-01 — Jamaica-first stewardship journeys

- **FAST:** deterministic build of 15 detail pages, escaped source data, correct non-verified status, stable public IDs, one contribution form with four intent choices, no indexable claim/certification, preserved fail-closed backend and no new sensitive-data collection.
- **STANDARD:** Chromium 1440/768/390/320 journeys for directory → place → contextual correction, source prefill, choice switching, no overflow or JS errors; API disabled state, mocked verified challenge, validation error, rejected request and successful **pending** submission. Existing catalogue/hub/ingredient/operator/trust/editorial browser regressions must pass.
- **FULL / external:** subject-matter verification of religious terminology and source authority, moderated usability tests with Jamaican Muslim residents and learners, real WCAG keyboard and assistive-technology review, privacy/legal basis and abuse review, exact-head Cloudflare preview when Hermes starts final deployment.
- **RELEASE:** no public directory edits without independently checked source and human publication PR; no claim of identity, approval or certification through an anonymous suggestion. Public submissions and production remain closed until explicit approval and real infrastructure acceptance.

## COMM-02 representative permissions acceptance

- FAST: approved existing ID; valid short-lived signed Access application identity; bounded source and note; independent operator role; no staff-audience reuse by representative; D1 grant revocation and audit immutability; internal review never publishes.
- STANDARD: operator grant/revocation requires explicit confirmation, representative needs one clear update form, no JS error or horizontal overflow at 320/390/768/1440, and error/disabled states stay legible.
- FULL: Cloudflare real Access policy protects *both* staff and representative HTML + APIs; deployed migrations 0001–0008, record minimization/privacy, revocation test, independent human organizational authority verification, WCAG keyboard/screen-reader walk-through, source and halal review. **Not yet accepted; reserved for Hermes at final stage.**

## DISC-01: Jamaica-first discovery candidate

Native: verify published parish/category counts, browse intents, no invented restaurants, source-status integrity and controlled URL state. Browser: 1440/768/390/320 filter chips, keyboard-accessible clear, share fallback, source labelling and honest empty states. Required pre-release: independent Jamaica-based usability feedback, mobile/assistive-technology spot checks, and Hermes verification against an authorized sanitized public client-review deployment. No verified place, certified business, geolocation, or production approval is inferred.

## A11Y-01 — Premium UX readability acceptance

Acceptance gates: token tests, measured Chromium text contrast (4.5:1), keyboard focus, menu semantics, reduced motion, 320/390/1440 horizontal overflow checks, existing regression suites and independent visual review. A live Cloudflare accessibility sweep and assistive-technology participant review are pending. Do not assert WCAG certification on test counts alone.

### EVENT-01 scoped acceptance

- Check generated `/events/` has zero fictional events, explicit source/approval notice and four-step optional preparation checklist.
- Verify event-publication model and source audit reject missing approval, uncertain date/offset, private sources, duplicate IDs and reversed times. Expired events must not appear in upcoming results.
- Verify four breakpoints through `browser-events-check.py`, including reset/feedback, no horizontal scroll or console errors. All previous native/SQLite/content-audit tests and exact-head GitHub CI must remain green.
- Public client-review release, live submissions, halal certification and user identity features are strictly out of scope.

## SHOP-01 candidate acceptance

- `commerce/offers.json` must retain all five IDs, JMD schema, null prices/pack sizes and unconfirmed availability. Malformed or silently purchasable products fail `npm run check` via `tests/offer-policy.test.js`.
- `/plan/` links from homepage and product pages only as a concept idea list, never a cart or checkout. Verify no network calls or personal information collection.
- `python3 browser-plan-check.py` covers add/remove, 1-12 quantity, clear cancellation, unavailable clipboard, no errors and no mobile overflow across 1440/768/390/320.
- Production, client review, Cloudflare flags and merging remain independently approved gates.
