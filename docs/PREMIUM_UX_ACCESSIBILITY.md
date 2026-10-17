# A11Y-01: Readable premium visual system for Jamaica

**Status:** Development candidate; no automatic public-client deployment or merge. This wave follows PR #13. It addresses Hermes' Cloudflare-preview finding that about 50 muted/gold text elements on light surfaces had low contrast. This remains an inclusive *visitor-first* design system, not a complete WCAG compliance certification.

## Design decisions

- Keep emerald (`#103c2e`) as the main brand colour and gold as a decorative accent. Do **not** use decorative pale gold for small labels on ivory or sand.
- Use readable bronze (`--gold-ink: #70532f`) for normal-size labels on pale surfaces; use readable forest-muted (`--copy-ink: #4c604f`) for description and metadata text.
- Use light gold (`--gold-on-forest: #e6c88b`) on solid dark-green mastheads and featured cards. Brand treatment is unchanged.
- Maintain at least 4.5:1 colour contrast for normal text in the reviewed design token surface pairs, and visible keyboard focus. Do not assume illustrations, gradients or third-party content inherit a safe contrast score.
- Preserve all three mobile navigation actions (search, saved items, menu) with touch targets at least 44px, including 320px. Compact the logo at very narrow widths instead of removing actions or overflowing the screen.
- Respect `prefers-reduced-motion: reduce`. Do not rely only on a gold indicator to convey selection or status: buttons, labels and status messages must remain meaningful in text.

## Evidence and limits

- `node --test tests/accessibility.test.js`: direct design-token contrast calculation and guardrails.
- `python3 browser-accessibility-check.py`: **63 representative text contrast measurements at 4.5:1 or greater** in Chromium across 1440px, 390px and 320px. Also checks focusable skip-link, focus outline, menu `aria-expanded`, three 44px mobile actions, reduced motion, console errors and horizontal overflow.
- Continue to run `npm run check`, `python3 browser-check.py`, `python3 browser-hub-check.py`, `python3 browser-discovery-check.py` and the other existing regression checks before review.
- Representative text contrast tests deliberately exclude text over photographic and gradient images; these need manual visual and assistive-technology checks in the *actual Cloudflare client-review browser*, with axe/Lighthouse follow-up and Jamaican participants on real devices.
- Pages with private staff interfaces were not broadly redesigned in this public visitor wave. Their authorization and usability require a separate, security-sensitive acceptance round before activation.

## Publication boundaries

Changes are submitted to a **draft stacked PR**. No automatically updated public client-review link, authenticated admin activation, email collection, certification assertion or commerce change is included. To update the public client-review site, an owner must separately approve the reviewed SHA and Hermes must build the sanitized static-only artifact from PR #11, validate it, and manually deploy it.
