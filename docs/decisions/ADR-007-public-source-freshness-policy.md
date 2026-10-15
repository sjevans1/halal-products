# ADR-007 — Explain source age without inventing business verification

Status: proposed/pre-release. Applies to the Jamaican source-referenced directory and editorial data.

## Decision

Add deterministic offline source freshness checks and an explicit visitor warning for sources last viewed more than 90 days ago. Retain a stronger cue after 180 days. Do not automatically de-list organizations based on age or claim their current operating status from an unvisited URL. Check for future/invalid dates, false event approval, and unsupported or expired certificate claims as **blocking** data errors. Record the original viewing date honestly and require a human-reviewed content correction to update it.

The build reads `hub/hub.json`, `catalog/catalog.json` and `hub/ingredient-guide.json`, produces a local audit, and has no internet or Cloudflare requirement. UI warnings are computed on the client as the source ages; they are not a data mutation.

## Rejected approaches

- Silent expiry of listings at fixed intervals: unfair to community organizations and may hide useful source citations.
- Treating source viewing as successful certification, business inspection, verified hours or active events: misleading.
- Implicitly re-setting review dates on every build: destroys editorial provenance.
- Automatically scraping community sites, publishing their changes or broadcasting events: introduces accuracy, permission, privacy and abuse concerns before an operator is ready.

## Consequences

Content editors must record genuine visits to original sources and follow a documented recheck cadence. Automated scheduling and third-party confirmation remain future operational choices. Public noindex remains until content and legal/community review. Formal independent certification review remains separately governed in TRUST-01.
