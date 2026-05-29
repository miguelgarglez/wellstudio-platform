import { prisma } from '@/lib/db/prisma'
import { isOperableLeadStatus } from '@/modules/leads/server/admin-leads-overview'

export type AdminLeadStatusTarget = 'NEW' | 'CONTACTED' | 'LOST'

const ADMIN_LEAD_STATUS_TARGETS = ['NEW', 'CONTACTED', 'LOST'] as const

export type UpdateAdminLeadStatusResult =
  | {
      success: true
      leadId: string
      status: AdminLeadStatusTarget
    }
  | {
      success: false
      message: string
    }

export async function updateAdminLeadStatus(input: {
  leadId: string
  status: string
}): Promise<UpdateAdminLeadStatusResult> {
  const leadId = input.leadId.trim()
  const status = normalizeLeadStatusTarget(input.status)

  if (!leadId) {
    return {
      success: false,
      message: 'Falta la solicitud que querías actualizar.',
    }
  }

  if (!status) {
    return {
      success: false,
      message: 'El estado elegido no está disponible en esta versión.',
    }
  }

  const existingLead = await prisma.lead.findUnique({
    where: {
      id: leadId,
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (!existingLead) {
    return {
      success: false,
      message: 'No encontramos esa solicitud de contacto.',
    }
  }

  if (!isOperableLeadStatus(existingLead.status)) {
    return {
      success: false,
      message: 'Esta solicitud pertenece a un estado que no se edita desde esta vista.',
    }
  }

  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      status,
    },
    select: {
      id: true,
    },
  })

  return {
    success: true,
    leadId,
    status,
  }
}

export function normalizeLeadStatusTarget(status: string | null | undefined) {
  return ADMIN_LEAD_STATUS_TARGETS.includes(status as AdminLeadStatusTarget)
    ? (status as AdminLeadStatusTarget)
    : null
}
