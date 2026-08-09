import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { reconcileExpiredEntitlementsMock } = vi.hoisted(() => ({
  reconcileExpiredEntitlementsMock: vi.fn(),
}))

vi.mock('@/modules/members/server/entitlement-reconciliation', () => ({
  reconcileExpiredEntitlements: reconcileExpiredEntitlementsMock,
}))

import { GET } from '@/app/api/internal/maintenance/reconcile-entitlements/route'

describe('entitlement reconciliation route', () => {
  const previousSecret = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret'
    reconcileExpiredEntitlementsMock.mockReset()
  })

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previousSecret
  })

  it('rejects unauthenticated requests without running maintenance', async () => {
    const response = await GET(
      new Request('http://localhost/api/internal/maintenance/reconcile-entitlements'),
    )

    expect(response.status).toBe(401)
    expect(reconcileExpiredEntitlementsMock).not.toHaveBeenCalled()
  })

  it('fails closed when scheduled operations are not configured', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(
      new Request('http://localhost/api/internal/maintenance/reconcile-entitlements'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Scheduled operations are not configured.',
    })
    expect(reconcileExpiredEntitlementsMock).not.toHaveBeenCalled()
  })

  it('returns only reconciliation counters to an authenticated cron', async () => {
    reconcileExpiredEntitlementsMock.mockResolvedValue({
      reconciledAt: new Date('2026-08-09T05:30:00.000Z'),
      expiredMemberships: 2,
      expiredCreditAccounts: 3,
    })

    const response = await GET(
      new Request('http://localhost/api/internal/maintenance/reconcile-entitlements', {
        headers: { Authorization: 'Bearer cron-secret' },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      reconciledAt: '2026-08-09T05:30:00.000Z',
      expiredMemberships: 2,
      expiredCreditAccounts: 3,
    })
  })
})
