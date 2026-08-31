#!/usr/bin/env bash
#
# Cloud Agent start script for WellStudio.
#
# Runs on every boot. Brings up the local PostgreSQL instance and reconciles the
# database schema with the Prisma models. Idempotent and returns once the
# database is ready; the Next.js dev server runs separately as a terminal.
set -euo pipefail

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

# Start (or reuse) the local Postgres cluster.
./scripts/dev/start-local-postgres.sh

# Sync the schema. Idempotent: a no-op when the database already matches.
pnpm db:push

echo "Cloud Agent start complete."
