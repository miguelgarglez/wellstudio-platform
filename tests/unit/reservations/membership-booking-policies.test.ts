import { beforeEach, describe, expect, it, vi } from 'vitest'

const { transactionMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: transactionMock,
  },
}))

import { upsertMembershipBookingPolicy } from '@/modules/reservations/server/membership-booking-policies'

function createTransactionMock() {
  return {
    membershipPlan: {
      findUnique: vi.fn(),
    },
    membershipBookingPolicy: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  }
}

function withTransaction<T extends Record<string, unknown>>(tx: T) {
  transactionMock.mockImplementation(async (callback: (client: T) => Promise<unknown>) => {
    return callback(tx)
  })
}

describe('upsertMembershipBookingPolicy', () => {
  beforeEach(() => {
    transactionMock.mockReset()
  })

  it('persists unlimited policies with null period and allowance', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.membershipPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      name: 'Fuerza Base',
    })
    tx.membershipBookingPolicy.upsert.mockResolvedValue({
      id: 'policy-1',
      policyType: 'UNLIMITED',
      periodType: null,
      allowanceCount: null,
    })
    tx.auditLog.create.mockResolvedValue({})

    await upsertMembershipBookingPolicy({
      membershipPlanId: 'plan-1',
      actorUserId: 'user-1',
      policyType: 'UNLIMITED',
    })

    expect(tx.membershipBookingPolicy.upsert).toHaveBeenCalledWith({
      where: {
        membershipPlanId: 'plan-1',
      },
      update: {
        policyType: 'UNLIMITED',
        periodType: null,
        allowanceCount: null,
      },
      create: {
        membershipPlanId: 'plan-1',
        policyType: 'UNLIMITED',
        periodType: null,
        allowanceCount: null,
      },
    })
  })

  it('requires a positive allowance for periodic policies', async () => {
    await expect(
      upsertMembershipBookingPolicy({
        membershipPlanId: 'plan-1',
        actorUserId: 'user-1',
        policyType: 'PERIODIC_ALLOWANCE',
        periodType: 'CALENDAR_WEEK',
        allowanceCount: 0,
      }),
    ).rejects.toThrow('Periodic booking policies require a positive allowance count')
  })
})
