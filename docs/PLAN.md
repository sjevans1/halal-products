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
- Cloudflare Pages Functions under `functions/api/*` handle signup status and actual email submission. **Fail-closed** unless an operator deliberately sets `WAITLIST_ACTIVE=true` alongside D1 database `WAITLIST_DB`, `TURNSTILE_SITE_KEY` and secret `TURNSTILE_SECRET`. Records consist of email and timestamps, never password/payment details. Prepared SQL prevents injection; server verifies Turnstile token.
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

## 8. UX-first catalogue extension — H3-design candidate

Implemented as a **design candidate, not commercial SKU activation**:

- `CAT-01`: Source-controlled `catalog/catalog.json` for five initial concepts; generator validates IDs, category, linked art and related product integrity.
- `CAT-02`: Five generated product story pages with product photography, usage ideas, relationships and explicit sourcing/certification unknowns; canonical-sounding links are local and do not suggest stock.
- `CAT-03`: Three curated concept edits with standalone descriptive pages and product compositions; no invented prices/stock/bundles for purchase.
- `CAT-04`: Recipe food photography for curry, jerk beef skewers and roasted vegetables, with concept packaging art saved as optimized WebP.
- `CAT-05`: Shared native components and build templates for catalogue pages; no unnecessary React or e-commerce runtime. Watermelon UI patterns evaluated for possible later reuse, without installation.
- `CAT-06`: Keep the existing waitlist fail-closed, editorial and trust language honest, and require later supplier/certifier, ingredient, label and food-safety signoff.

**Status:** candidate validated in local automated checks; awaits independent visual/design and Cloudflare preview review. No business/food or deployment acceptance implied.

## 9. Tayyib Halal Community Hub — approved direction, candidate implementation (HUB)

**Direction authorized 2026-10-15:** evolve from a product showcase into a welcoming Jamaican halal food, community and lifestyle resource. This is a **scoped, independent work package** built on the unmerged catalogue candidate, not a replacement for its acceptance. The public information service should be useful to Muslims as well as people exploring halal for the first time. Do not imply that Tayyib issues fatwas, certifies halal, or has independently inspected businesses.

### People and value

- **Jamaican Muslim family:** search for a mosque by parish, identify where information came from, follow an original source and avoid misinformation about times and halal status.
- **Curious visitor:** navigate beginner-friendly halal and tayyib explanations, understand how to evaluate labels and learn without being patronized or required to register.
- **Home cook:** find a dish, adjust portions, prepare a shopping list, explore related Tayyib product concepts and understand their pre-commercial status.
- **Organizer or business:** propose a publicly sourced event, location, or correction without self-publishing and without buying an endorsement.
- **Tayyib operator/editor:** review sources, approve and correct records, maintain currency, and remove outdated or disputed entries before release. For this phase editorial approvals are committed through GitHub; a browser-based staff console is *not yet implemented*.

### Six pillars and phased scope

| ID | Pillar | Current approved candidate | Deferred / dependency |
|---|---|---|---|
| HUB-01 | Find Halal Jamaica | searchable public-source directory with parish/category filters, source link, checked date, meaning of each status, accurate empty state | independent business and certificate validation, claim dispute/review workflow, map provider evaluation |
| HUB-02 | Community | local mosque and organization resources, cross-links to directory, inclusive discoverable navigation | verified Jummah/prayer facilities, mosque steward accounts and delegated edits, published community partnerships |
| HUB-03 | Discover Halal | four source-linked beginner guides, standalone Learning Center, certification explainer | expert/religious editorial review before broad public indexing; lesson expansion and Arabic review |
| HUB-04 | Tayyib Kitchen | three illustrated recipes, recipe modals with 1–16 servings, generated shopping lists | saved collections/sync, meal planning, nutritional/ingredient verification for actual SKUs |
| HUB-05 | Events & Ramadan | events calendar with explicit no-approved-events state; Ramadan resource hub; gated proposed listings | actual organizer-approved records/times, holiday calculations with method/confirmation, per-organizer administration |
| HUB-06 | Marketplace / partnerships | link into existing five product concepts, three editorial edits, partnership explainer with verification policy | price, inventory, licensing, JMD checkout, fulfilment, wholesale portal and paid-placement transparency |
| HUB-07 | Content governance | canonical source-controlled `hub/hub.json`, validation/generation, source status taxonomy and admin-by-GitHub workflow | role-limited authenticated editorial dashboard, audit/activity and conflict lifecycle |
| HUB-08 | Moderated contribution | D1 migration + server-side Turnstile + submission review queue, explicit disabled gate; no public auto-publication | legally approved collection and retention workflow, Cloudflare environment and production challenge tests |

