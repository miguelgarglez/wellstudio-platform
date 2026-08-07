import { prisma } from '@/lib/db/prisma'

export const ADMIN_LEAD_NOTE_MAX_LENGTH = 1000

export type AdminLeadOperableStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'

export type AdminLeadActor = {
  userId: string
  displayName: string
}

type LeadSnapshot = {
  id: string
  status: string
}

type LeadOperationRepository = {
  findLead: (leadId: string) => Promise<LeadSnapshot | null>
  appendNote: (input: {
    leadId: string
    note: string
    actor: AdminLeadActor
  }) => Promise<void>
  changeStatus: (input: {
    leadId: string
    fromStatus: AdminLeadOperableStatus
    toStatus: AdminLeadOperableStatus
    note: string | null
    actor: AdminLeadActor
  }) => Promise<boolean>
}

type LeadOperationResult =
  | {
      success: true
      leadId: string
    }
  | {
      success: false
      message: string
      field?: 'note' | 'status'
    }

const TRANSITIONS: Record<AdminLeadOperableStatus, AdminLeadOperableStatus[]> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'LOST'],
  CONTACTED: ['NEW', 'QUALIFIED', 'LOST'],
  QUALIFIED: ['CONTACTED', 'LOST'],
  LOST: ['NEW'],
}

const OPERABLE_STATUSES = Object.keys(TRANSITIONS) as AdminLeadOperableStatus[]

const prismaLeadOperationRepository: LeadOperationRepository = {
  async findLead(leadId) {
    return prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, status: true },
    })
  },

  async appendNote({ leadId, note, actor }) {
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'NOTE',
        note,
        actorUserId: actor.userId,
        actorDisplayName: actor.displayName,
      },
    })
  },

  async changeStatus({ leadId, fromStatus, toStatus, note, actor }) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.lead.updateMany({
        where: {
          id: leadId,
          status: fromStatus,
        },
        data: {
          status: toStatus,
        },
      })

      if (updateResult.count !== 1) {
        return false
      }

      await tx.leadActivity.create({
        data: {
          leadId,
          type: 'STATUS_CHANGED',
          fromStatus,
          toStatus,
          note,
          actorUserId: actor.userId,
          actorDisplayName: actor.displayName,
        },
      })

      return true
    })
  },
}

export async function addAdminLeadNote(
  input: {
    leadId: string
    note: string
    actor: AdminLeadActor
  },
  repository: LeadOperationRepository = prismaLeadOperationRepository,
): Promise<LeadOperationResult> {
  const leadId = input.leadId.trim()
  const noteResult = normalizeLeadNote(input.note, true)

  if (!leadId) {
    return { success: false, message: 'Falta la solicitud que querías actualizar.' }
  }

  if (!noteResult.success) {
    return noteResult
  }

  const lead = await repository.findLead(leadId)

  if (!lead) {
    return { success: false, message: 'No encontramos esa solicitud de contacto.' }
  }

  if (lead.status === 'CONVERTED') {
    return {
      success: false,
      message: 'Las solicitudes convertidas son de solo lectura en esta vista.',
    }
  }

  if (!noteResult.note) {
    return { success: false, message: 'Escribe una nota para conservar el contexto.', field: 'note' }
  }

  await repository.appendNote({
    leadId,
    note: noteResult.note,
    actor: normalizeActor(input.actor),
  })

  return { success: true, leadId }
}

export async function updateAdminLeadStatus(
  input: {
    leadId: string
    status: string
    note?: string | null
    actor: AdminLeadActor
  },
  repository: LeadOperationRepository = prismaLeadOperationRepository,
): Promise<LeadOperationResult & { status?: AdminLeadOperableStatus }> {
  const leadId = input.leadId.trim()
  const status = normalizeLeadStatusTarget(input.status)

  if (!leadId) {
    return { success: false, message: 'Falta la solicitud que querías actualizar.' }
  }

  if (!status) {
    return {
      success: false,
      message: 'El estado elegido no está disponible para seguimiento.',
      field: 'status',
    }
  }

  const noteResult = normalizeLeadNote(input.note, status === 'LOST')

  if (!noteResult.success) {
    return noteResult
  }

  const lead = await repository.findLead(leadId)

  if (!lead) {
    return { success: false, message: 'No encontramos esa solicitud de contacto.' }
  }

  if (!isOperableLeadStatus(lead.status)) {
    return {
      success: false,
      message: 'Esta solicitud pertenece a un estado protegido y no se puede modificar.',
    }
  }

  if (!canTransitionLeadStatus(lead.status, status)) {
    return {
      success: false,
      message: lead.status === status
        ? 'La solicitud ya está en ese estado.'
        : 'Ese cambio de estado no está permitido desde el estado actual.',
      field: 'status',
    }
  }

  const changed = await repository.changeStatus({
    leadId,
    fromStatus: lead.status,
    toStatus: status,
    note: noteResult.note,
    actor: normalizeActor(input.actor),
  })

  if (!changed) {
    return {
      success: false,
      message: 'La solicitud cambió mientras la editabas. Recarga la vista e inténtalo de nuevo.',
    }
  }

  return { success: true, leadId, status }
}

export function getAllowedLeadStatusTransitions(status: string) {
  return isOperableLeadStatus(status) ? TRANSITIONS[status] : []
}

export function canTransitionLeadStatus(fromStatus: string, toStatus: string) {
  const normalizedTarget = normalizeLeadStatusTarget(toStatus)

  return Boolean(
    isOperableLeadStatus(fromStatus) &&
    normalizedTarget &&
    TRANSITIONS[fromStatus].includes(normalizedTarget),
  )
}

export function normalizeLeadStatusTarget(status: string | null | undefined) {
  return OPERABLE_STATUSES.includes(status as AdminLeadOperableStatus)
    ? (status as AdminLeadOperableStatus)
    : null
}

export function isOperableLeadStatus(status: string): status is AdminLeadOperableStatus {
  return OPERABLE_STATUSES.includes(status as AdminLeadOperableStatus)
}

function normalizeLeadNote(note: string | null | undefined, required: boolean):
  | { success: true; note: string | null }
  | { success: false; message: string; field: 'note' } {
  const normalizedNote = note?.trim() ?? ''

  if (!normalizedNote) {
    return required
      ? { success: false, message: 'Escribe una nota para conservar el contexto.', field: 'note' }
      : { success: true, note: null }
  }

  if (normalizedNote.length > ADMIN_LEAD_NOTE_MAX_LENGTH) {
    return {
      success: false,
      message: `La nota no puede superar ${ADMIN_LEAD_NOTE_MAX_LENGTH} caracteres.`,
      field: 'note',
    }
  }

  return { success: true, note: normalizedNote }
}

function normalizeActor(actor: AdminLeadActor): AdminLeadActor {
  return {
    userId: actor.userId,
    displayName: actor.displayName.trim() || 'Operador WellStudio',
  }
}
