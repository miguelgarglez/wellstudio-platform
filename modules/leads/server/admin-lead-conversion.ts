import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type { AdminLeadActor } from '@/modules/leads/server/admin-lead-operations'

type LeadConversionSnapshot = {
  id: string
  status: string
  convertedMemberId: string | null
}

export type LeadConversionRepository = {
  findLead: (leadId: string) => Promise<LeadConversionSnapshot | null>
  memberExists: (memberId: string) => Promise<boolean>
  convert: (input: {
    leadId: string
    memberId: string
    fromStatus: 'QUALIFIED'
    note: string | null
    actor: AdminLeadActor
  }) => Promise<boolean>
}

const repository: LeadConversionRepository = {
  async findLead(leadId) {
    return prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, status: true, convertedMemberId: true },
    })
  },
  async memberExists(memberId) {
    return Boolean(await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } }))
  },
  async convert(input) {
    return prisma.$transaction(async (tx) => {
      const changed = await tx.lead.updateMany({
        where: {
          id: input.leadId,
          status: input.fromStatus,
          convertedMemberId: null,
        },
        data: { status: 'CONVERTED', convertedMemberId: input.memberId },
      })

      if (changed.count !== 1) return false

      await tx.leadActivity.create({
        data: {
          leadId: input.leadId,
          type: 'STATUS_CHANGED',
          fromStatus: input.fromStatus,
          toStatus: 'CONVERTED',
          note: input.note,
          actorUserId: input.actor.userId,
          actorDisplayName: input.actor.displayName,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.actor.userId,
          actionType: 'LEAD_CONVERTED',
          entityType: 'Lead',
          entityId: input.leadId,
          contextJson: { memberId: input.memberId, fromStatus: input.fromStatus },
        },
      })
      return true
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  },
}

export async function convertAdminLeadToMember(
  input: { leadId: string; memberId: string; note?: string | null; actor: AdminLeadActor },
  conversionRepository: LeadConversionRepository = repository,
) {
  const leadId = input.leadId.trim()
  const memberId = input.memberId.trim()
  const note = input.note?.trim() || null

  if (!leadId || !memberId) {
    return { success: false as const, message: 'Selecciona la solicitud y el socio que quieres vincular.' }
  }
  if (note && note.length > 1000) {
    return { success: false as const, message: 'La nota no puede superar 1000 caracteres.', field: 'note' as const }
  }

  const [lead, memberExists] = await Promise.all([
    conversionRepository.findLead(leadId),
    conversionRepository.memberExists(memberId),
  ])
  if (!lead) return { success: false as const, message: 'No encontramos esa solicitud.' }
  if (!memberExists) return { success: false as const, message: 'No encontramos el socio seleccionado.' }
  if (lead.status === 'CONVERTED' || lead.convertedMemberId) {
    return { success: false as const, message: 'Esta solicitud ya está vinculada a un socio.' }
  }
  if (lead.status !== 'QUALIFIED') {
    return { success: false as const, message: 'Marca primero la solicitud como interesada antes de convertirla.' }
  }

  const converted = await conversionRepository.convert({
    leadId,
    memberId,
    fromStatus: 'QUALIFIED',
    note,
    actor: input.actor,
  })
  if (!converted) {
    return { success: false as const, message: 'La solicitud cambió mientras la editabas. Recarga e inténtalo de nuevo.' }
  }
  return { success: true as const, leadId, memberId }
}
