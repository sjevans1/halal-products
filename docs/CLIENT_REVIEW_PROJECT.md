# Client review project operations

The client review deployment is a public, static copy of the Tayyib Halal
website for sharing with reviewers who should not need any account, login or
one-time code. It lives beside the secured preview project and never replaces
it.

| Field | Value |
|---|---|
| Cloudflare Pages project | `tayyib-halal-client-review` |
| Public URL | `https://tayyib-halal-client-review.pages.dev` |
| Production branch setting | `main` (the manual publish below deploys to it) |
| Authentication | none. The URL is open to anyone who has it |
| Cloudflare Access | not used on this project, by design |
| Pages Functions | none deployed. No `/api/*` endpoints exist here |
| D1 bindings | none |
| Automatic deployments | none. Publishing is always the manual script below |

## What it is, and what it is not

The artefact is generated from `public/` by `scripts/build-client-review.mjs`,
which removes the private surfaces rather than hiding them:

- Excluded outright: `/operator/` (all staff consoles), `/steward/` (the
  representative workspace), `steward-portal.js` and `steward-portal.css` (used
  only by those pages), every `/api/*` endpoint (no Functions are deployed),
  and all repository sources, migrations and documentation (they were never
  part of `public/`).
- Public visitor pages stay: homepage, catalogue, collections, Find Halal
  Jamaica directory with place pages, community, learning centre, ingredient
  guide, kitchen recipes, events, partners, the contribute journey and the
  privacy notice. `steward.js` and `steward.css` stay because public
  correction forms on `/contribute/` and `/places/*` load them.
- The verifier in the same script fails the build if a private surface, a
  steward portal asset, a secret name, a `/functions` directory or an
  expected public page is missing. `--verify-only` re-checks an existing
  artefact without regenerating it.
- `robots.txt` (disallow all) and an `X-Robots-Tag: noindex, nofollow` header
  discourage search indexing. These are courtesy controls, not security. The
  page is public; treat the URL as shareable but not secret.
- Visitor-facing forms stay fail-closed: without Functions there is no
  `/api/config` or `/api/hub-suggest`, so registration and submission stay
  disabled and never report success.

## Updating the review build

```bash
cd ~/halal-products
git checkout <branch-with-the-desired-content>
bash scripts/deploy-client-review.sh
```

The script requires a clean working tree, regenerates the site, builds and
verifies the sanitized artefact (`dist/client-review`), then publishes it
manually through wrangler. It deploys from inside the artefact so wrangler can
never attach the repository's `functions/` directory. The deployment records
the exact source commit.

To check an existing artefact without publishing:

```bash
node scripts/build-client-review.mjs --verify-only
```

## Temporarily disabling the review site

1. Cloudflare dashboard, Workers & Pages, `tayyib-halal-client-review`,
   Deployments. Delete the current production deployment. The URL then serves
   nothing until a new deployment is published; the project and its history
   stay in place.
2. Alternative: deploy a neutral holding page by pointing the script at an
   empty directory and publishing that as the new deployment.

Re-enable by re-running `scripts/deploy-client-review.sh` from the desired
commit.

## Permanently removing it

1. Cloudflare dashboard, Workers & Pages, `tayyib-halal-client-review`,
   Settings, Delete project. This removes all deployments and the
   `tayyib-halal-client-review.pages.dev` hostname.
2. Confirm afterwards that the URL no longer resolves to the site and remove
   the link from any client correspondence you control.
3. The repository scripts (`build-client-review.mjs`,
   `deploy-client-review.sh`) can stay for a future review cycle or be deleted
   in a later change.

## Relationships and cautions

- `tayyib-halal-preview` (the secured project with its Cloudflare Access
  application) is untouched by this project and keeps its protection.
- Never reuse this project for production content and never activate
  Functions, D1 or Access on it as a shortcut; the secured path for production
  is the reviewed merge stack and a deliberate `main` deployment of
  `tayyib-halal-preview`.
- The review build carries the same illustrative-content labelling as the
  preview: packaging imagery is an illustrative concept, directory entries are
  public-source listings with "Source viewed" dates rather than certification,
  and nothing claims verified halal accreditation, stock or business
  verification.
