import { beforeEach, describe, expect, it, vi } from 'vitest'

const { transactionMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: transactionMock,
  },
}))

import {
  grantMembershipPeriodAllowanceOverride,
  grantMembershipSessionAccessOverride,
  revokeMembershipBookingOverride,
} from '@/modules/reservations/server/membership-booking-overrides'

function createTransactionMock() {
  return {
    memberMembership: {
      findUnique: vi.fn(),
    },
    classSession: {
      findUnique: vi.fn(),
    },
    memberMembershipBookingOverride: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe('membership booking overrides', () => {
  beforeEach(() => {
    transactionMock.mockReset()
  })

  it('grants extra allowance for the current policy period and audits it', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.memberMembership.findUnique.mockResolvedValue({
      id: 'membership-1',
      membershipPlan: {
        bookingPolicy: {
          policyType: 'PERIODIC_ALLOWANCE',
          periodType: 'CALENDAR_WEEK',
        },
      },
    })
    tx.memberMembershipBookingOverride.create.mockResolvedValue({
      id: 'override-1',
      overrideType: 'EXTRA_ALLOWANCE',
    })
    tx.auditLog.create.mockResolvedValue({ id: 'audit-1' })

    const result = await grantMembershipPeriodAllowanceOverride({
      memberMembershipId: 'membership-1',
      extraBookings: 1,
      actorUserId: 'admin-1',
      reason: 'Compensación puntual',
      effectiveAt: new Date('2026-04-08T10:00:00.000Z'),
    })

    expect(result).toMatchObject({
      id: 'override-1',
      overrideType: 'EXTRA_ALLOWANCE',
    })
    expect(tx.memberMembershipBookingOverride.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberMembershipId: 'membership-1',
        overrideType: 'EXTRA_ALLOWANCE',
        extraBookings: 1,
        grantedByUserId: 'admin-1',
        reason: 'Compensación puntual',
      }),
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actionType: 'member_membership_booking_override.granted',
        entityType: 'member_membership_booking_override',
        entityId: 'override-1',
      }),
    })
  })

  it('rejects extra allowance when the membership has no periodic policy', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.memberMembership.findUnique.mockResolvedValue({
      id: 'membership-1',
      membershipPlan: {
        bookingPolicy: {
          policyType: 'UNLIMITED',
          periodType: null,
        },
      },
    })

    await expect(
      grantMembershipPeriodAllowanceOverride({
        memberMembershipId: 'membership-1',
        extraBookings: 1,
        actorUserId: 'admin-1',
        reason: 'Compensación puntual',
      }),
    ).rejects.toThrow('Period allowance overrides require a periodic booking policy')
  })

  it('returns an existing active session override instead of duplicating it', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.memberMembership.findUnique.mockResolvedValue({ id: 'membership-1' })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-08T18:00:00.000Z'),
      endsAt: new Date('2026-04-08T18:50:00.000Z'),
    })
    tx.memberMembershipBookingOverride.findFirst.mockResolvedValue({
      id: 'override-existing',
      overrideType: 'SESSION_ACCESS',
    })

    const result = await grantMembershipSessionAccessOverride({
      memberMembershipId: 'membership-1',
      classSessionId: 'session-1',
      actorUserId: 'admin-1',
      reason: 'Invitación puntual',
      effectiveAt: new Date('2026-04-08T09:00:00.000Z'),
    })

    expect(result).toMatchObject({
      id: 'override-existing',
      overrideType: 'SESSION_ACCESS',
    })
    expect(tx.memberMembershipBookingOverride.create).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('revokes an active override and records the audit event', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.memberMembershipBookingOverride.findUnique.mockResolvedValue({
      id: 'override-1',
      revokedAt: null,
    })
    tx.memberMembershipBookingOverride.update.mockResolvedValue({
      id: 'override-1',
      revokedAt: new Date('2026-04-08T10:00:00.000Z'),
      revokedByUserId: 'admin-1',
    })
    tx.auditLog.create.mockResolvedValue({ id: 'audit-1' })

    const result = await revokeMembershipBookingOverride({
      overrideId: 'override-1',
      actorUserId: 'admin-1',
      revokedAt: new Date('2026-04-08T10:00:00.000Z'),
      reason: 'Corrección manual',
    })

    expect(result).toMatchObject({
      id: 'override-1',
      revokedByUserId: 'admin-1',
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actionType: 'member_membership_booking_override.revoked',
        entityId: 'override-1',
      }),
    })
  })
})
