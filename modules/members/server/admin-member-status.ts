import { Prisma } from '@prisma/client'
import type { MemberStatus } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

export type AdminMemberOperableStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type AdminMemberStatusActor = {
  userId: string
  displayName: string
}

export type AdminMemberStatusResult =
  | { success: true; memberId: string; status: AdminMemberOperableStatus }
  | { success: false; message: string; field?: 'status' | 'reason'; code?: 'NOT_FOUND' | 'CONFLICT' }

export async function changeAdminMemberStatus(input: {
  memberId: string
  expectedStatus: MemberStatus
  status: string
  reason: string
  actor: AdminMemberStatusActor
}): Promise<AdminMemberStatusResult> {
  const status = parseOperableMemberStatus(input.status)
  const reason = input.reason.trim()

  if (!input.memberId) {
    return { success: false, code: 'NOT_FOUND', message: 'El socio ya no existe.' }
  }

  if (!status) {
    return { success: false, field: 'status', message: 'Selecciona un estado válido.' }
  }

  if (status === input.expectedStatus) {
    return { success: false, field: 'status', message: 'Selecciona un estado diferente al actual.' }
  }

  if (reason.length < 5 || reason.length > 240) {
    return {
      success: false,
      field: 'reason',
      message: 'Explica el cambio con un motivo de entre 5 y 240 caracteres.',
    }
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({
      where: { id: input.memberId },
      select: { id: true, status: true, firstName: true, lastName: true },
    })

    if (!member) {
      return { success: false, code: 'NOT_FOUND', message: 'El socio ya no existe.' }
    }

    if (member.status !== input.expectedStatus) {
      return {
        success: false,
        code: 'CONFLICT',
        message: 'Otro operador ha cambiado el estado. Recarga la ficha antes de continuar.',
      }
    }

    const updated = await tx.member.updateMany({
      where: { id: member.id, status: input.expectedStatus },
      data: { status },
    })

    if (updated.count !== 1) {
      return {
        success: false,
        code: 'CONFLICT',
        message: 'El estado cambió mientras operabas. Recarga la ficha y vuelve a intentarlo.',
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'MEMBER_STATUS_CHANGED',
        entityType: 'Member',
        entityId: member.id,
        contextJson: {
          fromStatus: member.status,
          toStatus: status,
          reason,
          memberDisplayName: [member.firstName, member.lastName].filter(Boolean).join(' ').trim(),
          actorDisplayName: input.actor.displayName,
        },
      },
    })

    return { success: true, memberId: member.id, status }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function parseOperableMemberStatus(status: string): AdminMemberOperableStatus | null {
  return status === 'ACTIVE' || status === 'INACTIVE' || status === 'BLOCKED' ? status : null
}
