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
