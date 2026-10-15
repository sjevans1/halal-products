# Tayyib Halal — premium launch-stage website

**Status:** UX-first implementation candidate. **Do not interpret this as an operational e-commerce website or certified product catalogue.** No user merge or Cloudflare production deployment authorized yet.

Designed for the Jamaican halal market and anyone curious about wholesome, intentional living. The site's branding is based on the supplied Tayyib Halal / Sahqaf product concept visuals. AI-produced product and food photographs are **illustrative concepts**, not proof of production, stock, ingredient/certification status or halal accreditation.

## Start locally

Node 22+ is used for tests. Static website has **no third-party runtime or build dependencies**. Node 22 generates catalogue pages from structured data:

```bash
npm run check
npm run build  # also regenerates all product and curated-edit pages
python3 -m http.server 8787 --directory public
# visit http://localhost:8787
```

When served by a plain file server the email signup is intentionally disabled because Pages Functions are not running. To test the actual Cloudflare Functions workflow, install Wrangler separately in an approved development environment and run `npx wrangler pages dev public` with D1 binding and Turnstile settings configured.

## Cloudflare Pages first launch (Git integration)

1. Have the brand owner approve this candidate and merge it intentionally. Connect this GitHub repository to **Workers & Pages → Create → Pages → Connect to Git**, using the approved branch settings. Site name suggestion: `tayyib-halal` (subject to availability), initial address `*.pages.dev`.
2. Framework preset: **None**; root directory: repository root; build command: **`npm run build`**; build output directory: **`public`**. The `functions/` directory must remain at repository root (Cloudflare discovers Pages Functions).
3. Deploy the preview and verify navigation, product imagery, browser dialogs, headers and mobile layouts. Avoid enabling automatic production deployment until the first human-approved release. Cloudflare Pages supports branch preview deployments; configure branch controls deliberately.
4. Registration is **fail-closed**. To activate after owner/legal/privacy signoff, create a D1 database (example `tayyib-waitlist`); apply `migrations/0001_waitlist.sql`; bind it to the Pages project as `WAITLIST_DB`. Create a Cloudflare Turnstile widget for the real Pages host, set plain env var `TURNSTILE_SITE_KEY` and **secret** `TURNSTILE_SECRET` in Cloudflare project settings. After the legal/privacy owner signs off, deliberately set `WAITLIST_ACTIVE=true` and redeploy; verify real requests. Do **not** commit secrets. Configure WAF/rate limits for the endpoint and an operational process for email opt-out/deletion.
5. Before actually capturing personal information, replace the draft privacy notice with an approved policy, verified legal entity/controller, contact, retention and opt-out procedure, and confirm commercial terms. Until an authorized operator deliberately sets `WAITLIST_ACTIVE=true` with the required bindings, `/api/config` returns `enabled:false` and the form stays disabled. No outbound email system is included.
6. Once domain and socials are purchased and authenticated, update links, metadata, social preview imagery, contact and sitemap; do not invent handles or domains. Add a consent-aware analytics strategy if required.

For D1 migration via Wrangler once a database exists (replace DB identifier only after approved environment setup):

```bash
npx wrangler d1 execute tayyib-waitlist --remote --file=migrations/0001_waitlist.sql
```

Cloudflare reference: [Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) and [Pages D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/).

## Structure

- `catalog/catalog.json`: authoritative product and curated-edit content with validation and relationship data.
- `scripts/build-catalog.mjs`: dependency-free generator for homepage product/collection cards and static product/collection landing pages.
- `public/index.html`, `styles.css`, `catalog.css`, `app.js`: branded responsive experience and lightweight interactions.
- `public/products/*/index.html`, `public/collections/*/index.html`: generated, human-reviewable static pages with first-party URLs.
- `public/catalog-data.js`: generated browser-side catalogue data; do not manually edit.
- `public/assets/*.webp`: optimized first-party product and recipe concept imagery; packaging text and claims are illustrative and may be inaccurate.
- `public/privacy.html`: preliminary notice to be finalized before signup enablement.
- `functions/api/config.js`, `subscribe.js`: fail-closed launch-list API (D1 + Turnstile).
- `migrations/0001_waitlist.sql`: D1 schema.
- `docs/PLAN.md`, `docs/ACCEPTANCE.md`, `docs/QUALITY_PROFILE.md`, `docs/decisions/ADR-001-frontend-and-deployment.md`: OpenJM framework planning and gating records.
- `.dev/framework.lock`: pinned OpenJM Development Framework version and commit.

