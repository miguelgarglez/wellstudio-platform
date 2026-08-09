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
  cancelMemberReservation,
  joinSessionWaitlist,
  leaveSessionWaitlist,
  promoteWaitlistIfPossibleInTransaction,
  reservePublishedSession,
} from '@/modules/reservations/server/member-reservation-mutations'

function createTransactionMock() {
  return {
    member: {
      findUnique: vi.fn().mockResolvedValue({
        status: 'ACTIVE',
        firstName: 'Ana',
        lastName: 'Socio',
        user: { email: 'ana@example.com' },
      }),
    },
    classSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    reservation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    waitlistEntry: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    memberMembership: {
      findMany: vi.fn(),
    },
    memberCreditAccount: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creditLedgerEntry: {
      create: vi.fn(),
    },
    reservationEntitlementUsage: {
      create: vi.fn(),
    },
    notificationJob: {
      upsert: vi.fn().mockResolvedValue({ id: 'notification-job-1' }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  }
}

function withTransaction<T extends Record<string, unknown>>(tx: T) {
  transactionMock.mockImplementation(async (callback: (client: T) => Promise<unknown>) => {
    return callback(tx)
  })
}

describe('member reservation mutations', () => {
  beforeEach(() => {
    transactionMock.mockReset()
  })

  it('books a published session with membership entitlement usage', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [
          {
            id: 'rule-membership',
            ruleType: 'MEMBERSHIP_PLAN',
            membershipPlanId: 'plan-premium',
            creditCost: null,
            priority: 0,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            isActive: true,
          },
        ],
      },
    })
    tx.reservation.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    tx.memberMembership.findMany.mockResolvedValue([
      {
        id: 'membership-1',
        membershipPlanId: 'plan-premium',
        status: 'ACTIVE',
        startsAt: new Date('2026-04-01T00:00:00.000Z'),
        endsAt: null,
        membershipPlan: {
          bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
          bookingPolicy: null,
        },
        bookingOverrides: [],
        usages: [],
      },
    ])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.reservation.create.mockResolvedValue({ id: 'reservation-1' })
    tx.reservationEntitlementUsage.create.mockResolvedValue({ id: 'usage-1' })
    tx.classSession.update.mockResolvedValue({})

    const result = await reservePublishedSession({
      memberId: 'member-1',
      userId: 'user-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toMatchObject({
      success: true,
      code: 'BOOKED',
      updatedEntityId: 'reservation-1',
    })
    expect(tx.reservationEntitlementUsage.create).toHaveBeenCalledWith({
      data: {
        reservationId: 'reservation-1',
        usageType: 'MEMBERSHIP',
        memberMembershipId: 'membership-1',
      },
    })
    expect(tx.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { reservedCount: { increment: 1 } },
    })
    expect(tx.notificationJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: 'RESERVATION_BOOKED',
          recipient: 'ana@example.com',
          referenceId: 'reservation-1',
        }),
      }),
    )
    expect(result.notificationJobIds).toEqual(['notification-job-1'])
  })

  it('blocks new reservations when the member is not active', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)
    tx.member.findUnique.mockResolvedValue({ status: 'BLOCKED' })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [{
          id: 'rule-membership',
          ruleType: 'MEMBERSHIP_PLAN',
          membershipPlanId: 'plan-premium',
          creditCost: null,
          priority: 0,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        }],
      },
    })
    tx.reservation.findFirst.mockResolvedValue(null)
    tx.waitlistEntry.findFirst.mockResolvedValue(null)
    tx.memberMembership.findMany.mockResolvedValue([])
    tx.memberCreditAccount.findMany.mockResolvedValue([])

    const result = await reservePublishedSession({
      memberId: 'member-1',
      userId: 'user-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toEqual({
      success: false,
      code: 'MEMBER_NOT_ACTIVE',
      message: 'Tu cuenta de socio no está activa para realizar nuevas reservas.',
      updatedEntityId: undefined,
    })
    expect(tx.reservation.create).not.toHaveBeenCalled()
    expect(tx.notificationJob.upsert).not.toHaveBeenCalled()
  })

  it('books for staff with a STAFF source and atomic audit evidence', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [{
          id: 'rule-membership',
          ruleType: 'MEMBERSHIP_PLAN',
          membershipPlanId: 'plan-premium',
          creditCost: null,
          priority: 0,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        }],
      },
    })
    tx.reservation.findFirst.mockResolvedValue(null)
    tx.waitlistEntry.findFirst.mockResolvedValue(null)
    tx.memberMembership.findMany.mockResolvedValue([{
      id: 'membership-1',
      membershipPlanId: 'plan-premium',
      status: 'ACTIVE',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      endsAt: null,
      membershipPlan: { bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS', bookingPolicy: null },
      bookingOverrides: [],
      usages: [],
    }])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.reservation.create.mockResolvedValue({ id: 'reservation-staff' })
    tx.reservationEntitlementUsage.create.mockResolvedValue({ id: 'usage-staff' })
    tx.classSession.update.mockResolvedValue({})

    const result = await reservePublishedSession({
      memberId: 'member-1',
      userId: 'admin-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
      staffOperation: { actorDisplayName: 'Admin Sandbox' },
    })

    expect(result.code).toBe('BOOKED')
    expect(tx.reservation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: 'STAFF' }),
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'admin-1',
        actionType: 'STAFF_RESERVATION_BOOKED',
        entityType: 'Reservation',
        entityId: 'reservation-staff',
        contextJson: {
          memberId: 'member-1',
          classSessionId: 'session-1',
          actorDisplayName: 'Admin Sandbox',
        },
      },
    })
  })

  it('books a published session with manual override entitlement usage', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [
          {
            id: 'rule-membership',
            ruleType: 'MEMBERSHIP_PLAN',
            membershipPlanId: 'plan-premium',
            creditCost: null,
            priority: 0,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            isActive: true,
          },
        ],
      },
    })
    tx.reservation.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    tx.memberMembership.findMany.mockResolvedValue([
      {
        id: 'membership-1',
        membershipPlanId: 'plan-premium',
        status: 'ACTIVE',
        startsAt: new Date('2026-04-01T00:00:00.000Z'),
        endsAt: null,
        membershipPlan: {
          bookingPolicyType: 'LIMITED_WEEKLY_BOOKINGS',
          bookingPolicy: {
            policyType: 'PERIODIC_ALLOWANCE',
            periodType: 'CALENDAR_WEEK',
            allowanceCount: 1,
          },
        },
        bookingOverrides: [
          {
            id: 'override-session-1',
            overrideType: 'SESSION_ACCESS',
            classSessionId: 'session-1',
            extraBookings: null,
            startsAt: new Date('2026-04-01T00:00:00.000Z'),
            expiresAt: new Date('2026-04-06T00:00:00.000Z'),
            revokedAt: null,
          },
        ],
        usages: [
          {
            usageType: 'MEMBERSHIP',
            bookingOverrideId: null,
            reservation: {
              status: 'BOOKED',
              classSession: {
                id: 'session-used-1',
                startsAt: new Date('2026-04-02T18:00:00.000Z'),
              },
            },
          },
        ],
      },
    ])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.reservation.create.mockResolvedValue({ id: 'reservation-override-1' })
    tx.reservationEntitlementUsage.create.mockResolvedValue({ id: 'usage-override-1' })
    tx.classSession.update.mockResolvedValue({})

    const result = await reservePublishedSession({
      memberId: 'member-1',
      userId: 'user-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toMatchObject({
      success: true,
      code: 'BOOKED',
      updatedEntityId: 'reservation-override-1',
    })
    expect(tx.reservationEntitlementUsage.create).toHaveBeenCalledWith({
      data: {
        reservationId: 'reservation-override-1',
        usageType: 'MANUAL_OVERRIDE',
        memberMembershipId: 'membership-1',
        bookingOverrideId: 'override-session-1',
      },
    })
  })

  it('blocks duplicate bookings before creating a second reservation', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [],
      },
    })
    tx.reservation.findFirst.mockResolvedValueOnce({ id: 'reservation-existing' })

    const result = await reservePublishedSession({
      memberId: 'member-1',
      userId: 'user-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toEqual({
      success: false,
      code: 'ALREADY_BOOKED',
      message: 'Ya tienes una reserva activa para esta sesión.',
      updatedEntityId: 'reservation-existing',
    })
    expect(tx.reservation.create).not.toHaveBeenCalled()
  })

  it('blocks member cancellation outside the 120 minute window', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.reservation.findFirst.mockResolvedValue({
      id: 'reservation-1',
      memberId: 'member-1',
      status: 'BOOKED',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        capacity: 10,
        reservedCount: 7,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: {
          name: 'Grupo Premium',
          eligibilityRules: [],
        },
      },
      entitlementUsages: [],
    })

    const result = await cancelMemberReservation({
      memberId: 'member-1',
      userId: 'user-1',
      reservationId: 'reservation-1',
      now: new Date('2026-04-05T16:15:00.000Z'),
    })

    expect(result.code).toBe('CANCELLATION_WINDOW_CLOSED')
    expect(tx.reservation.update).not.toHaveBeenCalled()
  })

  it('refunds consumed credits when a reservation is canceled inside the allowed window', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.reservation.findFirst.mockResolvedValue({
      id: 'reservation-1',
      memberId: 'member-1',
      status: 'BOOKED',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        capacity: 10,
        reservedCount: 7,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: {
          name: 'Grupo Premium',
          eligibilityRules: [],
        },
      },
      entitlementUsages: [
        {
          id: 'usage-1',
          usageType: 'CREDIT',
          memberCreditAccountId: 'credits-1',
          creditsUsed: 2,
        },
      ],
    })
    tx.reservation.update.mockResolvedValue({})
    tx.classSession.update.mockResolvedValue({})
    tx.memberCreditAccount.findUnique.mockResolvedValue({
      id: 'credits-1',
      status: 'DEPLETED',
      expiresAt: new Date('2026-06-01T00:00:00.000Z'),
      creditPack: {
        creditsTotal: 10,
      },
      ledgerEntries: [{ balanceAfter: 0 }],
    })
    tx.creditLedgerEntry.create.mockResolvedValue({ id: 'refund-1' })
    tx.memberCreditAccount.update.mockResolvedValue({})
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [],
      },
    })
    tx.waitlistEntry.findFirst.mockResolvedValue(null)

    const result = await cancelMemberReservation({
      memberId: 'member-1',
      userId: 'user-1',
      reservationId: 'reservation-1',
      now: new Date('2026-04-05T14:30:00.000Z'),
    })

    expect(result).toMatchObject({
      success: true,
      code: 'CANCELED',
    })
    expect(tx.notificationJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: 'RESERVATION_CANCELED',
          referenceId: 'reservation-1',
        }),
      }),
    )
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        memberCreditAccountId: 'credits-1',
        entryType: 'RESERVATION_REFUND',
        creditsDelta: 2,
        balanceAfter: 2,
        referenceType: 'reservation',
        referenceId: 'reservation-1',
        notes: 'Credit refunded after member cancellation inside the allowed window',
      },
    })
  })

  it('allows staff cancellation outside the member window only with an audited reason', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)
    tx.reservation.findFirst.mockResolvedValue({
      id: 'reservation-1',
      memberId: 'member-1',
      status: 'BOOKED',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        capacity: 10,
        reservedCount: 7,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: { name: 'Grupo Premium', eligibilityRules: [] },
      },
      entitlementUsages: [],
    })
    tx.reservation.update.mockResolvedValue({})
    tx.classSession.update.mockResolvedValue({})
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 10,
      reservedCount: 6,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: { name: 'Grupo Premium', eligibilityRules: [] },
    })
    tx.waitlistEntry.findFirst.mockResolvedValue(null)

    const result = await cancelMemberReservation({
      memberId: 'member-1',
      userId: 'admin-1',
      reservationId: 'reservation-1',
      now: new Date('2026-04-05T16:15:00.000Z'),
      staffOperation: {
        actorDisplayName: 'Admin Sandbox',
        reason: 'Incidencia comunicada por teléfono',
      },
    })

    expect(result.code).toBe('CANCELED')
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: expect.objectContaining({
        canceledByUserId: 'admin-1',
        cancellationReason: 'Staff-assisted cancellation: Incidencia comunicada por teléfono',
      }),
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'STAFF_RESERVATION_CANCELED',
        contextJson: expect.objectContaining({
          reason: 'Incidencia comunicada por teléfono',
        }),
      }),
    })
  })

  it('rejects a staff cancellation without a meaningful reason before opening a transaction', async () => {
    const result = await cancelMemberReservation({
      memberId: 'member-1',
      userId: 'admin-1',
      reservationId: 'reservation-1',
      staffOperation: { actorDisplayName: 'Admin Sandbox', reason: 'no' },
    })

    expect(result).toMatchObject({ success: false, code: 'INVALID_REASON' })
    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('joins waitlist with the next available position after eligibility succeeds', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 4,
      reservedCount: 4,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [
          {
            id: 'membership-rule',
            ruleType: 'MEMBERSHIP_PLAN',
            membershipPlanId: 'plan-premium',
            creditCost: null,
            priority: 0,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            isActive: true,
          },
        ],
      },
    })
    tx.reservation.findFirst.mockResolvedValue(null)
    tx.waitlistEntry.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ position: 2 })
    tx.memberMembership.findMany.mockResolvedValue([
      {
        id: 'membership-1',
        membershipPlanId: 'plan-premium',
        status: 'ACTIVE',
        startsAt: new Date('2026-04-01T00:00:00.000Z'),
        endsAt: null,
        membershipPlan: {
          bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
          bookingPolicy: null,
        },
        bookingOverrides: [],
        usages: [],
      },
    ])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.waitlistEntry.create.mockResolvedValue({ id: 'waitlist-3' })

    const result = await joinSessionWaitlist({
      memberId: 'member-1',
      userId: 'user-1',
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toMatchObject({
      success: true,
      code: 'WAITLIST_JOINED',
      updatedEntityId: 'waitlist-3',
    })
    expect(tx.waitlistEntry.create).toHaveBeenCalledWith({
      data: {
        memberId: 'member-1',
        classSessionId: 'session-1',
        position: 3,
        status: 'WAITING',
        joinedAt: new Date('2026-04-03T10:00:00.000Z'),
      },
    })
  })

  it('leaves waitlist and resequences remaining active entries', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)

    tx.waitlistEntry.findFirst.mockResolvedValue({
      id: 'waitlist-1',
      classSession: {
        id: 'session-1',
        classType: {
          name: 'Grupo Premium',
        },
      },
    })
    tx.waitlistEntry.update.mockResolvedValue({})
    tx.waitlistEntry.findMany.mockResolvedValue([{ id: 'waitlist-2' }])

    const result = await leaveSessionWaitlist({
      memberId: 'member-1',
      userId: 'user-1',
      waitlistEntryId: 'waitlist-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(result).toMatchObject({
      success: true,
      code: 'WAITLIST_LEFT',
    })
    expect(tx.waitlistEntry.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'waitlist-1',
      },
      data: {
        status: 'REMOVED',
      },
    })
    expect(tx.waitlistEntry.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: 'waitlist-2',
      },
      data: {
        position: 1,
      },
    })
  })

  it('audits staff waitlist entry and removal without bypassing eligibility', async () => {
    const tx = createTransactionMock()
    withTransaction(tx)
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      startsAt: new Date('2026-04-05T18:00:00.000Z'),
      endsAt: new Date('2026-04-05T18:45:00.000Z'),
      capacity: 4,
      reservedCount: 4,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      classType: {
        name: 'Grupo Premium',
        eligibilityRules: [{
          id: 'membership-rule',
          ruleType: 'MEMBERSHIP_PLAN',
          membershipPlanId: 'plan-premium',
          creditCost: null,
          priority: 0,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        }],
      },
    })
    tx.reservation.findFirst.mockResolvedValue(null)
    tx.waitlistEntry.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'waitlist-staff',
        classSession: { id: 'session-1', classType: { name: 'Grupo Premium' } },
      })
    tx.memberMembership.findMany.mockResolvedValue([{
      id: 'membership-1',
      membershipPlanId: 'plan-premium',
      status: 'ACTIVE',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      endsAt: null,
      membershipPlan: { bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS', bookingPolicy: null },
      bookingOverrides: [],
      usages: [],
    }])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.waitlistEntry.create.mockResolvedValue({ id: 'waitlist-staff' })
    tx.waitlistEntry.update.mockResolvedValue({})
    tx.waitlistEntry.findMany.mockResolvedValue([])

    const actor = { actorDisplayName: 'Admin Sandbox' }
    const joined = await joinSessionWaitlist({
      memberId: 'member-1', userId: 'admin-1', classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'), staffOperation: actor,
    })
    const left = await leaveSessionWaitlist({
      memberId: 'member-1', userId: 'admin-1', waitlistEntryId: 'waitlist-staff',
      staffOperation: actor,
    })

    expect(joined.code).toBe('WAITLIST_JOINED')
    expect(left.code).toBe('WAITLIST_LEFT')
    expect(tx.auditLog.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({ actionType: 'STAFF_WAITLIST_JOINED' }),
    })
    expect(tx.auditLog.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ actionType: 'STAFF_WAITLIST_LEFT' }),
    })
  })

  it('skips ineligible waitlist entries and promotes the first eligible member', async () => {
    const tx = createTransactionMock()

    tx.classSession.findUnique
      .mockResolvedValueOnce({
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        endsAt: new Date('2026-04-05T18:45:00.000Z'),
        capacity: 5,
        reservedCount: 4,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: {
          name: 'Grupo Premium',
          eligibilityRules: [
            {
              id: 'membership-rule',
              ruleType: 'MEMBERSHIP_PLAN',
              membershipPlanId: 'plan-premium',
              creditCost: null,
              priority: 0,
              createdAt: new Date('2026-03-01T00:00:00.000Z'),
              isActive: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        endsAt: new Date('2026-04-05T18:45:00.000Z'),
        capacity: 5,
        reservedCount: 4,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: {
          name: 'Grupo Premium',
          eligibilityRules: [
            {
              id: 'membership-rule',
              ruleType: 'MEMBERSHIP_PLAN',
              membershipPlanId: 'plan-premium',
              creditCost: null,
              priority: 0,
              createdAt: new Date('2026-03-01T00:00:00.000Z'),
              isActive: true,
            },
          ],
        },
      })
      .mockResolvedValue({
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        endsAt: new Date('2026-04-05T18:45:00.000Z'),
        capacity: 5,
        reservedCount: 5,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: {
          name: 'Grupo Premium',
          eligibilityRules: [
            {
              id: 'membership-rule',
              ruleType: 'MEMBERSHIP_PLAN',
              membershipPlanId: 'plan-premium',
              creditCost: null,
              priority: 0,
              createdAt: new Date('2026-03-01T00:00:00.000Z'),
              isActive: true,
            },
          ],
        },
      })
    tx.waitlistEntry.findFirst
      .mockResolvedValueOnce({
        id: 'waitlist-ineligible',
        memberId: 'member-ineligible',
        status: 'WAITING',
      })
      .mockResolvedValueOnce({
        id: 'waitlist-eligible',
        memberId: 'member-eligible',
        status: 'WAITING',
      })
    tx.reservation.findFirst.mockResolvedValue(null)
    tx.memberMembership.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'membership-1',
          membershipPlanId: 'plan-premium',
          status: 'ACTIVE',
          startsAt: new Date('2026-04-01T00:00:00.000Z'),
          endsAt: null,
          membershipPlan: {
            bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
            bookingPolicy: null,
          },
          bookingOverrides: [],
          usages: [],
        },
      ])
    tx.memberCreditAccount.findMany.mockResolvedValue([])
    tx.waitlistEntry.update.mockResolvedValue({})
    tx.waitlistEntry.findMany.mockResolvedValue([])
    tx.reservation.create.mockResolvedValue({ id: 'reservation-promoted' })
    tx.reservationEntitlementUsage.create.mockResolvedValue({ id: 'usage-1' })
    tx.classSession.update.mockResolvedValue({})

    const promotions = await promoteWaitlistIfPossibleInTransaction(tx as never, {
      classSessionId: 'session-1',
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(promotions).toEqual([
      {
        reservationId: 'reservation-promoted',
        notificationJobId: 'notification-job-1',
      },
    ])
    expect(tx.notificationJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          eventType: 'WAITLIST_PROMOTED',
          recipient: 'ana@example.com',
          referenceId: 'reservation-promoted',
        }),
      }),
    )
    expect(tx.waitlistEntry.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'waitlist-ineligible',
      },
      data: {
        status: 'EXPIRED',
        expiredAt: new Date('2026-04-03T10:00:00.000Z'),
        position: null,
      },
    })
    expect(tx.waitlistEntry.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: 'waitlist-eligible',
      },
      data: {
        status: 'PROMOTED',
        promotedAt: new Date('2026-04-03T10:00:00.000Z'),
        position: null,
      },
    })
  })
})
