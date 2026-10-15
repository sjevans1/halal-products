# ADR-006 — Ingredient exploration as education, not automated halal classification

Status: **development candidate, awaiting content-owner and community review**

## Context

A person exploring halal living needs practical help interpreting packaging language. Many ingredients have source/process dependent status, making naïve string classification an unreliable and potentially misleading product feature.

## Choice

Create a first-party, keyboard-usable **Ingredient & Label Reading Room** with 14 source-linked topic cards, search and category filters, explanation details, questions to ask suppliers, an optional on-device checklist and a copyable supplier-question list. Source of truth: `hub/ingredient-guide.json`; deterministic rendering: `scripts/build-ingredients.mjs`. Primary referenced guidance: Jamaica Halal Council's published Halal Food General Guide. No live API, user accounts, data storage or external component dependency.

## Alternatives rejected

- A binary `halal` / `haram` engine based on E-numbers, names, an LLM response or speculative recipe ingredients: too easy to be factually wrong.
- Camera/OCR upload to classify package labels: expensive, privacy-impacting and insufficient without issuer/supplier evidence.
- Embedding Watermelon UI or a React framework for a static editorial guide: unnecessary. Existing HTML/CSS and native details maintain the same premium Tayyib design. Reassess component libraries for the eventual admin/commerce application.

## Release boundary

Generated page is prelaunch noindex. A qualified content and religious reviewer must approve all authoritative statements and Arabic before public indexing; the issuer has not endorsed this website. Tests show UI behavior, not religious acceptance or a certification assessment. Infrastructure deployment remains deferred to Hermes with the final approved release.