## Commercial decisions still open

Legal entity/mark ownership, supplier list, halal certifier evidence, verified SKUs/ingredients/nutrition/pack weights, JMD prices, import/food safety obligations, retail/distribution model, order/fulfillment/payment model, contact information, email-provider/unsubscribe and privacy approvals. **No checkout is implemented by design.**

Human review is required before merging a feature branch or making this website publicly accessible to real customers. The GitHub repo remains source of truth; no changes to other OpenJM repos are needed for this initial release.

## Catalogue maintenance and design system

The **single source of product truth** is `catalog/catalog.json`. Add a product, its WebP concept asset, a verified description, and related IDs; run `npm run build` to regenerate the homepage cards and the dedicated SEO-friendly product page. Curated edits use the same product IDs and are not independently inventoried or sold. Every concept/detail has explicit unverified status, and individual pages are `noindex` until approved business, halal, ingredient and food-safety evidence exists.

Shared product cards, curated-edit cards, page scaffolding, responsive grids and interaction states are built with first-party accessible HTML and CSS components. The Watermelon UI React registry was considered as a reusable design source, but is **not installed**: importing React/Tailwind just for this lightweight public catalogue would increase runtime/build complexity without delivering necessary functionality. Reassess reusable Watermelon components before a commerce/admin build; confirm current license and component accessibility then. No Watermelon code was copied into this build.

Generated product imagery is **illustrative**, including fictional details rendered on packaging. **Do not print or distribute packaging or treat on-art certification/health/ingredient claims as verified.** Commercial packaging needs a fresh design/legal/food-safety/halal review; use final supplier-controlled photography for sales. The site and code intentionally avoid prices, cart, checkout and inventory.

### Verification workflow

`npm run check` regenerates the catalogue pages and validates data, routes, imagery, source boundaries and signup failure modes. `python browser-check.py` exercises Chromium rendering and interactions in a contained local harness (not a real Cloudflare production test) and generates review screenshots at four breakpoints. Approve candidate artwork and page experience independently before merge; Cloudflare deployment, genuine user signup and food sales are all separate release gates.

## Community Hub expansion (stacked candidate)

The product website also includes a source-aware halal lifestyle and community resource hub. This package is layered on top of the original catalogue candidate, and is intended to be reviewed in a **separate stacked pull request**.

Public routes: `/discover/` (15 source-referenced mosque/community entries with searchable parish/category filters), `/community/`, `/learn/` (4 sourced guides), `/kitchen/` (3 illustrated interactive recipes and shopping list), `/events/` (approved-only event calendar / Ramadan resources), `/partners/` (future partnerships with certification-integrity boundaries).

- Edit `hub/hub.json` for public resource, guide, recipe and event data. `npm run build` runs both the original catalogue generator and `scripts/build-hub.mjs`. **Do not hand-edit generated hub pages or `public/hub-data.js`.**
- Record every directory source and last-checked date. The seeded mosque entries are *source-listed*, **not verified by Tayyib**; locations, service times and contacts may be stale. The directory currently has **no approved certified food businesses**. No event appears without an approved organizer source.
- The moderated suggestions form is **disabled by default** and requires `HUB_SUBMISSIONS_ACTIVE=true`, `WAITLIST_DB` D1 binding, `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET`. Apply `migrations/0002_hub_suggestions.sql` before enabling. No visitor account or provider admin interface is implied.
- Review proposed entries through the source-controlled content workflow; D1 pending submissions are not promoted automatically. Example pending queue inspection by an *authorized operator* only:

