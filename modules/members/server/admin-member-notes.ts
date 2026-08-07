import { prisma } from '@/lib/db/prisma'

export const ADMIN_MEMBER_NOTE_MAX_LENGTH = 1000

export type AdminMemberNoteActor = {
  userId: string
  displayName: string
}

export type AdminMemberNoteRepository = {
  memberExists: (memberId: string) => Promise<boolean>
  append: (input: { memberId: string; body: string; actor: AdminMemberNoteActor }) => Promise<void>
}

const repository: AdminMemberNoteRepository = {
  async memberExists(memberId) {
    return Boolean(await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } }))
  },
  async append(input) {
    await prisma.$transaction(async (tx) => {
      const note = await tx.memberNote.create({
        data: {
          memberId: input.memberId,
          authorUserId: input.actor.userId,
          body: input.body,
          visibility: 'INTERNAL',
        },
        select: { id: true },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.actor.userId,
          actionType: 'MEMBER_NOTE_ADDED',
          entityType: 'Member',
          entityId: input.memberId,
          contextJson: { noteId: note.id, actorDisplayName: input.actor.displayName },
        },
      })
    })
  },
}

export async function addAdminMemberNote(
  input: { memberId: string; body: string; actor: AdminMemberNoteActor },
  noteRepository: AdminMemberNoteRepository = repository,
) {
  const memberId = input.memberId.trim()
  const body = input.body.trim()

  if (!memberId) return { success: false as const, message: 'Falta el socio de la nota.' }
  if (!body) return { success: false as const, message: 'Escribe una nota antes de guardarla.', field: 'body' as const }
  if (body.length > ADMIN_MEMBER_NOTE_MAX_LENGTH) {
    return { success: false as const, message: `La nota no puede superar ${ADMIN_MEMBER_NOTE_MAX_LENGTH} caracteres.`, field: 'body' as const }
  }
  if (!await noteRepository.memberExists(memberId)) {
    return { success: false as const, message: 'No encontramos el socio seleccionado.' }
  }

  await noteRepository.append({ memberId, body, actor: input.actor })
  return { success: true as const, memberId }
}
