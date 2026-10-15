# Tayyib Halal — UX-first Website and Launch Programme

Status: **Candidate implementation / awaiting human design and release approval**. Framework: OpenJM Development Framework v1.7.0 pinned at `.dev/framework.lock`. Source of truth: this repository, not another OpenJM product.

## 1. Mission, audience and outcomes

Establish a premium, inclusive Jamaican halal brand destination: discover products, learn what halal and tayyib mean, find food inspiration, and follow the brand before commercial availability. Primary audiences: Muslim families and shoppers seeking halal verification; curious general consumers; home cooks; prospective retailers/partners. Operators: brand owner/content manager and launch-list administrator. No fabricated customers, credentials or market-demand statistics.

**North star:** A visitor can understand the brand, discover its product concepts, and take a real next step in less than three minutes on mobile. The site must not imply items are already on sale or certified without verified evidence.

## 2. Brand & experience system (approval candidate)

- Palette: emerald `#103c2e`, forest `#092c22`, warm ivory `#f9f8f2`, antique gold `#b79657`; plenty of generous negative space.
- Typography: accessible system sans + editorial serif; bilingual Arabic **only where supplied / verified**; no invented translations on product labels.
- Photography: provided three draft mockup concepts, optimized and embedded in first-release assets; all product imagery identified as `CONCEPT PREVIEW`. Replace with licensed final product photography before orders open.
- Experience: sticky navigation, responsive hero, discoverable categories, save-for-later with device-local storage, product information modal, recipe cards, search, accessible FAQ and signup with explicit status.
- Reuse strategy: evaluate Watermelon UI, shadcn/ui and compatible accessible primitives in commerce phase. Stage 1 uses lightweight native controls to avoid shipping a React runtime merely for editorial interactions; documented in ADR-001.

## 3. Experience maps

| ID | Visitor goal | Golden path | Safe failure |
|---|---|---|---|
| UX-01 | Understand the brand | Hero → philosophy → halal guide | Mobile and keyboard readable; plain language |
| UX-02 | Discover products | Collection → filter → details → save | Clearly labelled preview; no price, checkout or false certification |
| UX-03 | Find meal inspiration | Table → recipe card → ingredients and steps | Dialog closes by Esc/button; no order claim |
| UX-04 | Find answers | Search → topic/product/guide; FAQ | Explicit no-result feedback |
| UX-05 | Receive launch updates | Email + consent + anti-bot challenge → server stores | Disabled until bindings and approval; actual failure feedback, no fake success |

## 4. Architecture and trust boundaries

- Standalone publicly accessible marketing site. Not OpenJM multi-tenant SaaS. Three-plane model: **not applicable**; no provider/customer admin UI invented.
- Static HTML, CSS, vanilla JavaScript shipped from `public/` to Cloudflare Pages, no client framework/runtime, no payment provider, no cookies/tracking pixels. All brand photo assets included as base64 text payloads (binary asset transport can be introduced later).
- Cloudflare Pages Functions under `functions/api/*` handle signup status and actual email submission. **Fail-closed** unless D1 database `WAITLIST_DB`, `TURNSTILE_SITE_KEY` and secret `TURNSTILE_SECRET` exist. Records consist of email and timestamps, never password/payment details. Prepared SQL prevents injection; server verifies Turnstile token.
- Private business decisions: no brand domain, verified suppliers/certifiers, actual retailer information, payment terms, fulfillment coverage, pricing, or public support contact yet. All blocked from release claims.
- Owner must approve the privacy notice, retention, responsible controller/contact and unsubscribe workflow **before signup activation**. Site may preview with signup disabled.

## 5. Packages and dependencies

| Package | Scope | Dependency | Quality gate | State |
|---|---|---|---|---|
| H0 | Brand direction, UX personas, copy & visual system | Mockups | Human design review | Draft |
| H1 | Mobile-first editorial website / product concept discovery | H0 design hypothesis | Desktop/mobile/keyboard/visual review; `npm run check` | Implemented candidate |
| H2 | Cloudflare Pages preview + email launch-list backend | H1 | Real deployed smoke, D1 + Turnstile + privacy-owner approval | Source ready; not activated |
| H3 | Catalog governance + verified halal sourcing and certification metadata | Supplier/legal verification | Negative claims and provenance checks | Planned |
| H4 | Transactional commerce, inventory, payments and fulfillment | H3 + pricing/suppliers/logistics | Security + functional + operational acceptance | Deferred |
| H5 | Domain, branded email, socials, analytics consent decisions, SEO and campaign assets | H2 approved | Brand and business sign-off | Deferred |

## 6. Important decisions and unresolved gates

- **Brand ownership**: confirm legal entity and that Tayyib Halal / Sahqaf names and marks are cleared for commercial use.
- **Halal claims**: independently verify relevant certifying body, certificate, facility, ingredient origin, ongoing compliance and packaging before official product pages/sales.
- **Product reality**: SKU names, ingredients/allergens, nutrition, net weights, expiry, freezing/storage, import/food safety, supplier evidence, target pricing.
- **Commercial launch**: sales model (direct checkout vs WhatsApp vs retailers), JMD currency, delivery geographies, returns and payments.
- **Copy / Arabic review**: confirm scripts and translations with qualified Arabic reader/brand owner.
- **Lead capture**: approve final privacy policy, lawful basis, retention, sender address, unsubscribe method; then configure Cloudflare D1 and Turnstile.

## 7. Human approval and progression

The working site in the feature branch is a design-and-code candidate. Never merge or publish production by implication. Required progression: local checks → independent visual, mobile, accessibility and security review → Cloudflare preview smoke → human approval → main merge → production publication decision. A polished marketing video is created only from the accepted live candidate at handover.
