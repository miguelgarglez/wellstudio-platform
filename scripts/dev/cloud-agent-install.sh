#!/usr/bin/env bash
#
# Cloud Agent install script for WellStudio.
#
# Idempotent, non-interactive dependency refresh + local configuration. Runs
# after the repository is checked out. Safe to run repeatedly. Provisions a
# fully self-contained local stack (Node deps, Prisma client, Playwright
# browser, local Postgres binaries) so the app builds, tests, and runs without
# external services. Supabase Auth stays on non-secret placeholders; real auth
# requires Supabase credentials that are out of scope for local setup.
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

# 1) Seed local, non-secret env defaults (mirrors CI + docker-compose). Never
#    overwrite an existing .env so real developer/agent credentials are kept.
if [ ! -f .env ]; then
  echo "Creating local .env with development defaults..."
  cat > .env <<'ENV'
# Local Cloud Agent development defaults (non-secret, mirrors CI).
# Self-contained local stack: local Postgres + placeholder Supabase.
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-anon-key"
NEXT_PUBLIC_AGENTATION_ENABLED="false"
NEXT_PUBLIC_AGENTATION_ENDPOINT="http://localhost:4747"
ENV
else
  echo ".env already present; leaving it untouched."
fi

# 2) Ensure PostgreSQL is installed. Normally baked into the base snapshot; this
#    guard keeps a fresh clone (without the snapshot) working too.
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  echo "Installing PostgreSQL..."
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

# 3) Node dependencies (pinned pnpm + lockfile).
corepack enable
pnpm install --frozen-lockfile

# 4) Playwright browser used by the E2E suite (+ its system deps).
pnpm exec playwright install --with-deps chromium

# 5) Generate the Prisma client (no database connection required).
pnpm db:generate

echo "Cloud Agent install complete."
