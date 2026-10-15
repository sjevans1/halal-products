# ADR-009 — Jamaica-first place pages and single moderated contribution journey

Status: **Proposed, review candidate**. No cloud publication or active suggestions.

## Decision and rationale

Give people in Jamaica a straightforward place-detail → correct-information journey before implementing sophisticated representative accounts. Each public listing becomes a first-party page explaining source, age, limits and practical questions to confirm directly. A single guided contribution flow serves local residents, visitors, organizers and organizations, using the existing pending-only D1 intake route. Do not introduce a separate business login and pretend ownership has been verified; that needs a later controlled identity proofing process.

## Alternatives

1. Direct self-service edit rights: rejected now because a fraudulent claim could change sensitive mosque, food or halal information.
2. Separate forms for each category: rejected because it fragments the mobile journey and duplicates anti-abuse logic.
3. First-party static detail components + one constrained contribution page: **selected** for current pre-launch phase.

## Impacts and future decisions

Static generator adds 15 HTML pages but no new runtime dependencies or source-of-truth drift. The UI supplies a record context ID only in an **untrusted note**, not a privileged DB relationship. Moderators must verify context and the provided source manually; submission never means certification or affiliation. Watermelon UI is a later authenticated-console evaluation, not a present dependency. A future ADR must govern verified organization claiming, fine-grained authorizations, revocation, support SLAs and any public review/response tracking.
