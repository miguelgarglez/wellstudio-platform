import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    reservation: { findUnique: vi.fn(), update: vi.fn() },
    classSession: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  }
  return {
    tx: transaction,
    prismaMock: {
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import {
  completeAdminClassSession,
  mapAttendanceToReservationStatus,
  updateAdminReservationAttendance,
} from '@/modules/classes/server/admin-session-attendance'

const actor = { userId: 'admin-1', displayName: 'Admin E2E' }
const now = new Date('2026-08-07T18:00:00.000Z')

describe('admin session attendance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps reservation and attendance statuses aligned', () => {
    expect(mapAttendanceToReservationStatus('PENDING')).toBe('BOOKED')
    expect(mapAttendanceToReservationStatus('ATTENDED')).toBe('ATTENDED')
    expect(mapAttendanceToReservationStatus('NO_SHOW')).toBe('NO_SHOW')
  })

  it('does not open check-in more than two hours early', async () => {
    tx.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      status: 'BOOKED',
      attendanceStatus: 'PENDING',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-08-07T20:30:00.000Z'),
        status: 'PUBLISHED',
      },
    })

    const result = await updateAdminReservationAttendance({
      reservationId: 'reservation-1',
      expectedStatus: 'PENDING',
      attendanceStatus: 'ATTENDED',
      actor,
      now,
    })

    expect(result).toEqual({ success: false, message: 'La asistencia se abre dos horas antes de la sesión.' })
    expect(tx.reservation.update).not.toHaveBeenCalled()
  })

  it('rejects stale updates instead of silently overwriting another operator', async () => {
    tx.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      status: 'ATTENDED',
      attendanceStatus: 'ATTENDED',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-08-07T17:00:00.000Z'),
        status: 'PUBLISHED',
      },
    })

    const result = await updateAdminReservationAttendance({
      reservationId: 'reservation-1',
      expectedStatus: 'PENDING',
      attendanceStatus: 'NO_SHOW',
      actor,
      now,
    })

    expect(result).toEqual({
      success: false,
      message: 'La asistencia cambió en otra sesión. Recarga antes de corregirla.',
    })
  })

  it('updates attendance and records the actor in the audit log', async () => {
    tx.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      status: 'BOOKED',
      attendanceStatus: 'PENDING',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-08-07T17:00:00.000Z'),
        status: 'CLOSED',
      },
    })

    const result = await updateAdminReservationAttendance({
      reservationId: 'reservation-1',
      expectedStatus: 'PENDING',
      attendanceStatus: 'ATTENDED',
      actor,
      now,
    })

    expect(result).toEqual({ success: true, sessionId: 'session-1', attendanceStatus: 'ATTENDED' })
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: { attendanceStatus: 'ATTENDED', status: 'ATTENDED' },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actionType: 'RESERVATION_ATTENDANCE_UPDATED',
        entityId: 'reservation-1',
      }),
    })
  })

  it('does not reintroduce pending work into a completed session', async () => {
    tx.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      status: 'ATTENDED',
      attendanceStatus: 'ATTENDED',
      classSession: {
        id: 'session-1',
        startsAt: new Date('2026-08-07T17:00:00.000Z'),
        status: 'COMPLETED',
      },
    })

    const result = await updateAdminReservationAttendance({
      reservationId: 'reservation-1',
      expectedStatus: 'ATTENDED',
      attendanceStatus: 'PENDING',
      actor,
      now,
    })

    expect(result).toEqual({
      success: false,
      message: 'Una sesión completada no puede volver a tener asistencias pendientes.',
    })
  })

  it('blocks completion while attendance remains pending', async () => {
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      status: 'CLOSED',
      endsAt: new Date('2026-08-07T17:50:00.000Z'),
      _count: { reservations: 2 },
    })

    const result = await completeAdminClassSession({ sessionId: 'session-1', actor, now })

    expect(result).toEqual({
      success: false,
      message: 'Quedan 2 asistencias pendientes. Resuélvelas antes de completar.',
    })
    expect(tx.classSession.update).not.toHaveBeenCalled()
  })

  it('completes a finished session with a fully resolved roster', async () => {
    tx.classSession.findUnique.mockResolvedValue({
      id: 'session-1',
      status: 'CLOSED',
      endsAt: new Date('2026-08-07T17:50:00.000Z'),
      _count: { reservations: 0 },
    })

    const result = await completeAdminClassSession({ sessionId: 'session-1', actor, now })

    expect(result).toEqual({ success: true, sessionId: 'session-1' })
    expect(tx.classSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'COMPLETED' },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: 'CLASS_SESSION_COMPLETED' }),
    })
  })
})
