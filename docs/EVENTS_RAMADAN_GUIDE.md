# EVENT-01: Jamaica community events and Ramadan resources

## Visitor experience first

- A Jamaican Muslim resident can quickly check for source-linked community gatherings, without needing an account, giving location permission, or disclosing religious affiliation.
- Someone new to halal living can find practical meal and ingredient reading resources and community sources without being told they must observe Ramadan.
- A verified organizer can contribute through `/contribute/?intent=event`, but that form is disabled until human moderation and privacy operations have been activated. No submission, steward access or certification is conferred by viewing an event.
- An empty calendar says **No approved upcoming events yet**, provides community links and a usable planning checklist. Never invent events to fill empty space.

## Structured event publication contract

Canonical source: `hub/hub.json`, `events` array. Currently **empty**. Publishing a record requires all fields below; the rules are enforced by `scripts/event-policy.mjs` in the build and source audit. The example uses **fictional test-only data**. Do not copy it into production content or publish without a real organizer announcement.

| Field | Required meaning |
|---|---|
| `id` | Unique lowercase slug |
| `title`, `summary` | Descriptive, respectful copy. Do not imply Tayyib endorsement |
| `kind` | `gathering`, `learning`, `charity`, `ramadan`, `eid`, or `other` |
| `organizer` | Name of responsible organizer from a public source |
| `parish`, `locality` | Jamaican parish or explicitly islandwide/online; do not invent map pins |
| `sourceUrl` | Public HTTPS organizer announcement; avoid screenshots with no provenance |
| `sourceCheckedAt` | Actual source viewing date, not organizer or religious verification |
| `startsAt`, `endsAt` | ISO-8601 local date/time with literal `-05:00` Jamaica offset (Jamaica does not observe daylight saving) |
| `approved` | Exactly `true` after independent editorial review |
| `approvedBy`, `reviewedAt` | Identifiable reviewer reference and actual review date |

Before publication, an editor must confirm permission to reuse the organizer announcement, source freshness, parish and venue, accessibility of contact information, cancellation risks and full timezone meaning. The editor must create a separate reviewed GitHub content PR; approving a D1 record is **not** publication. Dates/prayer schedules are not calculated by Tayyib.

Expired events are excluded by the generator and hidden in the browser if a deployed page ages past their end time. Parish and category filters are only displayed when at least one upcoming approved event exists. If a cancellation, dispute or incorrect organizer claim becomes known, remove or correct the source-controlled event through an expedited reviewed release; do not wait for expiry.

## Ramadan and Eid guidance boundaries

The interactive four-step checklist exists only in browser memory for the current page; it creates no server requests, user profiles, localStorage record or contact lists. No future Ramadan/Eid dates, Fajr/Maghrib times, fasting schedule, moon sighting determinations or religious rulings are asserted. The resource cards refer only to existing Tayyib guides, recipes, and source-labelled community records. Qualified local Muslim representatives and religious editors should review wording prior to public indexing.

## Acceptance gates

- `npm run check` includes `tests/event-policy.test.js`, generator, all current security suites, real SQLite invariant tests and the source audit.
- `python3 browser-events-check.py` runs 1440/768/390/320px Chromium sessions, checks genuine empty state, checklist progress/reset, no horizontal overflow, runtime errors and links.
- Check the page on actual low-end mobile devices, keyboard and screen readers; validate contrast on real screens and religious/community terminology with Jamaican reviewers.
- GitHub CI must be green on the exact PR head. Cloudflare protected branch previews are allowed by existing automation, but public client-review redeployment requires a **separate manual decision and sanitized static-only artifact**.
- Live submissions remain disabled. There is no checkout, public API activation, or authority/certification claim.
