#!/usr/bin/env bash
# Manual publish for the Tayyib Halal client review project (tayyib-halal-client-review).
# Publishing a client-facing build is a deliberate, manual step. This script is
# deliberately NOT wired into GitHub Actions and the project has no Git integration.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CF_ENV="${CF_ENV:-$HOME/.config/workspace-ci-orchestrator/cloudflare.env}"

if [ -f "$CF_ENV" ]; then
  set -a; . "$CF_ENV"; set +a
fi
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN or provide the operator env file at $CF_ENV}"

cd "$ROOT"
git diff --quiet && git diff --cached --quiet || { echo "Working tree is dirty. Commit first so the published build maps to a known commit."; exit 1; }

COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
MSG="$(git -C "$ROOT" log -1 --pretty=%s)"

npm run build
node scripts/build-client-review.mjs
node scripts/build-client-review.mjs --verify-only

# Deploy from inside the artefact so wrangler cannot pick up the repository's
# functions/ directory; the client review project must never run Functions.
# wrangler leaves a local cache inside the artefact directory; keep it clean so
# the artefact stays a pure content tree.
rm -rf "$ROOT/dist/client-review/.wrangler"

cd "$ROOT/dist/client-review"
npx --yes wrangler@4 pages deploy . \
  --project-name tayyib-halal-client-review \
  --branch main \
  --commit-hash "$COMMIT" \
  --commit-message "$MSG"
