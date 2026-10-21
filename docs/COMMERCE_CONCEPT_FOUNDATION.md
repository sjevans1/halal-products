# SHOP-01: Customer meal-idea planner, not an order flow

**Scope:** Dependency-free, Jamaica-focused public concept experience. This wave introduces no payment account, reservation, supplier integration, commerce API, shipping form, customer database, or staff inventory controls. It is an intentionally bounded UX and data foundation for later verified retail operations.

## The user journey

1. A visitor explores the five existing Tayyib illustrative product concepts.
2. They open `/plan/` through a prominent catalogue link or an individual product's **Add to my idea list** link.
3. They select concepts, adjust planned quantities from 1 through 12 and review a simple list. These quantities are not units of stock or a purchase commitment.
4. They can copy a text representation; if clipboard permission fails a selected editable-looking, but `readonly`, textarea allows manual copy. Clearing the list requires explicit confirmation.
5. The list remains only in the browser's local storage, with in-memory fallback if storage is unavailable. There is no network submission or account creation. Nothing in the UI suggests a checkout or quoted price.

## The governance contract

- Source of concept pricing and availability: `commerce/offers.json`, guarded by `src/offer-policy.mjs` in `scripts/build-plan.mjs`. Every catalogue ID must match exactly one offer with `status=concept`, `availability=unconfirmed`, `priceJmd=null`, `packSize=null` and `halalEvidence=unverified`; `currency=JMD` is structural only. Attempts to claim stock, pricing, pack sizes or certified status fail the build.
- Frontend receives only bounded fields `id/name/image/status/priceJmd/availability`. It never receives wholesale prices, personal data, internal certifications or credentials.
- Scripts generate `/plan/index.html`, `plan-data.js` and link entry points in the public homepage and product pages **after** `build-catalog.mjs`. Re-running build is idempotent. Do not hand-edit generated pages.
- The plan's localStorage key is `tayyib.idea-plan.v1`. Invalid, duplicated and over-limit rows are discarded. Browser quotas, private-mode or unavailable clipboard do not break the journey. No geolocation, religiosity data or analytics events are generated.
- This is unrelated to product favorites in the existing homepage. A later UX iteration should consider whether to merge the two concepts without silently importing or changing preferences.
- Price, halal validation, stock, checkout, delivery, tax, wholesale and customer support require separate **human-approved business gates** and backend security reviews. No UI toggle can bypass this policy or enable sales.

## Acceptance

- `npm run check` including `tests/offer-policy.test.js` and existing site security/access controls.
- `python3 browser-plan-check.py` at 1440/768/390/320: product rows, add/quantity limits, remove, clear confirmation, clipboard fallback, narrow mobile layout and no JS errors.
- Manual review by Jamaican Muslim households and other people exploring halal; clear separation of browsing ideas vs real purchases.
- Real Cloudflare secure branch preview smoke, then a separately approved sanitized client-review static build, without Pages Functions or D1. No automatic public redeployment.
