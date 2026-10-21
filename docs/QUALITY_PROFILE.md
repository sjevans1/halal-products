# Quality, Security & Assurance Profile — Tayyib Halal

Framework pin: `.dev/framework.lock`. Risk: production-facing marketing / limited personal-data processing once activated. Deployment: Cloudflare Pages static + Functions + D1. Responsible owner, privacy reviewer, certifier and support contact: **to be confirmed by business owner**. No AI-powered product features. Support model: brand owner operates public information and registration; operators must not expose D1 credentials.

| ID | Acceptance goal | Method | Owner / status |
|---|---|---|---|
| Q-UX1 | Navigate catalogue, filter, open dialog, search, save locally on 320–1440px | Browser automated + manual | Proposed / pending |
| Q-UX2 | WCAG 2.2 AA aim; keyboard focus, semantics, reduced motion; representative assistive review | axe + manual keyboard/screen-reader | Pending |
| Q-UX3 | No horizontal scroll at 320px; readable text across supported breakpoints | Browser screenshots | Pending |
| Q-PRV1 | No contact data collected if consent, Turnstile or D1 unavailable | Native negative tests + live test | Code checks included; live pending |
| Q-SEC1 | Email constrained/normalized; SQL uses prepared statements; no untrusted DOM HTML | Code review + tests | Code checks included |
| Q-SEC2 | CSP, frame protection, no credentials under public, HTTPS | Cloudflare preview headers + external review | Pending |
| Q-PERF1 | Mobile Lighthouse performance ≥90 after visual/content approval (representative modern 4G, repeat 3x) | Lighthouse deployed preview | Pending |
| Q-TRUST1 | All halal, sourcing and certification claims evidenced per SKU before sales | Business compliance review | Blocking commerce |
| Q-CONTENT1 | Arabic, packaging artwork and legal/trademark rights approved | Human owner review | Pending |
| Q-REL1 | Branch exact-head test status, human merge and release signoff | CI + PR review + checklist | Pending |

Control mapping: governance/requirements/evidence/release/security/privacy/experience are **planned**; this profile does not assert ISO/NIST certification. AI-PROD: N/A (no LLM features). Multi-tenant controls: N/A. No exceptions authorized. Failure to obtain evidence means the related gate remains open.

Risks: (R1) visual packaging could be mistaken for certified products → concept previews plus FAQs, human verification before commerce; (R2) unauthorized use of logos/artwork → owner approval; (R3) signup personal-data handling → D1/Turnstile fail-closed + privacy policy gate; (R4) promotional copy/inaccurate product claims → manual food safety, halal and regulatory review; (R5) full b64 image payload performance → optimize to WebP and revisit as native static assets when transport/build matures.


## Catalogue trust and release delta

- Product data owner must verify the provenance, identity, claim wording and rights for each production photograph and supply chain. Generated artwork is illustrative and may contain nonsensical or inaccurate details.
- Unverified pack claims are flagged in-page as artwork only. This does not authorize those images for sale, printed packaging, official halal marketing or regulated food labelling.
- No price/availability/inventory, order, payment, automatic marketing signup or customer credential is exposed by new catalogue pages.
- Shared native components and static generated routes minimize runtime dependencies. Accessible responsive UI remains independently reviewable; passing scripted Chromium is not proof of WCAG conformance.

## HUB community data and content-assurance appendix

- Risk class: **public informational website**, with potentially consequential dietary/religious reliance. Source listing is not certification. Religious interpretation and sensitive community details need qualified human review. Visitor account system: not applicable.
- Source policy: public organization websites/directories; no automated scraping or copying long passages. Display short factual location data, original clickable source and `sourceCheckedAt` (date of inspection of published record). Never represent that date as venue-owner reconfirmation.
- Claim state: `source-listed` = referenced by a public source, not independently contacted. `self-declared` = business assertion, not certification. `certified` is a **future** state allowed only with issuer, certificate scope, expiry, documentary/lookup evidence; no seeded business currently certified. `pending` never public.
- Directory freshness: editorial team should recheck each listing before public indexing and at a defined interval (proposed 90 days for business listings and events; six months for static organization details, or sooner on reports). This cadence is a proposal; do not claim it is activated.
- Safety boundaries: do not make time-sensitive prayer/iftar claims based on unverified calendars; do not expose personal contributor details, infer a person's religion, track religious site visits, or contact users absent consent.
- Moderation: D1 suggestions are stored with title, type, source URL, note and pending review status, no IP, consent/identity, Turnstile token, tracking cookie or public listing without PR approval. Enable only after contact, retention (propose 90-day deletion/review window), correction/removal, lawful basis and rate limits approved. A privacy review is **still pending**.
- API controls: explicit feature flag, server-side Turnstile verification including hostname, bounded JSON payloads, restricted HTTPS source URLs, prepared D1 insert, no public admin/write-to-publish routes and disabled status on missing bindings.
- Accessibility UX expectations: WCAG 2.2 AA as project target for reviewed main journeys; test keyboard, focus order/trap, meaningful link text, error feedback, zoom and reduced motion. Current automated Chromium checks do not constitute AA certification.
- Release evidence: exact-head FAST CI, independent STANDARD review, real Cloudflare preview plus D1/Turnstile acceptance for activated forms. Authoritative user approval for merge and publication.
- Operator/role: manually authorized content editor in GitHub controls `hub/hub.json` and event records; no paid GitHub protected-branch assumption. Editing permissions are procedural until hardened. Staff portal deferred pending scoped auth and audit design.


