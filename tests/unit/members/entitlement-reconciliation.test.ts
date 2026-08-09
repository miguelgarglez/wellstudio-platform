import { beforeEach, describe, expect, it, vi } from 'vitest'

const { membershipUpdateManyMock, creditAccountUpdateManyMock } = vi.hoisted(() => ({
  membershipUpdateManyMock: vi.fn(),
  creditAccountUpdateManyMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    memberMembership: { updateMany: membershipUpdateManyMock },
    memberCreditAccount: { updateMany: creditAccountUpdateManyMock },
  },
}))

import { reconcileExpiredEntitlements } from '@/modules/members/server/entitlement-reconciliation'

describe('entitlement reconciliation', () => {
  beforeEach(() => {
    membershipUpdateManyMock.mockReset()
    creditAccountUpdateManyMock.mockReset()
  })

  it('expires active records whose validity ends at the reconciliation instant', async () => {
    const now = new Date('2026-08-09T05:30:00.000Z')
    membershipUpdateManyMock.mockResolvedValue({ count: 2 })
    creditAccountUpdateManyMock.mockResolvedValue({ count: 3 })

    await expect(reconcileExpiredEntitlements({ now })).resolves.toEqual({
      reconciledAt: now,
      expiredMemberships: 2,
      expiredCreditAccounts: 3,
    })
    expect(membershipUpdateManyMock).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', endsAt: { lte: now } },
      data: { status: 'EXPIRED' },
    })
    expect(creditAccountUpdateManyMock).toHaveBeenCalledWith({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    })
  })

  it('reconciles memberships and credit accounts against one shared instant', async () => {
    const now = new Date('2026-08-09T05:30:00.000Z')
    const repository = {
      expireMemberships: vi.fn().mockResolvedValue(2),
      expireCreditAccounts: vi.fn().mockResolvedValue(3),
    }

    await expect(reconcileExpiredEntitlements({ now }, repository)).resolves.toEqual({
      reconciledAt: now,
      expiredMemberships: 2,
      expiredCreditAccounts: 3,
    })
    expect(repository.expireMemberships).toHaveBeenCalledWith(now)
    expect(repository.expireCreditAccounts).toHaveBeenCalledWith(now)
  })

  it('is a no-op when no stale active records remain', async () => {
    const repository = {
      expireMemberships: vi.fn().mockResolvedValue(0),
      expireCreditAccounts: vi.fn().mockResolvedValue(0),
    }

    await expect(reconcileExpiredEntitlements({}, repository)).resolves.toMatchObject({
      expiredMemberships: 0,
      expiredCreditAccounts: 0,
    })
  })
})