```bash
npx wrangler d1 execute tayyib-waitlist --remote --command="SELECT id,kind,title,source_url,created_at FROM hub_suggestions WHERE review_status='pending' ORDER BY created_at ASC LIMIT 50"
```

  Do not expose this query through public Pages Functions. Review source authenticity, rights, freshness and necessary permissions, submit an approved JSON change for independent review, then disposition the D1 queue according to the approved retention policy. **Do not enable collection until an accountable privacy/controller/operator has approved retention, rate controls and corrections/removals.**

- Test local behavior with `npm run check` and, where Chromium/Playwright are available, `python browser-hub-check.py`. This is simulated Pages behavior; actual live Cloudflare preview and D1/Turnstile integration remain release gates.
- See `docs/PLAN.md` section 9 and ADR-003 for future waves: independently verified food business records, content moderation UI, community event partnerships, supplier inventory, JMD checkout and wholesale services. Do not treat planned work as already operational.

## Editorial operator candidate (HUB-09)

A separate **unactivated** staff workspace now exists at `/operator/`, backed by `/api/operator/suggestions`. This allows authenticated, explicitly allowlisted staff to review a bounded queue of visitor-submitted suggestions **without granting any ability to publish or certify content**. Content publication still requires a reviewed change to `hub/hub.json` and deployment approval. The operator dashboard has no public navigation entry and is marked noindex; hiding the route is not the security boundary.

See [`docs/OPERATOR_REVIEW_RUNBOOK.md`](docs/OPERATOR_REVIEW_RUNBOOK.md) and [`docs/decisions/ADR-004-operator-review-boundary.md`](docs/decisions/ADR-004-operator-review-boundary.md). Before activation, provision and test Cloudflare Zero Trust Access protection over both operator UI and API, `HUB_OPERATOR_TEAM_DOMAIN`, `HUB_OPERATOR_AUD`, `HUB_OPERATOR_EMAILS`, `HUB_OPERATOR_ACTIVE=true`, D1 `WAITLIST_DB` and reviewed migration `0003_operator_moderation.sql`. Independent privacy, rate limits and real Cloudflare integration remain required. Default is 503/deny. Never trust browser-supplied identities or enable the public suggestions API by implication.

Local operator UI mock journeys: `python browser-operator-check.py`. Node security/transition tests are included in `npm run check`. Neither uses live Cloudflare credentials, Access or D1.

## TRUST-01 — Private evidence and supplier provenance preparation

The next development package adds a **private**, Cloudflare Access-governed `/operator/trust/` workspace with baseline subject records, evidence/expiry tracking, a two-role editor/verifier workflow, status filters and immutable case history. All five product concepts and all 15 public-source community records begin **unverified** or **source-listed only**. No public certification badges or supply claims are generated.

- Source data: `trust/registry.json`, validated against `catalog/catalog.json` and `hub/hub.json` by `scripts/build-trust.mjs`.
- Forward-only D1 migrations: `0004_trust_register.sql`, `0005_trust_subjects.sql`. Do not rewrite old migrations; create a new seed migration for new subjects.
- Access-controlled API: `/api/operator/trust`. Rejects all requests unless `HUB_TRUST_ACTIVE=true` **and** existing `HUB_OPERATOR_ACTIVE`, Access JWT, editor allowlist, D1 bindings are valid. Approval/rejection also requires the separate `HUB_VERIFIER_EMAILS` role and a reviewer different from the submitter.
- Review states, due dates, conflict detection, audit-history view and database-enforced triggers documented in `docs/TRUST_VERIFICATION_RUNBOOK.md` and ADR-005. Publication remains an independent human GitHub release decision.
- Local validation: `npm run check` (includes real SQLite invariant assertions), `python3 browser-trust-check.py`, plus existing hub/operator/catalogue regression scripts. These are simulations: **no actual Cloudflare Access or live database has been configured**.
- **Infrastructure handoff to Hermes only at final launch acceptance**. No Cloudflare preview, D1 migration or operator activation is authorized by this development-only candidate.

