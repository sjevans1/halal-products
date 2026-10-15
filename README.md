# Tayyib Halal — premium launch-stage website

**Status:** UX-first implementation candidate. **Do not interpret this as an operational e-commerce website or certified product catalogue.** No user merge or Cloudflare production deployment authorized yet.

Designed for the Jamaican halal market and anyone curious about wholesome, intentional living. The site's branding is based on the supplied Tayyib Halal / Sahqaf product concept visuals. Product photos are **concepts**, not proof of production, stock, ingredient/certification status or halal accreditation.

## Start locally

Node 22+ is used for tests. Static website has **no install/build dependencies**:

```bash
npm run check
python3 -m http.server 8787 --directory public
# visit http://localhost:8787
```

When served by a plain file server the email signup is intentionally disabled because Pages Functions are not running. To test the actual Cloudflare Functions workflow, install Wrangler separately in an approved development environment and run `npx wrangler pages dev public` with D1 binding and Turnstile settings configured.

## Cloudflare Pages first launch (Git integration)

1. Have the brand owner approve this candidate and merge it intentionally. Connect this GitHub repository to **Workers & Pages → Create → Pages → Connect to Git**, using the approved branch settings. Site name suggestion: `tayyib-halal` (subject to availability), initial address `*.pages.dev`.
2. Framework preset: **None**; root directory: repository root; build command: **leave empty**; build output directory: **`public`**. The `functions/` directory must remain at repository root (Cloudflare discovers Pages Functions).
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

- `public/index.html`, `styles.css`, `app.js`: UX and interactive discovery.
- `public/assets/*.b64`: optimized imagery derived from supplied mockups; loaded as local browser data URLs. Packaging images remain draft/concept.
- `public/privacy.html`: preliminary notice to be finalized before signup enablement.
- `functions/api/config.js`, `subscribe.js`: fail-closed launch-list API (D1 + Turnstile).
- `migrations/0001_waitlist.sql`: D1 schema.
- `docs/PLAN.md`, `docs/ACCEPTANCE.md`, `docs/QUALITY_PROFILE.md`, `docs/decisions/ADR-001-frontend-and-deployment.md`: OpenJM framework planning and gating records.
- `.dev/framework.lock`: pinned OpenJM Development Framework version and commit.

## Commercial decisions still open

Legal entity/mark ownership, supplier list, halal certifier evidence, verified SKUs/ingredients/nutrition/pack weights, JMD prices, import/food safety obligations, retail/distribution model, order/fulfillment/payment model, contact information, email-provider/unsubscribe and privacy approvals. **No checkout is implemented by design.**

Human review is required before merging a feature branch or making this website publicly accessible to real customers. The GitHub repo remains source of truth; no changes to other OpenJM repos are needed for this initial release.