### UX-first acceptance contracts

1. Homepage surfaces three visitor actions within the first two scrolls: **Find Halal**, **Learn**, **Community**, without hiding the product catalogue.
2. Directory returns honest results by parish, category, text; visitor can see source and reference date; zero-state explains the missing businesses. No invented certifier or verification badges.
3. No event, prayer time, opening hour, or certification appears as confirmed absent valid primary evidence and editorial approval.
4. Recipe serving controls remain keyboard-usable, maintain accurate multipliers for quantities, and do not imply concept products are available.
5. Responsive experience, keyboard navigation, dialogs, empty/loading/error states, premium consistency and legible contrast reviewed on real device widths.
6. Submission form cannot accept information unless D1 + Turnstile + explicit flag + privacy signoff; server validates all text and source URL, stores as **pending**, never publishes.
7. All public editable content has provenance; articles have outbound reading references and individual records have a `sourceCheckedAt` date meaning *we viewed the source on that date*, not that the venue was reverified.

### Packages and dependencies

| Work packet | Deliverable | Status / boundary |
|---|---|---|
| HUB-A | Community IA, premium page shells and homepage discovery, reusable native components | Local implementation candidate |
| HUB-B | Directory model and UI with source-based records and robust no-results treatment | Local implementation candidate; contacts and opening information not independently confirmed |
| HUB-C | Learning and Kitchen (guides, recipes, portion-adjustment) | Local implementation candidate; expert editorial approval outstanding |
| HUB-D | Events and partnerships journeys, editorial source policy | Local implementation candidate; no actual event or commerce activation |
| HUB-E | D1 pending-only contribution route, anti-bot challenge, disabled-by-default config | Source ready; needs privacy/operator signoff and deployed integration test |
| HUB-F | Browser verification, release profile, Cloudflare branch preview and final community-owner review | Local automated portion in progress; deployed preview and human signoff outstanding |
| HUB-G | Future authenticated moderator portal, contributor stewardship and sourced food-business onboarding | Planned, not started; requires user identity, admin ownership, data governance and approval |
| HUB-H | Future commercial marketplace/payment/fulfilment system and sponsor tools | Deferred until actual product and business obligations verified |

### Implementation choices

- Maintain current Cloudflare Pages static-site architecture; `npm run build` now generates catalog and hub pages. No Watermelon/shadcn import without a justified integration need, verified license and accessibility quality.
- Public browsable directory/learn/recipe/event content is source-controlled JSON rendered to HTML/JS; there is no external CMS and no commercial data dependency at launch.
- Moderate corrections via source-control PRs, or store submitted suggestions in D1 **pending** until editorial review. Never give all users a public write-to-publish path.
- Protect privacy: submit no account, payment, personal addresses, religious affiliation or medical information. Source URL/title/note is the entire pending submission, with no IP or anti-bot token persistence.
- No claim that this site is certified, that the seed places currently operate, or that the Jamaica Halal Council endorses Tayyib.

### Release and collaboration gate

A branch preview can be shared with the product owner for review only after CI succeeds. **No merge or production deployment** until the independent design/quality reviewer accepts current evidence, the owner approves, and documentation distinguishes incomplete commercial/religious content. Real live submissions require a separate explicit legal/security/data-operations authorization.
