# ADR-001 — UX-first lean static Cloudflare Pages foundation

Date: 2026-10-15. Status: **proposed; provisional implementation candidate**.

**Context:** Fresh marketing destination, three concept products, education and a pre-launch email list, Cloudflare hosting, no approved commerce data. Strong desire to reuse mature UI where warranted and build premium UX ahead of the backend.

**Alternatives:** (A) React + Vite + Watermelon UI registry / shadcn blocks, (B) Astro with Islands, (C) semantic HTML/CSS/vanilla JS and Cloudflare Pages Functions, (D) managed commerce/CMS (Shopify etc.).

**Provisional choice: C for launch candidate.** Interactive behavior is modest and doesn't require runtime hydration; no paid services or third-party UI libraries. Native `dialog`, `details`, buttons and label/input semantics are reused instead of custom interaction primitives. Use responsive CSS tokens and a small JavaScript controller. This prioritizes loading speed, dependency minimization and Cloudflare compatibility while enabling visual creativity. Need human design review regardless of tooling.

**Reusable components policy:** Before H3/H4 and any complex component additions, evaluate current [Watermelon UI](https://ui.watermelon.sh/), shadcn/ui, Radix and accessible component options for license, visual fit, mobile, keyboard behavior, maintenance and design consistency. Do not copy full dashboard templates into a marketing site. React may be introduced when real cart/account/admin state requires it.

**Backend:** Cloudflare Pages Functions + D1 + Turnstile to support legitimate list subscription; does not send emails or process payments. D1+Turnstile bindings fail closed. Production release and resource creation require owner approval. No third-party AI model required.

**Risks/reconsideration:** Need operator content workflow, fast product catalogue updates and lawful email lifecycle. Evaluate CMS and commerce platforms before live transactions. Avoid architectural sunk-cost commitment from this thin static launch.
