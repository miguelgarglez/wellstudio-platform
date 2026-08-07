import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, refundCreditUsageMock, tx } = vi.hoisted(() => {
  const transaction = {
    classType: { findUnique: vi.fn() },
    coach: { findUnique: vi.fn() },
    classSession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    reservation: { update: vi.fn() },
    waitlistEntry: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
    memberCreditAccount: { findUnique: vi.fn(), update: vi.fn() },
    creditLedgerEntry: { create: vi.fn() },
  }
  return {
    tx: transaction,
    prismaMock: {
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
    refundCreditUsageMock: vi.fn(),
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/modules/reservations/server/member-reservation-mutations', () => ({
  refundCreditUsage: refundCreditUsageMock,
}))

import {
  cancelAdminClassSession,
  parseEuropeMadridDateTime,
  resolveNextStatus,
  saveAdminClassSession,
} from '@/modules/classes/server/admin-class-sessions'

const actor = { userId: 'admin-1', displayName: 'Admin E2E' }
const now = new Date('2026-08-07T10:00:00.000Z')

describe('admin class sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('only allows deliberate status transitions', () => {
    expect(resolveNextStatus('DRAFT', 'publish')).toBe('PUBLISHED')
    expect(resolveNextStatus('PUBLISHED', 'close')).toBe('CLOSED')
    expect(resolveNextStatus('CLOSED', 'reopen')).toBe('PUBLISHED')
    expect(resolveNextStatus('DRAFT', 'close')).toBeNull()
    expect(resolveNextStatus('CANCELED', 'reopen')).toBeNull()
  })

  it('interprets local admin times in Europe/Madrid across daylight saving', () => {
    expect(parseEuropeMadridDateTime('2026-08-08T18:00').toISOString()).toBe(
      '2026-08-08T16:00:00.000Z',
    )
    expect(parseEuropeMadridDateTime('2026-12-08T18:00').toISOString()).toBe(
      '2026-12-08T17:00:00.000Z',
    )
    expect(Number.isNaN(parseEuropeMadridDateTime('not-a-date').getTime())).toBe(true)
  })

  it('rejects capacity below current occupancy', async () => {
    tx.classType.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Strength',
      durationMinutes: 50,
      status: 'ACTIVE',
    })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      status: 'PUBLISHED',
      reservedCount: 6,
    })

    const result = await saveAdminClassSession({
      sessionId: 'session-1',
      classTypeId: 'class-1',
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      capacity: 5,
      waitlistEnabled: true,
      publish: true,
      actor,
      now,
    })

    expect(result).toEqual({
      success: false,
      field: 'capacity',
      message: 'La capacidad no puede bajar de 6, que es la ocupación actual.',
    })
    expect(tx.classSession.update).not.toHaveBeenCalled()
  })

  it('rejects a coach overlap before persisting', async () => {
    tx.classType.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Strength',
      durationMinutes: 50,
      status: 'ACTIVE',
    })
    tx.coach.findUnique.mockResolvedValue({ id: 'coach-1', status: 'ACTIVE' })
    tx.classSession.findFirst.mockResolvedValue({ id: 'overlap' })

    const result = await saveAdminClassSession({
      classTypeId: 'class-1',
      coachId: 'coach-1',
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      capacity: 8,
      waitlistEnabled: true,
      publish: false,
      actor,
      now,
    })

    expect(result).toEqual({
      success: false,
      field: 'coachId',
      message: 'El coach ya tiene otra sesión en ese horario.',
    })
    expect(tx.classSession.create).not.toHaveBeenCalled()
  })

  it('cancels bookings, refunds credits, expires waitlist and audits atomically', async () => {
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      status: 'PUBLISHED',
      startsAt: new Date('2026-08-09T12:00:00.000Z'),
      reservations: [
        {
          id: 'reservation-1',
          entitlementUsages: [
            { memberCreditAccountId: 'credit-1', creditsUsed: 2 },
          ],
        },
      ],
    })
    tx.classSession.update.mockResolvedValue({ id: 'session-1' })

    const result = await cancelAdminClassSession({
      sessionId: 'session-1',
      reason: 'Cierre extraordinario del estudio',
      actor,
      now,
    })

    expect(result).toEqual({ success: true, sessionId: 'session-1', status: 'CANCELED' })
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: expect.objectContaining({
        status: 'CANCELED',
        canceledByUserId: 'admin-1',
      }),
    })
    expect(refundCreditUsageMock).toHaveBeenCalledWith(tx, {
      memberCreditAccountId: 'credit-1',
      creditsUsed: 2,
      reservationId: 'reservation-1',
      now,
      notes: 'Credit refunded after an administrator canceled the class session',
    })
    expect(tx.waitlistEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'EXPIRED', expiredAt: now } }),
    )
    expect(tx.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'CANCELED', reservedCount: 0 },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'CLASS_SESSION_CANCELED',
        entityType: 'ClassSession',
        entityId: 'session-1',
      }),
    })
  })
})
