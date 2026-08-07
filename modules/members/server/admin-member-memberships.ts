import { Prisma } from '@prisma/client'
import type { MemberMembershipStatus } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'

export type AdminMembershipActor = {
  userId: string
  displayName: string
}

export type AdminMembershipOperationResult =
  | {
      success: true
      memberId: string
      membershipId: string
      status: 'ACTIVE' | 'CANCELED'
    }
  | {
      success: false
      message: string
      field?: 'planId' | 'startsOn' | 'endsOn' | 'reason'
      code?: 'NOT_FOUND' | 'CONFLICT' | 'EXTERNAL_PROVIDER'
    }

export async function assignManualMembership(input: {
  memberId: string
  membershipPlanId: string
  startsOn: string
  endsOn?: string | null
  reason: string
  actor: AdminMembershipActor
  now?: Date
}): Promise<AdminMembershipOperationResult> {
  const now = input.now ?? new Date()
  const startsAt = parseCalendarDate(input.startsOn, 'start')
  const endsAt = input.endsOn ? parseCalendarDate(input.endsOn, 'end') : null
  const reason = input.reason.trim()

  if (!input.memberId || !input.membershipPlanId) {
    return { success: false, code: 'NOT_FOUND', message: 'No encontramos el socio o el plan seleccionado.' }
  }

  if (!startsAt) {
    return { success: false, field: 'startsOn', message: 'Indica una fecha de inicio válida.' }
  }

  if (input.endsOn && !endsAt) {
    return { success: false, field: 'endsOn', message: 'Indica una fecha de fin válida.' }
  }

  if (endsAt && endsAt <= startsAt) {
    return { success: false, field: 'endsOn', message: 'La fecha de fin debe ser posterior al inicio.' }
  }

  if (startsAt > now) {
    return {
      success: false,
      field: 'startsOn',
      message: 'La asignación manual debe comenzar hoy o en una fecha pasada. Las activaciones futuras requieren un workflow programado.',
    }
  }

  if (!isMeaningfulReason(reason)) {
    return { success: false, field: 'reason', message: 'Explica la asignación con un motivo de entre 5 y 240 caracteres.' }
  }

  const status = 'ACTIVE' as const

  return prisma.$transaction(async (tx) => {
    const [member, plan, conflictingMembership] = await Promise.all([
      tx.member.findUnique({
        where: { id: input.memberId },
        select: { id: true, firstName: true, lastName: true },
      }),
      tx.membershipPlan.findFirst({
        where: { id: input.membershipPlanId, status: 'ACTIVE' },
        select: { id: true, name: true },
      }),
      tx.memberMembership.findFirst({
        where: { memberId: input.memberId, status },
        select: { id: true, status: true, membershipPlan: { select: { name: true } } },
      }),
    ])

    if (!member || !plan) {
      return { success: false, code: 'NOT_FOUND', message: 'El socio o el plan activo ya no está disponible.' }
    }

    if (conflictingMembership) {
      return {
        success: false,
        code: 'CONFLICT',
        message: `El socio ya tiene una membership activa (${conflictingMembership.membershipPlan.name}). Finalízala o revisa su vigencia antes de asignar otra.`,
      }
    }

    const membership = await tx.memberMembership.create({
      data: {
        memberId: member.id,
        membershipPlanId: plan.id,
        status,
        startsAt,
        endsAt,
        autoRenews: false,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'MEMBER_MEMBERSHIP_ASSIGNED',
        entityType: 'MemberMembership',
        entityId: membership.id,
        contextJson: {
          memberId: member.id,
          memberDisplayName: displayName(member),
          membershipPlanId: plan.id,
          membershipPlanName: plan.name,
          status,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt?.toISOString() ?? null,
          reason,
          actorDisplayName: input.actor.displayName,
          assignmentSource: 'ADMIN_MANUAL',
        },
      },
    })

    return { success: true, memberId: member.id, membershipId: membership.id, status }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function endManualMembership(input: {
  memberId: string
  membershipId: string
  expectedStatus: MemberMembershipStatus
  reason: string
  actor: AdminMembershipActor
  now?: Date
}): Promise<AdminMembershipOperationResult> {
  const now = input.now ?? new Date()
  const reason = input.reason.trim()

  if (!input.memberId || !input.membershipId) {
    return { success: false, code: 'NOT_FOUND', message: 'La membership ya no existe.' }
  }

  if (!isEndableMembershipStatus(input.expectedStatus)) {
    return { success: false, code: 'CONFLICT', message: 'Esta membership ya no admite finalización manual.' }
  }

  if (!isMeaningfulReason(reason)) {
    return { success: false, field: 'reason', message: 'Explica la finalización con un motivo de entre 5 y 240 caracteres.' }
  }

  return prisma.$transaction(async (tx) => {
    const membership = await tx.memberMembership.findFirst({
      where: { id: input.membershipId, memberId: input.memberId },
      select: {
        id: true,
        memberId: true,
        status: true,
        providerSubscriptionId: true,
        membershipPlan: { select: { id: true, name: true } },
        member: { select: { firstName: true, lastName: true } },
      },
    })

    if (!membership) {
      return { success: false, code: 'NOT_FOUND', message: 'La membership ya no existe.' }
    }

    if (membership.status !== input.expectedStatus || !isEndableMembershipStatus(membership.status)) {
      return { success: false, code: 'CONFLICT', message: 'Otro operador ha cambiado la membership. Recarga la ficha antes de continuar.' }
    }

    if (membership.providerSubscriptionId) {
      return {
        success: false,
        code: 'EXTERNAL_PROVIDER',
        message: 'Esta membership está vinculada a un proveedor externo y debe finalizarse desde su flujo contractual.',
      }
    }

    const updated = await tx.memberMembership.updateMany({
      where: { id: membership.id, memberId: input.memberId, status: input.expectedStatus },
      data: { status: 'CANCELED', autoRenews: false },
    })

    if (updated.count !== 1) {
      return { success: false, code: 'CONFLICT', message: 'La membership cambió mientras operabas. Recarga la ficha y vuelve a intentarlo.' }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'MEMBER_MEMBERSHIP_ENDED',
        entityType: 'MemberMembership',
        entityId: membership.id,
        contextJson: {
          memberId: membership.memberId,
          memberDisplayName: displayName(membership.member),
          membershipPlanId: membership.membershipPlan.id,
          membershipPlanName: membership.membershipPlan.name,
          fromStatus: membership.status,
          toStatus: 'CANCELED',
          endedAt: now.toISOString(),
          reason,
          actorDisplayName: input.actor.displayName,
          existingReservationsPreserved: true,
        },
      },
    })

    return {
      success: true,
      memberId: membership.memberId,
      membershipId: membership.id,
      status: 'CANCELED',
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function isEndableMembershipStatus(status: MemberMembershipStatus) {
  return status === 'ACTIVE' || status === 'PENDING_ACTIVATION'
}

export function parseCalendarDate(value: string, boundary: 'start' | 'end') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const start = zonedStartOfDay(year, month, day, WELLSTUDIO_TIME_ZONE)
  if (!start || formatCalendarDate(start, WELLSTUDIO_TIME_ZONE) !== value) return null

  if (boundary === 'start') return start

  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
  const nextStart = zonedStartOfDay(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    WELLSTUDIO_TIME_ZONE,
  )
  return nextStart ? new Date(nextStart.getTime() - 1) : null
}

function zonedStartOfDay(year: number, month: number, day: number, timeZone: string) {
  const utcGuess = Date.UTC(year, month - 1, day)
  const guess = new Date(utcGuess)
  if (Number.isNaN(guess.getTime())) return null
  const parts = dateTimeParts(guess, timeZone)
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return new Date(utcGuess - (representedAsUtc - utcGuess))
}

function dateTimeParts(date: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function formatCalendarDate(date: Date, timeZone: string) {
  const parts = dateTimeParts(date, timeZone)
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`
}

function isMeaningfulReason(reason: string) {
  return reason.length >= 5 && reason.length <= 240
}

function displayName(member: { firstName: string; lastName: string }) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
}
