#!/usr/bin/env bash
#
# Start and configure a local PostgreSQL instance for Cloud Agent / local
# development. Idempotent: safe to run on every boot. Mirrors the connection
# string used by CI and docker-compose (postgres:postgres@127.0.0.1:5432/postgres).
#
# This script provisions a self-contained database so the Prisma layer works
# end to end (prisma db push, prisma studio, domain queries). Supabase Auth is
# a separate external dependency and is not provided here.
set -euo pipefail

PG_VERSION="${PG_VERSION:-16}"
PG_CLUSTER="${PG_CLUSTER:-main}"
PG_PORT="${PG_PORT:-5432}"
PG_PASSWORD="${PG_PASSWORD:-postgres}"

run_as_postgres() {
  sudo -u postgres "$@"
}

cluster_running() {
  pg_lsclusters -h 2>/dev/null | awk -v v="$PG_VERSION" -v c="$PG_CLUSTER" \
    '$1==v && $2==c {print $4}' | grep -q online
}

if cluster_running; then
  echo "PostgreSQL ${PG_VERSION}/${PG_CLUSTER} already online."
else
  echo "Starting PostgreSQL ${PG_VERSION}/${PG_CLUSTER}..."
  sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" start
fi

# Wait for readiness.
for _ in $(seq 1 30); do
  if run_as_postgres pg_isready -q -p "$PG_PORT"; then
    break
  fi
  sleep 1
done

run_as_postgres pg_isready -p "$PG_PORT"

# Ensure the postgres role has the expected password so TCP (scram) auth works.
run_as_postgres psql -p "$PG_PORT" -v ON_ERROR_STOP=1 -c \
  "ALTER ROLE postgres WITH PASSWORD '${PG_PASSWORD}';" >/dev/null

echo "PostgreSQL is ready on 127.0.0.1:${PG_PORT} (database: postgres)."
