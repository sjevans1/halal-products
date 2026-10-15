# ADR-010 — Scoped stewardship, not self-asserted business ownership

Status: Proposed development candidate, human review pending.

## Decision
Maintain anonymous public source-based discovery; never make site sign-up or a public correction form into automatic management access. Approved organization representatives may be granted **one-listing-at-a-time, time-bound, revocable** permission through an independently reviewed operator process. Cloudflare Access JWT signed identity and a separate audience from staff are required. Representatives can propose corrections only; a human-reviewed GitHub content PR governs publication. Certification evidence stays within the separate trust process.

## Why
This protects the needs of Jamaican Muslims seeking trustworthy local details while welcoming people exploring halal for the first time. It avoids a complex public account experience for casual visitors, reduces impersonation and misleading halal claims, and provides clear, low-friction correction options. No Watermelon UI or additional framework was necessary for these native, accessible components. A future e-commerce experience may require richer reusable components and new ADR.

## Consequences
Adds D1 migrations 0007 and 0008, private operator screen and representative screen. An operator must independently verify account authority using external organizational evidence, not merely a public link; grants cannot be self-issued. Access policies must protect HTML and API on all hosts when Hermes eventually deploys. Stale or revoked authorization denies writes even with an otherwise valid signed identity. Data protection, religious-content and publication acceptance remain independent approval gates.
