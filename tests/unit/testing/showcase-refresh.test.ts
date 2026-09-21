import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildRollingShowcaseSessionBlueprints,
} from '@/modules/testing/server/sandbox-scenarios/showcase-vitrina.mjs'
import {
  isShowcaseRefreshConfigured,
  refreshShowcase,
} from '@/modules/testing/server/showcase-refresh'

const projectRef = 'abcdefghijklmnopqrst'
const configured = {
  VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_REF: 'preview',
  VERCEL_PROJECT_ID: 'prj_example',
  SHOWCASE_VERCEL_PROJECT_ID: 'prj_example',
  SHOWCASE_REFRESH_ENABLED: 'true',
  E2E_AUTH_SANDBOX: 'true',
  PAYMENTS_CHECKOUT_MODE: 'sandbox',
  SUPABASE_SANDBOX_PROJECT_REF: projectRef,
  NEXT_PUBLIC_SUPABASE_URL: `https://${projectRef}.supabase.co`,
  DATABASE_URL: `postgresql://postgres:local@db.${projectRef}.supabase.co:5432/postgres`,
}

afterEach(() => vi.unstubAllEnvs())

describe('showcase refresh environment guard', () => {
  it('requires every explicit Preview sandbox setting', () => {
    expect(isShowcaseRefreshConfigured(configured)).toBe(true)
    for (const key of Object.keys(configured)) {
      expect(isShowcaseRefreshConfigured({ ...configured, [key]: undefined }), key).toBe(false)
    }
  })

  it.each([
    { VERCEL_ENV: 'production' },
    { VERCEL_ENV: 'development' },
    { VERCEL_TARGET_ENV: 'staging' },
    { VERCEL_GIT_COMMIT_REF: 'main' },
    { VERCEL_GIT_COMMIT_REF: 'devin/feature' },
    { VERCEL_PROJECT_ID: 'prj_other' },
    { SHOWCASE_REFRESH_ENABLED: 'false' },
    { E2E_AUTH_SANDBOX: 'false' },
    { PAYMENTS_CHECKOUT_MODE: 'stripe' },
    { SUPABASE_SANDBOX_PROJECT_REF: 'otherprojectabcdefgh' },
    { NEXT_PUBLIC_SUPABASE_URL: `http://${projectRef}.supabase.co` },
    { NEXT_PUBLIC_SUPABASE_URL: `https://${projectRef}.supabase.co.evil.test` },
    { DATABASE_URL: 'postgresql://postgres:local@127.0.0.1/postgres' },
    { DATABASE_URL: `postgresql://postgres:local@db.${projectRef}.supabase.co.evil.test/postgres` },
    { DATABASE_URL: `postgresql://postgres:local@db.${projectRef}.supabase.co/other` },
    { DATABASE_URL: `postgresql://postgres:local@db.${projectRef}.supabase.co/postgres?host=other.supabase.co` },
    { DATABASE_URL: `postgresql://postgres.otherprojectabcdefgh:local@aws-0-eu-west-1.pooler.supabase.com/postgres` },
    { DATABASE_URL: `postgresql://postgres.${projectRef}:local@pooler.evil.test/postgres` },
    { DATABASE_URL: 'not-a-url' },
  ])('rejects unverified scope: %j', (override) => {
    expect(isShowcaseRefreshConfigured({ ...configured, ...override })).toBe(false)
  })

  it('accepts only the matching project tenant on a Supabase pooler', () => {
    expect(isShowcaseRefreshConfigured({
      ...configured,
      DATABASE_URL: `postgresql://postgres.${projectRef}:local@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    })).toBe(true)
  })

  it('fails closed before constructing a database client when configuration is missing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('DATABASE_URL', '')
    await expect(refreshShowcase()).resolves.toEqual({
      ok: false,
      error: 'Showcase refresh is not configured for this Preview sandbox.',
    })
  })
})

describe('rolling showcase calendar', () => {
  it('keeps a bounded future horizon with stable identities, zero artificial occupancy and weekly slots', () => {
    const now = new Date('2026-09-21T00:00:00Z')
    const sessions = buildRollingShowcaseSessionBlueprints(now)
    expect(sessions).toHaveLength(12)
    expect(new Set(sessions.map((session) => session.id)).size).toBe(12)
    for (const session of sessions) {
      expect(session.startsAt.getTime()).toBeGreaterThan(now.getTime())
      expect(session.startsAt.getTime()).toBeLessThanOrEqual(now.getTime() + 14 * 86_400_000)
      expect(session.reservedCount).toBe(0)
      expect(session.endsAt.getTime()).toBeGreaterThan(session.startsAt.getTime())
    }
    expect(buildRollingShowcaseSessionBlueprints(new Date('2026-09-21T01:00:00Z'))).toEqual(sessions)
  })

  it.each([
    ['2026-03-23T00:00:00Z', '2026-03-23T17:00:00.000Z', '2026-03-30T16:00:00.000Z'],
    ['2026-10-19T00:00:00Z', '2026-10-19T16:00:00.000Z', '2026-10-26T17:00:00.000Z'],
  ])('keeps Madrid wall times across DST from %s', (now, first, second) => {
    const sessions = buildRollingShowcaseSessionBlueprints(new Date(now))
      .filter((session) => session.key === 'dinamicoTarde')
    expect(sessions.map((session) => session.startsAt.toISOString())).toEqual([first, second])
  })

  it('rolls expired slots forward without renaming overlapping sessions', () => {
    const first = buildRollingShowcaseSessionBlueprints(new Date('2026-09-21T00:00:00Z'))
    const later = buildRollingShowcaseSessionBlueprints(new Date('2026-09-28T00:00:00Z'))
    expect(later).toHaveLength(12)
    expect(later.filter((session) => first.some((old) => old.id === session.id))).toHaveLength(6)
    expect(later.every((session) => session.startsAt > new Date('2026-09-28T00:00:00Z'))).toBe(true)
  })

  it('uses the Madrid calendar at the UTC day boundary', () => {
    const sessions = buildRollingShowcaseSessionBlueprints(new Date('2026-09-20T23:30:00Z'))
    expect(sessions[0].id).toBe('showcase-rolling-dinamicoTarde-2026-09-21')
  })
})
