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

## 10. HUB-09 — Secure operator moderation (new stacked candidate)

- **Admission:** HUB-08's suggestion storage requires a staff review mechanism before public intake can responsibly open. The previous static-GitHub operator mode could not triage the D1 queue without database tools.
- **Included now:** read-only bounded/paginated review queue by pending/reviewed/rejected; operator responsive UI with explicit confirmation; review note and double submit protection; verified Cloudflare Access JWT + email allowlist + same-origin POST; D1 status transition + audit log migration; no public publishing. All new code is independent of Cloudflare provisioned identity until explicitly enabled.
- **Operating model:** public anonymous directory and event guides; separately activated visitor suggestion intake; limited editor role for queue triage; independent human-only GitHub publication. Three authorities are never collapsed into one button.
- **Verification:** new native negative-auth/transition tests; multi-viewport operator browser mock; original catalogue and hub regressions. Cloudflare preview + Access/D1 live tests outstanding.
- **Not included:** user account management, claims verification/certification, staff invitations, auto-publication, supplier/order operations, activated signup, live domain, third-party email sending.
- **Next package after acceptance:** certified supplier and venue provenance register + editor workflows, source-freshness reviews, scheduled content audit, privacy/legal implementation, and Cloudflare deployment acceptance. Commence paid commerce only after supply and fulfilment evidence.
- **Release boundaries:** do not merge upstream PR #1/#2 or this stacked PR without human approval; do not enable `HUB_OPERATOR_ACTIVE` or `HUB_SUBMISSIONS_ACTIVE` without a real environment and the runbook gates in `docs/OPERATOR_REVIEW_RUNBOOK.md`.

## 11. TRUST-01 — Independent evidence and provenance register (stacked candidate)

**Admitted after HUB-09 as a separate UX-first work package. Cloudflare integration remains deferred to Hermes at final release.** The goal is to make documentation and evidence review manageable without inventing suppliers or misrepresenting certification.

### Delivered in this candidate

| ID | Functionality | Completion boundary |
|---|---|---|
| TRUST-01A | Registry with all 5 product concepts + 15 published-source community subjects; every initial record unverified/source-listed | Local validated; no certification claims |
| TRUST-01B | Private subject selection, evidence categories, claim, public HTTPS evidence URL, issuer-as-supplied, specific scope, validity and review due dates | Local UI and input/API validations |
| TRUST-01C | Explicit `pending → accepted/rejected`, `accepted → disputed`, separate verifier allowlist and ban on self-review | Local API, JWT and SQLite tests |
| TRUST-01D | Immutable evidence and SQLite-triggered audit history; bounded queue, status filter, review-due calculation and per-case audit dialog | Local UI and database tests |
| TRUST-01E | Independent editorial publication boundary, forward-only migrations, emergency disable and operational runbook | Documented; live operational proof pending |

### Definition of done for this development package

1. `npm run check` runs native security/content tests plus real SQLite trigger/transaction checks; no source or identity bypass.
2. `python3 browser-trust-check.py` validates the operator's essential journeys across desktop/tablet/mobile/small viewports with mocked APIs, including explicit confirmation and error state.
3. Existing catalogue, hub and submission-review browser regressions remain passing.
4. No public page or search endpoint can read the internal evidence register or interpret accepted evidence as certification.
5. All migrations are additive; updates to baseline subject sources are made via separate reviewed migrations, not silently rewriting history.
6. Independent review of API, D1 transactions, accessibility and actual Cloudflare authentication is required before activation.

### Next implementation waves after TRUST-01

- **CONTENT-01 — Governed editorial CMS:** drafts and review/approval history for articles, directory corrections, recipes, dates and events; independent publisher role; GitHub-backed generated publication preview; takedown workflow; no edits to live content directly from public suggestions.
- **COMMUNITY-02 — Richer useful features:** community steward proposals, verified hours/services, source-date freshness monitoring, relevant Jamaicans' halal food and cultural editorial content, responsibly calculated and mosque-confirmed Ramadan/prayer guidance, mapped directory only for verified locations.
- **COMMERCE-01 — Operational catalogue:** supplier contracts/production SKU specification and claims readiness, approved label/halal/food-safety statements, warehousing/cold chain, JMD pricing, order & inventory logic, payment fulfilment, customer care; infrastructure integration comes at acceptance stage.
- **OPS-01 — Final Cloudflare acceptance with Hermes:** connect the approved PR stack, branch preview, Access/Pages/D1/Turnstile configuration, migrations, WAF/rate limits, privacy/legal signoff, operator role setup, real browser/auth/DB/rollback testing. **No Cloudflare configuration is performed during current build waves.**

### Non-code dependencies to track (never represent as completed by implementation)

Ownership/legal entity and brand marks; real products and suppliers; qualified halal and food-safety verification; accurate community locations/contacts and consenting organizations; religious editorial and Arabic reviews; actual business contact, public privacy policy and email consent workflow; live pricing, inventory, logistics, fulfillment, customer support and payments. These require people, records and approvals outside this repository.

## 12. LEARN-01 — Halal ingredient & label reading guide (stacked candidate)

**Goal:** build an accessible, truly useful educational feature for Muslims in Jamaica and anyone considering halal choices. Do not conflate an ingredient-word match with product certification or a religious ruling.

