import { Prisma, type ClassSessionStatus } from '@prisma/client'
import { randomUUID } from 'node:crypto'

import { prisma } from '@/lib/db/prisma'
import { enqueueAdminSessionNotifications } from '@/modules/notifications/server/notification-outbox'
import type { SessionChangeSnapshot } from '@/modules/notifications/server/session-change-email'
import { refundCreditUsage } from '@/modules/reservations/server/member-reservation-mutations'

const ACTIVE_SESSION_STATUSES: ClassSessionStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED']
const ACTIVE_WAITLIST_STATUSES = ['WAITING', 'NOTIFIED'] as const

export type AdminSessionMutationResult =
  | {
      success: true
      sessionId: string
      status: ClassSessionStatus
      notificationJobIds?: string[]
    }
  | { success: false; message: string; field?: AdminSessionField }

export type AdminSessionField =
  | 'classTypeId'
  | 'coachId'
  | 'startsAt'
  | 'capacity'
  | 'locationLabel'
  | 'impactReason'
  | 'reason'
  | 'status'

export type AdminSessionActor = {
  userId: string
  displayName: string
}

export type SaveAdminSessionInput = {
  sessionId?: string | null
  classTypeId: string
  coachId?: string | null
  startsAt: Date
  capacity: number
  locationLabel?: string | null
  waitlistEnabled: boolean
  publish: boolean
  expectedUpdatedAt?: Date | null
  acknowledgeMemberImpact?: boolean
  impactReason?: string | null
  actor: AdminSessionActor
  now?: Date
}

