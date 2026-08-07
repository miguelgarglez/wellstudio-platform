import { Prisma, type AttendanceStatus, type ReservationStatus } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type { AdminSessionActor } from '@/modules/classes/server/admin-class-sessions'

const ATTENDANCE_OPEN_EARLY_MS = 2 * 60 * 60 * 1000
const OPERABLE_SESSION_STATUSES = ['PUBLISHED', 'CLOSED', 'COMPLETED'] as const

export type AdminAttendanceResult =
  | { success: true; sessionId: string; attendanceStatus?: AttendanceStatus }
  | { success: false; message: string }

export async function updateAdminReservationAttendance(input: {
  reservationId: string
  expectedStatus: AttendanceStatus
  attendanceStatus: AttendanceStatus
  actor: AdminSessionActor
  now?: Date
}): Promise<AdminAttendanceResult> {
  const now = input.now ?? new Date()
  if (!['PENDING', 'ATTENDED', 'NO_SHOW'].includes(input.attendanceStatus)) {
    return { success: false, message: 'El estado de asistencia no es válido.' }
  }

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: input.reservationId },
      select: {
        id: true,
        status: true,
        attendanceStatus: true,
        classSession: {
          select: { id: true, startsAt: true, status: true },
        },
      },
    })

    if (!reservation || !['BOOKED', 'ATTENDED', 'NO_SHOW'].includes(reservation.status)) {
      return { success: false, message: 'La reserva ya no está disponible para asistencia.' }
    }
    if (!OPERABLE_SESSION_STATUSES.includes(reservation.classSession.status as typeof OPERABLE_SESSION_STATUSES[number])) {
      return { success: false, message: 'La sesión no admite gestión de asistencia.' }
    }
    if (now.getTime() < reservation.classSession.startsAt.getTime() - ATTENDANCE_OPEN_EARLY_MS) {
      return { success: false, message: 'La asistencia se abre dos horas antes de la sesión.' }
    }
    if (reservation.attendanceStatus !== input.expectedStatus) {
      return { success: false, message: 'La asistencia cambió en otra sesión. Recarga antes de corregirla.' }
    }
    if (reservation.classSession.status === 'COMPLETED' && input.attendanceStatus === 'PENDING') {
      return { success: false, message: 'Una sesión completada no puede volver a tener asistencias pendientes.' }
    }
    if (reservation.attendanceStatus === input.attendanceStatus) {
      return {
        success: true,
        sessionId: reservation.classSession.id,
        attendanceStatus: input.attendanceStatus,
      }
    }

    const nextReservationStatus = mapAttendanceToReservationStatus(input.attendanceStatus)
    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        attendanceStatus: input.attendanceStatus,
        status: nextReservationStatus,
      },
    })
    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'RESERVATION_ATTENDANCE_UPDATED',
        entityType: 'Reservation',
        entityId: reservation.id,
        contextJson: {
          classSessionId: reservation.classSession.id,
          fromStatus: reservation.attendanceStatus,
          toStatus: input.attendanceStatus,
          actorDisplayName: input.actor.displayName,
        },
      },
    })

    return {
      success: true,
      sessionId: reservation.classSession.id,
      attendanceStatus: input.attendanceStatus,
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function completeAdminClassSession(input: {
  sessionId: string
  actor: AdminSessionActor
  now?: Date
}): Promise<AdminAttendanceResult> {
  const now = input.now ?? new Date()

  return prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: input.sessionId },
      select: {
        id: true,
        status: true,
        endsAt: true,
        _count: { select: { reservations: { where: { status: 'BOOKED' } } } },
      },
    })
    if (!session || !['PUBLISHED', 'CLOSED'].includes(session.status)) {
      return { success: false, message: 'La sesión no se puede completar desde su estado actual.' }
    }
    if (session.endsAt > now) {
      return { success: false, message: 'La sesión todavía no ha terminado.' }
    }
    if (session._count.reservations > 0) {
      return {
        success: false,
        message: `Quedan ${session._count.reservations} asistencias pendientes. Resuélvelas antes de completar.`,
      }
    }

    await tx.classSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED' },
    })
    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'CLASS_SESSION_COMPLETED',
        entityType: 'ClassSession',
        entityId: session.id,
        contextJson: { fromStatus: session.status, actorDisplayName: input.actor.displayName },
      },
    })

    return { success: true, sessionId: session.id }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function mapAttendanceToReservationStatus(
  attendanceStatus: AttendanceStatus,
): ReservationStatus {
  if (attendanceStatus === 'ATTENDED') return 'ATTENDED'
  if (attendanceStatus === 'NO_SHOW') return 'NO_SHOW'
  return 'BOOKED'
}