| Work item | Delivered local implementation | Gate |
|---|---|---|
| LEARN-01A | Source-controlled 14-topic learning set covering animal origins, processing aids, additive origins, flavourings, cross-contact and certification checks | Jamaica Halal Council published general guide; independent specialist review outstanding |
| LEARN-01B | Standalone premium `/learn/ingredients/` page linked from Learning Centre; search, 4 category filters, expandable source-check questions and explicit zero-state | Keyboard + desktop/tablet/mobile browser tests |
| LEARN-01C | Five-step on-device evidence checklist and copyable questions to ask suppliers; no user tracking or storage | Accessibility and privacy checks |
| LEARN-01D | Deterministic build, data validation, policy document, noindex release gate and negative-content tests | Native/HTML/visual QA |

No positive halal claim, certification, named business verification, product availability or fatwa can be generated by the guide. Human-only approval for release; Cloudflare is a final Hermes handoff rather than a prerequisite for ongoing source development.

**Further CONTENT-01 scope remains:** editable drafts, versioned sourced articles, moderated community contributions, independent religious and content reviewer workflow, scheduled freshness audits and an explicit GitHub-backed publication/rollback process. This educational experience does not represent those operational capabilities as delivered.

## 13. FRESH-01 — Source freshness and provenance maintenance (stacked candidate)

| Feature | Implemented | Boundary |
|---|---|---|
| FRESH-01A | Offline `scripts/content-audit.mjs`: counts recent, due and stale public references; optional JSON output, no external requests | Local only, no scheduled monitoring |
| FRESH-01B | Public directory shows **Source viewed** date and a contextual warning when 90/180 day editorial thresholds are crossed | Does not imply closure, verification or certified halal status |
| FRESH-01C | Release blocker for unsupported/expired certification and invalid source/event metadata; human recheck policy and takeover/rollback instructions | Real-time issuer verification and expert review remain external requirements |
| FRESH-01D | Unit tests, real Chromium directory recheck regression, edited SOP and quality gates | Local tests; Hermes later validates Cloudflare staging |

**Next planned**: CONTENT-01 governed CMS with drafts, claims and review responsibilities; community steward proposals; due-date reports integrated into accountable editor workflow; final operational commerce gates after suppliers/products are real. This package must not be represented as a full publisher or operational certification service.

## 11. EDIT-01 — Governed Editorial Studio (new stacked candidate)

- **Admission:** the Hub directory, events and Learning Centre need a controlled way for staff to prepare and independently review corrections and new material without auto-publishing or inventing religious/food-safety assurances. This sits on top of FRESH-01.
- **Scope:** `/operator/editorial/`, fail-closed `/api/operator/content`, `src/editorial-policy.js`, migration `0006_editorial_workflow.sql`, private plain-text structured proposals, independent reviewer allowlist, immutable review stages, compare-and-swap revisions, append-only SQL audit, read-only publication packet export. Types: guide, directory, event and recipe. Existing public homepage and catalogue remain unchanged.
- **Trust boundaries:** author edits draft, independent reviewer records decision, separate human GitHub review releases public data. Internal acceptance cannot update public `hub.json`, confirm a halal certificate, announce an event, or issue a religious interpretation. External publisher and qualified community reviews remain necessary.
- **QA:** native JWT and role rejection tests, cross-origin negative, input bounds, SQL trigger invariants, mocked Chromium on desktop/tablet/mobile/320px; FULL real Access/D1/Pages and WCAG assessments deferred to Hermes and human reviewers.
- **Dependencies/owner:** business owner designates operator/editor/verifier identities and privacy controller; later Hermes configures signed Cloudflare Access JWT identity, D1 schema, feature flag, staging migration, rate limiting and preview. `HUB_EDITORIAL_ACTIVE` stays disabled by default.
- **Following packages:** event/community partner stewardship, content publication handoff automation (still requiring human approval), commercial product/wholesale operations and payments only after verified suppliers, claims, licensing and fulfilment. Cloudflare deployment remains explicitly last.

## 12. COMM-01 — Jamaica-first community and business contributions (stacked candidate)

**Goal:** keep Tayyib’s primary visitors at the center: practicing Muslims resident in Jamaica, visitors or families seeking local community resources, and Jamaicans exploring halal. Prioritize understanding, useful action and source visibility above adding staff functionality.

**Delivered in source:**

- 15 generated first-party detail pages (`/places/<id>/`) with source provenance, source-viewed dates, distinct unknown status, practical checks before visiting, related community entries and contextual correction actions.
- `/contribute/` with one mobile-first, accessible and guided choice for correction, listing, event or representative update. Record/title/source prefill only from checked-in directory data; no form promises owner access or halal verification.
- A consistent contribution route from the directory, events and business partnership sections; clear independent-review process and public source expectations.
- Reuse existing fail-closed D1/Turnstile pending-only submission endpoint and existing staff moderation and independent editorial workflows. No new real user account or sensitive identity capture.
- UX journeys, acceptance tests, ADR-009 and operations runbook. No extra UI framework dependency; native components consistent with the website.

**Intentionally excluded:** brand-owned merchant accounts, auto-publication, verified supplier badges, live mosque times, private documents or national-ID capture, authenticated steward delegation, payment/stock, real Cloudflare configuration. A representative suggestion is **not proof of representative identity**.

**Next sequence:** (1) independent human UX/accessibility/halal-content review; (2) fuller administrator support for source and record linkage and later verified stewardship invitation lifecycle; (3) commerce operational design once legal/supplier/product data and fulfilment model are approved; (4) final release gate and Cloudflare deployment executed by Hermes.
