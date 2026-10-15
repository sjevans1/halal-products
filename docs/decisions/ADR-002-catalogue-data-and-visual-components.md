# ADR-002 — Governed catalogue data and first-party visual components

Status: **proposed / UX implementation candidate**; human review pending.

## Context
The initial site hard-coded a three-item catalogue and hydrated images from base64 text. The desired brand needs growing product families, ingredient/supplier verification and high-quality food photography without introducing unnecessary dependencies or claiming operational commerce.

## Options
1. **First-party HTML/CSS plus a checked-in data source and static generator**: very lightweight Cloudflare Pages output, simple HTML semantics and SEO-friendly paths, easy audit of claims.
2. **Watermelon UI React component registry / shadcn + Vite + Tailwind**: strong reusable patterns for more elaborate authenticated admin, cart and interactive commerce, but extra build/runtime/support burden at present. The registry's compatibility and current license must be verified before any copying.
3. **Full commerce engine**: inventory/pricing/payments benefit eventually, but premature given that products are still unverified concepts.

## Decision
Choose option 1 for the launch-stage editorial catalogue. Keep a single structured `catalog/catalog.json`, validate relationships, generate product and collection pages with `scripts/build-catalog.mjs`, preserve reusable CSS patterns and ship compressed first-party WebP assets. Native dialog, buttons and anchor navigation remain. Build does not connect to supplier, price or payment systems. Watermelon UI is a reference for potential later React-enabled commerce/admin, not a dependency here.

## Consequences and gates
The contents of `public/products/` and `public/collections/` are generated artefacts; committed output and source must be synchronized through `npm run build`. New product claims or art require human factual review. Current generated packaging visuals are **illustrative and not cleared for sale or certification claims**. A later ADR is required for inventory, commerce or a framework conversion.
