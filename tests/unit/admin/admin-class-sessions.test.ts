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
      updateMany: vi.fn(),
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
  hasMaterialSessionChange,
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

  it('distinguishes material schedule changes from safe operational edits', () => {
    const current = {
      classTypeId: 'class-1',
      coachId: 'coach-1',
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
    }

    expect(hasMaterialSessionChange(current, { ...current })).toBe(false)
    expect(hasMaterialSessionChange(current, { ...current, coachId: 'coach-2' })).toBe(true)
    expect(
      hasMaterialSessionChange(current, {
        ...current,
        startsAt: new Date('2026-08-08T13:00:00.000Z'),
      }),
    ).toBe(true)
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
      classTypeId: 'class-1',
      coachId: null,
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      endsAt: new Date('2026-08-08T12:50:00.000Z'),
      capacity: 8,
      locationLabel: null,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      reservedCount: 6,
      updatedAt: new Date('2026-08-07T09:00:00.000Z'),
      _count: { waitlistEntries: 0 },
    })

    const result = await saveAdminClassSession({
      sessionId: 'session-1',
      classTypeId: 'class-1',
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      capacity: 5,
      waitlistEnabled: true,
      publish: true,
      expectedUpdatedAt: new Date('2026-08-07T09:00:00.000Z'),
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

  it('rejects an edit based on a stale session version', async () => {
    tx.classType.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Strength',
      durationMinutes: 50,
      status: 'ACTIVE',
    })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      classTypeId: 'class-1',
      coachId: null,
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      endsAt: new Date('2026-08-08T12:50:00.000Z'),
      capacity: 8,
      locationLabel: null,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      reservedCount: 0,
      updatedAt: new Date('2026-08-07T09:30:00.000Z'),
      _count: { waitlistEntries: 0 },
    })

    const result = await saveAdminClassSession({
      sessionId: 'session-1',
      classTypeId: 'class-1',
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      capacity: 10,
      waitlistEnabled: true,
      publish: true,
      expectedUpdatedAt: new Date('2026-08-07T09:00:00.000Z'),
      actor,
      now,
    })

    expect(result).toEqual(expect.objectContaining({ success: false, field: 'status' }))
    expect(tx.classSession.updateMany).not.toHaveBeenCalled()
  })

  it('requires confirmation and a reason for material changes with demand', async () => {
    tx.classType.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Strength',
      durationMinutes: 50,
      status: 'ACTIVE',
    })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      classTypeId: 'class-1',
      coachId: null,
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      endsAt: new Date('2026-08-08T12:50:00.000Z'),
      capacity: 8,
      locationLabel: null,
      waitlistEnabled: true,
      status: 'PUBLISHED',
      reservedCount: 2,
      updatedAt: new Date('2026-08-07T09:00:00.000Z'),
      _count: { waitlistEntries: 1 },
    })

    const result = await saveAdminClassSession({
      sessionId: 'session-1',
      classTypeId: 'class-1',
      startsAt: new Date('2026-08-08T13:00:00.000Z'),
      capacity: 8,
      waitlistEnabled: true,
      publish: true,
      expectedUpdatedAt: new Date('2026-08-07T09:00:00.000Z'),
      actor,
      now,
    })

    expect(result).toEqual({
      success: false,
      field: 'impactReason',
      message: 'Confirma que has revisado el impacto sobre socios con reserva o en espera.',
    })
  })

  it('persists a confirmed material edit with before and after audit context', async () => {
    tx.classType.findUnique.mockResolvedValue({
      id: 'class-1',
      name: 'Strength',
      durationMinutes: 50,
      status: 'ACTIVE',
    })
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      classTypeId: 'class-1',
      coachId: null,
      startsAt: new Date('2026-08-08T12:00:00.000Z'),
      endsAt: new Date('2026-08-08T12:50:00.000Z'),
      capacity: 8,
      locationLabel: 'Sala 1',
      waitlistEnabled: true,
      status: 'PUBLISHED',
      reservedCount: 2,
      updatedAt: new Date('2026-08-07T09:00:00.000Z'),
      _count: { waitlistEntries: 0 },
    })
    tx.classSession.updateMany.mockResolvedValue({ count: 1 })

    const result = await saveAdminClassSession({
      sessionId: 'session-1',
      classTypeId: 'class-1',
      startsAt: new Date('2026-08-08T13:00:00.000Z'),
      capacity: 10,
      locationLabel: 'Sala 2',
      waitlistEnabled: true,
      publish: true,
      expectedUpdatedAt: new Date('2026-08-07T09:00:00.000Z'),
      acknowledgeMemberImpact: true,
      impactReason: 'Cambio comunicado por teléfono',
      actor,
      now,
    })

    expect(result).toEqual({ success: true, sessionId: 'session-1', status: 'PUBLISHED' })
    expect(tx.classSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'session-1', updatedAt: new Date('2026-08-07T09:00:00.000Z') } }),
    )
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'CLASS_SESSION_UPDATED',
        contextJson: expect.objectContaining({
          previousStartsAt: '2026-08-08T12:00:00.000Z',
          startsAt: '2026-08-08T13:00:00.000Z',
          impactReason: 'Cambio comunicado por teléfono',
        }),
      }),
    })
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