## LEARN-01 — Ingredient & label reading room

The Learning Centre now links to `/learn/ingredients/`, a 14-topic source-linked educational explainer with searchable categories, supplier questions and a five-part checklist. It intentionally does **not** classify an entire food product as halal from ingredient keywords.

- Editorial source: `hub/ingredient-guide.json` (with Jamaica Halal Council published Halal Food General Guide cited).
- Generated page: `public/learn/ingredients/index.html`, built by `scripts/build-ingredients.mjs`; assets: `public/ingredients.js`, `ingredients.css`, `ingredients-data.js`.
- Browser regression: `python3 browser-ingredients-check.py` at 1440/768/390/320; native checks: `tests/ingredients.test.js` via `npm run check`.
- Human expert/content review and Cloudflare deployment acceptance outstanding; see `docs/INGREDIENT_GUIDE_EDITORIAL_POLICY.md` and ADR-006.

## FRESH-01 — Community source currency

Use `npm run audit:content` to check the 15 existing source-referenced community listings and the current editorial/commerce data for dates, overdue source reviews, unsupported certification claims and unapproved events. For machine-readable output use `node scripts/content-audit.mjs --json` or `--out /tmp/tayyib-audit.json`. The script does not contact any external site.

The public directory labels source dates as **Source viewed** and provides an age warning after 90/180 days, without claiming that a venue is closed or that it is certified. Editors must review the real source and publish amendments via a separate human-reviewed GitHub PR. See `docs/SOURCE_FRESHNESS_OPERATIONS.md` and ADR-007. Automated reminders, publisher accounts, external monitoring and Cloudflare deployment remain deferred.

## EDIT-01 private editorial workspace (draft candidate)

The source adds **`/operator/editorial/`**, an Access-gated private CMS workflow for writing source-referenced community guides, directory corrections, event proposals and recipes. Draft edits, independent reviewer decisions and publication packet export are explicit, versioned and audit-logged; none change public pages automatically. Staff author/reviewer identities and D1 schema are not configured until Hermes' final Cloudflare acceptance wave.

- New migration: `migrations/0006_editorial_workflow.sql` (after the previous five).
- Server: `functions/api/operator/content.js` and `src/editorial-policy.js`; requires existing Access operator auth and separate `HUB_EDITORIAL_ACTIVE=true` + `HUB_EDITORIAL_REVIEWERS` configuration before anything can be used live.
- UX: native responsive private studio at `public/operator/editorial/`, linked from the other operator pages. No React/Watermelon package needed for this phase.
- QA: `npm run check` and `python3 browser-editorial-check.py` (browser is **mocked**).
- Governance, release and Hermes handoff: `docs/EDITORIAL_STUDIO_RUNBOOK.md` and `docs/decisions/ADR-008-editorial-source-controlled-publication.md`.

**No PR in the existing stack has been merged and no Cloudflare deployment has been initiated by this work.**

## Jamaica-first community contribution experience (COMM-01)

The public directory now has 15 generated `/places/<listing-id>/` pages. Each shows the original public reference, **source viewed** date (not verified opening), questions to confirm directly and links to suggest a specific correction. A consolidated `/contribute/` page guides residents, learners, mosque/community organizers and business representatives through source-backed corrections, new places and announcements. All submitted suggestions remain **pending** under the existing API; no new accounts, ownership claims or certificate grants are introduced. The source is generated with `npm run build` and guarded by native tests. The "/events" and "/partners" surfaces now link to the single form.

`python3 browser-steward-check.py` exercises desktop/tablet/mobile/320px workflows using mocked requests, plus client-side validations and simulated server failures/success. The contribution journey is deliberately disabled until Hermes configures and validates the later Cloudflare release gate. See `docs/JAMAICA_UX_JOURNEYS.md`, `docs/COMMUNITY_STEWARDSHIP_RUNBOOK.md` and ADR-009. Human religious and Jamaica community usability review still required.
