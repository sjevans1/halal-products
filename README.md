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
