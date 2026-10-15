# Jamaica-first UX journeys — Community Stewardship

Status: COMM-01 design/implementation candidate. Requires direct usability feedback from Jamaicans who practice halal, mosque and community representatives, and Jamaican visitors exploring halal. **No claim that those participants have been consulted yet.**

## Product principle

Tayyib is a welcoming practical resource, not a religious authority, certifier, or pay-to-list directory. On mobile, users must be able to learn **what we know**, **what we do not know**, and **what action they can take** without sign-in or navigating admin software.

## Golden journeys

| Person and need | Entry | Expected outcome within 3 minutes | Guardrail / failure |
|---|---|---|---|
| Muslim living in Kingston seeks a mosque | Homepage → Find Halal → filter parish → View listing details | Address as supplied by source, original source link, date source was viewed, and what to confirm directly | No unverified prayer times, opening hours or claim of Tayyib inspection |
| Muslim visitor elsewhere in Jamaica seeks community contacts | Find Halal → parish filter → detailed source card | Can distinguish mosque, organization, source-listed-only status and related resources | Empty parish shows helpful guidance, not invented options |
| Jamaican new to halal wants to explore | Homepage → Learn → ingredient guide → recipe | Plain-language food-label questions, accessible recipes, clear option to learn more | No religious ruling from a keyword search; external authoritative sources included |
| Person sees inaccurate directory details | Listing page → Suggest an update | Contextual prefilled name/source, explanation field, verification gate; no registration required | Submission gate disabled until configured; success never promises publication |
| Business or mosque representative wants to contribute | For Businesses → Start a contribution → I represent an organization | Understands the independent review and source requirements before sharing any information | No ownership verification or profile access is conferred by submitting a source |
| Community organizer wants event listed | Events → Suggest an event | Reaches same single form, public organizer announcement required | No event dates fabricated or published automatically |

## UX acceptance standards

- **Trust before conversion:** prominent `Source listed · not independently verified`; original URL and source-viewed date. Never display expired certification as current.
- **Mobile first:** 320, 390, 768, 1440px checks for overflow, legibility, target spacing, submit states and visible progress without a desktop-only path.
- **No dark patterns:** no account needed to read, no email or personal religious-affiliation requirement to suggest a correction, no surprise subscription.
- **Consistent premium system:** emerald, warm ivory, restrained gold, editorial serif headings, accessible native controls with visible focus, concise labels and generous spacing. Keep common header/footer/navigation with existing hub.
- **Honest failure:** no enabled submit before D1/Turnstile + privacy/moderation activation, visible errors, no false receipt when request fails or verification expires, no background auto-submission.
- **Related content:** each of 15 existing source-listed records has a detail route and a contextual correction link; text is escaped, related links only resolve to locally known entries.
- **Accessibility:** do not rely on color alone for statuses; grouped intent radios with fieldset/legend, source links distinguished visually, form labels bound to inputs, no auto-playing media.

## Human research still needed

Before public indexing or a verified steward programme, conduct short moderated usability sessions with Jamaicans from different parishes, Muslim community representatives, people exploring halal, and local businesses. Ask participants to locate a record, interpret its evidence state, propose a correction, and tell us where language or religious interpretation is confusing. Treat event/halal advice as subject-matter reviewed, not generic generated content.

## Reuse and framework decision

Continue with native semantic HTML/CSS components and deterministic static generation for the public directory. Watermelon UI or other licensed component registries may be considered if future authenticated steward accounts demand richer tables/forms; do not introduce a React/Tailwind runtime merely for a four-choice public contribution form. Commercial and operator applications must have separate security and UX acceptance gates.
