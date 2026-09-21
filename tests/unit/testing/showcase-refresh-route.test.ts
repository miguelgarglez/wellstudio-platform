import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { refreshShowcaseMock } = vi.hoisted(() => ({ refreshShowcaseMock: vi.fn() }))

vi.mock('@/modules/testing/server/showcase-refresh', () => ({
  refreshShowcase: refreshShowcaseMock,
}))

import { GET } from '@/app/api/internal/showcase/refresh/route'

const summary = {
  refreshedAt: '2026-09-21T00:00:00.000Z',
  horizonEndsAt: '2026-10-05T00:00:00.000Z',
  createdCount: 12,
  existingCount: 0,
  futureSessionCount: 12,
  firstSessionStartsAt: '2026-09-21T16:00:00.000Z',
  lastSessionStartsAt: '2026-10-01T07:00:00.000Z',
}

function request(authorization = 'Bearer test-secret') {
  return new Request('http://localhost/api/internal/showcase/refresh', {
    headers: authorization ? { authorization } : {},
  })
}

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'test-secret')
  refreshShowcaseMock.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('showcase refresh route', () => {
  it('returns 503 without running refresh when CRON_SECRET is missing', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await GET(request())).status).toBe(503)
    expect(refreshShowcaseMock).not.toHaveBeenCalled()
  })

  it.each(['', 'Bearer wrong', 'test-secret'])('rejects invalid authorization %s', async (header) => {
    expect((await GET(request(header))).status).toBe(401)
    expect(refreshShowcaseMock).not.toHaveBeenCalled()
  })

  it('reports unconfigured sandbox or catalog as unavailable', async () => {
    refreshShowcaseMock.mockResolvedValue({ ok: false, error: 'Unavailable.' })
    const response = await GET(request())
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'Unavailable.' })
  })

  it('returns only health and counters after an authorized additive refresh', async () => {
    refreshShowcaseMock.mockResolvedValue({ ok: true, summary })
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ healthy: true, ...summary })
  })

  it('alerts the scheduler when no published future sessions remain', async () => {
    refreshShowcaseMock.mockResolvedValue({
      ok: true,
      summary: { ...summary, createdCount: 0, futureSessionCount: 0 },
    })
    const response = await GET(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ healthy: false, futureSessionCount: 0 })
  })
})