## TRUST-01 targeted risk profile

- **Safety/claim accuracy:** critical. No self-attested public certification. No product or venue becomes halal-certified through software. Expired or disputed records are not presented as current; editor evidence and independent expert verification remain distinct.
- **Security/privacy:** critical. Cloudflare Access JWT is verified server-side; role allowlists and anti-self-review rule; source links must be public HTTPS without credentials. Private certificate material and individuals' personal details are not permitted in this workflow. Data retention and withdrawal must be approved before activation.
- **Auditability:** database triggers record submission, decision and dispute atomically, enforce immutable evidence and audit records. D1 staging integration tests and external auditor review pending.
- **UX:** explicit confirmation, no silent state transition, readable error/empty states, private UI, mobile-first layouts, source and due dates visible; local real-browser smoke passing, formal WCAG audit pending.
- **Deployment:** intentionally not configured. Final Cloudflare Access, D1 and Pages integration belongs to Hermes and remains a hard release gate.


## LEARN-01 educational safety profile

- **Religious and source accuracy:** critical. Ingredient keywords only reveal evidence-gathering questions, not fatwas, certificates, product classifications or personal dietary advice. Independent Islamic and food certification review required before public indexing.
- **Accessibility:** search with counts, native details, keyboard-use filters and checkboxes, responsive at 320px onward, copy feedback with an explicit unavailable fallback. External screen-reader and contrast assessment still needed.
- **Privacy:** no photo upload, account, history, analytics or retained input. All guide content is static; checklist state is ephemeral.
- **Evidence:** references Jamaica Halal Council's published general guidance, without claiming its endorsement or actual product assessment.


## FRESH-01 public information safety

- **Timeliness:** source viewing is not independent verification. No current opening, prayer time or halal status inferred. >90/>180 day age warnings are editorial reminders, not closure claims.
- **Release blocker:** future/invalid dates, unapproved events, missing certifier scope and expired certificate claims. Date-only audits do not make claims reliable; human follow-up required.
- **Privacy:** all checks are local and use only public metadata, no user profiles, requests or private certificate contents.
- **Operations:** no automatic network polling, scheduled costs or publication; Hermes handles final Cloudflare integration after legal/religious/content signoff.

## EDIT-01 editorial data and publication assurance

- **Risk:** unauthorized staff access, forged identity, unsafe source claims, accidental publication, content tampering and outdated editor data. The console is private, noindexed and disconnected from public publication writes.
- **Authentication:** signed Cloudflare Access JWT, operator allowlist, additional independent reviewer allowlist; all on server. No browser-stored session secret, anonymous POST or credential in HTML.
- **Data:** plain text only, bounded source URLs and field lengths, no private supplier documents or personal religious affiliation. Consider staff email/notes privacy and retention before activation.
- **Database:** compare-and-swap revision, SQL transition guard, anti-self-approval, append-only audit, delete blocked. Trust evidence approval remains a separate authority.
- **Quality:** mocked multi-viewport Chromium plus native and SQLite tests; actual WCAG, Cloudflare Access, D1/incident restore, rate limit and independent security review remain pending.
- **Human release:** approved means an internal editorial outcome. Copying a publication packet cannot publish a page; public content still requires independent verified source PR and owner release approval.

### COMM-01 UX quality addition

Primary measure: a person in Jamaica can discover a source-listed venue and understand its confidence level, reach its source, or propose a correction within three minutes using a phone. Test user groups include resident Muslims, new halal learners, organizers and food businesses; the latter have no assumed endorsement. Source cues must remain readable on narrow screens, and errors must be explicit. The public site must not introduce a login or unnecessary personal-data request. Screenshot simulations do not substitute for independent community usability testing.


COMM-02 evidence: native negative identity/scope/date tests, real SQLite grant/revocation/proposal trigger tests and four-size browser journeys; third-party live security/identity and accessibility acceptance pending, no commerce.

## A11Y-01 — Measured public contrast and keyboard gate

Token-level WCAG AA normal-text colour ratios enforced in Node; 69 representative rendered-light-surface checks, mobile 44px navigation touch targets, focus, reduced motion and responsive review enforced by local Chromium. No relaxation of original security, content or merge gates.

## SHOP-01 quality evidence

A dependency-free Node policy guards prices, pack sizes, status and catalogue ID parity; the generated static public `/plan/` uses browser-local data with no checkout endpoints. Native regressions run with `npm run check`; a Chromium harness checks 1440, 768, 390 and 320px. Real preview smoke and accessibility review remain required prior to a public client update.