export async function saveAdminClassSession(
  input: SaveAdminSessionInput,
): Promise<AdminSessionMutationResult> {
  const now = input.now ?? new Date()
  const operationId = randomUUID()

  if (!input.classTypeId) {
    return failure('Selecciona un tipo de clase.', 'classTypeId')
  }
  if (Number.isNaN(input.startsAt.getTime()) || input.startsAt <= now) {
    return failure('El inicio debe ser una fecha futura válida.', 'startsAt')
  }
  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    return failure('La capacidad debe ser un entero positivo.', 'capacity')
  }
  if ((input.locationLabel?.trim().length ?? 0) > 120) {
    return failure('La ubicación no puede superar 120 caracteres.', 'locationLabel')
  }

  return prisma.$transaction(async (tx) => {
    const classType = await tx.classType.findUnique({
      where: { id: input.classTypeId },
      select: { id: true, name: true, durationMinutes: true, status: true },
    })
    if (!classType || classType.status !== 'ACTIVE') {
      return failure('El tipo de clase no está activo.', 'classTypeId')
    }

    if (input.coachId) {
      const coach = await tx.coach.findUnique({
        where: { id: input.coachId },
        select: { id: true, status: true },
      })
      if (!coach || coach.status !== 'ACTIVE') {
        return failure('El coach seleccionado no está activo.', 'coachId')
      }
    }

    const endsAt = new Date(input.startsAt.getTime() + classType.durationMinutes * 60_000)
    const existing = input.sessionId
      ? await tx.classSession.findUnique({
          where: { id: input.sessionId },
          select: {
            id: true,
            classTypeId: true,
            coachId: true,
            startsAt: true,
            endsAt: true,
            capacity: true,
            locationLabel: true,
            waitlistEnabled: true,
            status: true,
            reservedCount: true,
            updatedAt: true,
            classType: { select: { name: true } },
            coach: { select: { displayName: true } },
            _count: {
              select: {
                waitlistEntries: { where: { status: { in: [...ACTIVE_WAITLIST_STATUSES] } } },
              },
            },
          },
        })
      : null

    if (input.sessionId && !existing) {
      return failure('La sesión ya no existe.', 'status')
    }
    if (existing && !ACTIVE_SESSION_STATUSES.includes(existing.status)) {
      return failure('Esta sesión ya no admite cambios.', 'status')
    }
    if (
      existing &&
      (!input.expectedUpdatedAt ||
        Number.isNaN(input.expectedUpdatedAt.getTime()) ||
        existing.updatedAt.getTime() !== input.expectedUpdatedAt.getTime())
    ) {
      return failure(
        'La sesión cambió mientras la editabas. Cierra este panel y revisa la versión actual antes de volver a guardar.',
        'status',
      )
    }
    if (existing && input.capacity < existing.reservedCount) {
      return failure(
        `La capacidad no puede bajar de ${existing.reservedCount}, que es la ocupación actual.`,
        'capacity',
      )
    }

    const materialChange = existing
      ? hasMaterialSessionChange(existing, {
          classTypeId: classType.id,
          coachId: input.coachId || null,
          startsAt: input.startsAt,
        })
      : false
    const hasDemand = existing
      ? existing.reservedCount > 0 || existing._count.waitlistEntries > 0
      : false
    const impactReason = input.impactReason?.trim() ?? ''

    if (materialChange && hasDemand && !input.acknowledgeMemberImpact) {
      return failure(
        'Confirma que has revisado el impacto sobre socios con reserva o en espera.',
        'impactReason',
      )
    }
    if (materialChange && hasDemand && impactReason.length < 5) {
      return failure('Indica un motivo del cambio de al menos 5 caracteres.', 'impactReason')
    }
    if (impactReason.length > 500) {
      return failure('El motivo del cambio no puede superar 500 caracteres.', 'impactReason')
    }

    if (input.coachId) {
      const overlap = await tx.classSession.findFirst({
        where: {
          coachId: input.coachId,
          id: input.sessionId ? { not: input.sessionId } : undefined,
          status: { in: ACTIVE_SESSION_STATUSES },
          startsAt: { lt: endsAt },
          endsAt: { gt: input.startsAt },
        },
        select: { id: true },
      })
      if (overlap) {
        return failure('El coach ya tiene otra sesión en ese horario.', 'coachId')
      }
    }

    const status: ClassSessionStatus = input.publish ? 'PUBLISHED' : existing?.status ?? 'DRAFT'
    let session: { id: string; status: ClassSessionStatus }
    if (existing) {
      const updated = await tx.classSession.updateMany({
        where: { id: existing.id, updatedAt: existing.updatedAt },
        data: {
          classTypeId: classType.id,
          coachId: input.coachId || null,
          startsAt: input.startsAt,
          endsAt,
          capacity: input.capacity,
          locationLabel: input.locationLabel?.trim() || null,
          waitlistEnabled: input.waitlistEnabled,
          status,
          publishedAt:
            existing.status === 'DRAFT' && status === 'PUBLISHED' ? now : undefined,
        },
      })
      if (updated.count !== 1) {
        return failure(
          'La sesión cambió mientras la editabas. Cierra este panel y revisa la versión actual antes de volver a guardar.',
          'status',
        )
      }
      session = { id: existing.id, status }
    } else {
      session = await tx.classSession.create({
        data: {
          classTypeId: classType.id,
          coachId: input.coachId || null,
          startsAt: input.startsAt,
          endsAt,
          capacity: input.capacity,
          locationLabel: input.locationLabel?.trim() || null,
          waitlistEnabled: input.waitlistEnabled,
          status,
          publishedAt: status === 'PUBLISHED' ? now : null,
        },
        select: { id: true, status: true },
      })
    }

    await createSessionAudit(tx, {
      actor: input.actor,
      actionType: existing ? 'CLASS_SESSION_UPDATED' : 'CLASS_SESSION_CREATED',
      sessionId: session.id,
      context: {
        classTypeId: classType.id,
        classTypeName: classType.name,
        coachId: input.coachId || null,
        startsAt: input.startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        capacity: input.capacity,
        locationLabel: input.locationLabel?.trim() || null,
        waitlistEnabled: Number(input.waitlistEnabled),
        status: session.status,
        previousClassTypeId: existing?.classTypeId ?? null,
        previousCoachId: existing?.coachId ?? null,
        previousStartsAt: existing?.startsAt.toISOString() ?? null,
        previousEndsAt: existing?.endsAt.toISOString() ?? null,
        previousCapacity: existing?.capacity ?? null,
        previousLocationLabel: existing?.locationLabel ?? null,
        previousWaitlistEnabled: existing ? Number(existing.waitlistEnabled) : null,
        materialChange: Number(materialChange),
        impactReason: materialChange && hasDemand ? impactReason : null,
      },
    })

    const notificationJobs =
      existing && materialChange && hasDemand
        ? await enqueueAdminSessionNotifications(tx, {
            eventType: 'SESSION_RESCHEDULED',
            sessionId: session.id,
            operationId,
            occurredAt: now,
            previous: toSessionChangeSnapshot(existing),
            reason: impactReason,
          })
        : []

    return {
      success: true,
      sessionId: session.id,
      status: session.status,
      notificationJobIds: notificationJobs.map((job) => job.id),
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function hasMaterialSessionChange(
  current: { classTypeId: string; coachId: string | null; startsAt: Date },
  next: { classTypeId: string; coachId: string | null; startsAt: Date },
) {
  return (
    current.classTypeId !== next.classTypeId ||
    current.coachId !== next.coachId ||
    current.startsAt.getTime() !== next.startsAt.getTime()
  )
}

export async function changeAdminClassSessionStatus(input: {
  sessionId: string
  action: 'publish' | 'close' | 'reopen'
  actor: AdminSessionActor
  now?: Date
}): Promise<AdminSessionMutationResult> {
  const now = input.now ?? new Date()

  return prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: input.sessionId },
      select: { id: true, status: true, startsAt: true },
    })
    if (!session) return failure('La sesión ya no existe.', 'status')
    if (session.startsAt <= now) return failure('Una sesión iniciada ya no puede cambiar de estado.', 'status')

    const nextStatus = resolveNextStatus(session.status, input.action)
    if (!nextStatus) return failure('Ese cambio de estado no es válido para esta sesión.', 'status')

    await tx.classSession.update({
      where: { id: session.id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === 'PUBLISHED' ? now : undefined,
      },
    })
    await createSessionAudit(tx, {
      actor: input.actor,
      actionType: `CLASS_SESSION_${nextStatus}`,
      sessionId: session.id,
      context: { fromStatus: session.status, toStatus: nextStatus },
    })
    return { success: true, sessionId: session.id, status: nextStatus }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function cancelAdminClassSession(input: {
  sessionId: string
  reason: string
  actor: AdminSessionActor
  now?: Date
}): Promise<AdminSessionMutationResult> {
  const reason = input.reason.trim()
  const now = input.now ?? new Date()
  const operationId = randomUUID()

  if (reason.length < 5) return failure('Indica una razón de al menos 5 caracteres.', 'reason')
  if (reason.length > 500) return failure('La razón no puede superar 500 caracteres.', 'reason')

  return prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: input.sessionId },
      include: {
        reservations: {
          where: { status: 'BOOKED' },
          include: {
            entitlementUsages: {
              where: { usageType: 'CREDIT' },
              select: { memberCreditAccountId: true, creditsUsed: true },
            },
          },
        },
      },
    })
    if (!session) return failure('La sesión ya no existe.', 'status')
    if (!ACTIVE_SESSION_STATUSES.includes(session.status) || session.startsAt <= now) {
      return failure('Esta sesión ya no se puede cancelar.', 'status')
    }

    const notificationJobs = await enqueueAdminSessionNotifications(tx, {
      eventType: 'SESSION_CANCELED',
      sessionId: session.id,
      operationId,
      occurredAt: now,
      previous: null,
      reason,
    })

    for (const reservation of session.reservations) {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'CANCELED',
          canceledAt: now,
          canceledByUserId: input.actor.userId,
          cancellationReason: reason,
        },
      })
      for (const usage of reservation.entitlementUsages) {
        if (usage.memberCreditAccountId && usage.creditsUsed) {
          await refundCreditUsage(tx, {
            memberCreditAccountId: usage.memberCreditAccountId,
            creditsUsed: usage.creditsUsed,
            reservationId: reservation.id,
            now,
            notes: 'Credit refunded after an administrator canceled the class session',
          })
        }
      }
    }

    await tx.waitlistEntry.updateMany({
      where: { classSessionId: session.id, status: { in: [...ACTIVE_WAITLIST_STATUSES] } },
      data: { status: 'EXPIRED', expiredAt: now },
    })
    await tx.classSession.update({
      where: { id: session.id },
      data: { status: 'CANCELED', reservedCount: 0 },
    })
    await createSessionAudit(tx, {
      actor: input.actor,
      actionType: 'CLASS_SESSION_CANCELED',
      sessionId: session.id,
      context: {
        fromStatus: session.status,
        reason,
        canceledReservations: session.reservations.length,
      },
    })

    return {
      success: true,
      sessionId: session.id,
      status: 'CANCELED',
      notificationJobIds: notificationJobs.map((job) => job.id),
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function resolveNextStatus(
  current: ClassSessionStatus,
  action: 'publish' | 'close' | 'reopen',
): ClassSessionStatus | null {
  if (action === 'publish' && current === 'DRAFT') return 'PUBLISHED'
  if (action === 'close' && current === 'PUBLISHED') return 'CLOSED'
  if (action === 'reopen' && current === 'CLOSED') return 'PUBLISHED'
  return null
}

export function parseEuropeMadridDateTime(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return new Date(Number.NaN)

  const [, year, month, day, hour, minute] = match
  const desiredUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )
  let candidate = desiredUtc

  // Iterate to account for Europe/Madrid daylight-saving offsets without a date library.
  for (let index = 0; index < 2; index += 1) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(candidate))
    const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    const representedUtc = Date.UTC(
      Number(mapped.year),
      Number(mapped.month) - 1,
      Number(mapped.day),
      Number(mapped.hour),
      Number(mapped.minute),
    )
    candidate -= representedUtc - desiredUtc
  }

  return new Date(candidate)
}

function failure(message: string, field?: AdminSessionField): AdminSessionMutationResult {
  return { success: false, message, field }
}

function toSessionChangeSnapshot(session: {
  classType: { name: string }
  coach: { displayName: string } | null
  locationLabel: string | null
  startsAt: Date
  endsAt: Date
}): SessionChangeSnapshot {
  return {
    className: session.classType.name,
    coachName: session.coach?.displayName ?? null,
    locationLabel: session.locationLabel,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
  }
}

async function createSessionAudit(
  tx: Prisma.TransactionClient,
  input: {
    actor: AdminSessionActor
    actionType: string
    sessionId: string
    context: Record<string, string | number | null>
  },
) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actor.userId,
      actionType: input.actionType,
      entityType: 'ClassSession',
      entityId: input.sessionId,
      contextJson: {
        ...input.context,
        actorDisplayName: input.actor.displayName,
      },
    },
  })
}
