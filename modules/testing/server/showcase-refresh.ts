import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import {
  refreshShowcaseVitrinaSessions,
  type ShowcaseRefreshSummary,
} from '@/modules/testing/server/sandbox-scenarios/showcase-vitrina.mjs'

type RefreshResult =
  | { ok: true; summary: ShowcaseRefreshSummary }
  | { ok: false; error: string }

export function isShowcaseRefreshConfigured(env: Partial<NodeJS.ProcessEnv> = process.env) {
  if (
    env.VERCEL_ENV !== 'preview' ||
    (env.VERCEL_TARGET_ENV && env.VERCEL_TARGET_ENV !== 'preview') ||
    env.VERCEL_GIT_COMMIT_REF !== 'preview' ||
    !env.SHOWCASE_VERCEL_PROJECT_ID ||
    env.VERCEL_PROJECT_ID !== env.SHOWCASE_VERCEL_PROJECT_ID ||
    env.SHOWCASE_REFRESH_ENABLED !== 'true' ||
    env.E2E_AUTH_SANDBOX !== 'true' ||
    env.PAYMENTS_CHECKOUT_MODE !== 'sandbox'
  ) return false

  const projectRef = env.SUPABASE_SANDBOX_PROJECT_REF
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) return false

  try {
    const supabase = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    const database = new URL(env.DATABASE_URL ?? '')
    if (
      supabase.origin !== `https://${projectRef}.supabase.co` ||
      supabase.pathname !== '/' || supabase.search || supabase.hash ||
      supabase.username || supabase.password ||
      !['postgres:', 'postgresql:'].includes(database.protocol) ||
      database.pathname !== '/postgres' || database.hash ||
      !['', '5432', '6543'].includes(database.port) ||
      [...database.searchParams.keys()].some((key) =>
        !['sslmode', 'pgbouncer', 'connection_limit', 'pool_timeout'].includes(key),
      )
    ) return false

    return (
      (database.hostname === `db.${projectRef}.supabase.co` && database.username === 'postgres') ||
      (/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(database.hostname) &&
        database.username === `postgres.${projectRef}`)
    )
  } catch {
    return false
  }
}

export async function refreshShowcase(): Promise<RefreshResult> {
  if (!isShowcaseRefreshConfigured()) {
    return { ok: false, error: 'Showcase refresh is not configured for this Preview sandbox.' }
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: [],
  })
  try {
    const summary = await refreshShowcaseVitrinaSessions({ prisma })
    return { ok: true, summary }
  } catch {
    console.error('Showcase refresh failed; verify the demo catalog and database availability.')
    return { ok: false, error: 'Showcase refresh failed. Review the demo catalog and database.' }
  } finally {
    await prisma.$disconnect()
  }
}
