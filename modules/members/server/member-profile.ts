import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

export type MemberProfileField = 'firstName' | 'lastName' | 'phone' | 'birthDate'

export type UpdateMemberProfileResult =
  | {
      success: true
      changed: boolean
      changedFields: MemberProfileField[]
      message: string
      updatedAtIso: string
    }
  | {
      success: false
      code: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT'
      message: string
      fieldErrors?: Partial<Record<MemberProfileField, string>>
    }

type ValidMemberProfileInput = {
  firstName: string
  lastName: string
  phone: string
  birthDate: Date | null
  expectedUpdatedAt: Date
}

export async function updateMemberProfile(input: {
  memberId: string
  actorUserId: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string
  expectedUpdatedAt: string
}): Promise<UpdateMemberProfileResult> {
  if (!input.memberId) {
    return { success: false, code: 'NOT_FOUND', message: 'No encontramos tu perfil de socio.' }
  }

  const parsed = validateMemberProfileInput(input)
  if (!parsed.success) return parsed

  return prisma.$transaction(async (tx) => {
    const member = await tx.member.findUnique({
      where: { id: input.memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthDate: true,
        updatedAt: true,
      },
    })

    if (!member) {
      return { success: false, code: 'NOT_FOUND', message: 'No encontramos tu perfil de socio.' }
    }

    if (member.updatedAt.getTime() !== parsed.data.expectedUpdatedAt.getTime()) {
      return conflictResult()
    }

    const changedFields = collectChangedProfileFields(member, parsed.data)

    if (changedFields.length === 0) {
      return {
        success: true,
        changed: false,
        changedFields,
        message: 'Tus datos ya estaban actualizados.',
        updatedAtIso: member.updatedAt.toISOString(),
      }
    }

    const updatedAt = new Date()
    const updated = await tx.member.updateMany({
      where: { id: member.id, updatedAt: member.updatedAt },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        birthDate: parsed.data.birthDate,
        updatedAt,
      },
    })

    if (updated.count !== 1) return conflictResult()

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actionType: 'MEMBER_PROFILE_UPDATED',
        entityType: 'Member',
        entityId: member.id,
        contextJson: { changedFields },
      },
    })

    return {
      success: true,
      changed: true,
      changedFields,
      message: 'Tus datos personales se han actualizado.',
      updatedAtIso: updatedAt.toISOString(),
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function validateMemberProfileInput(
  input: Pick<
    Parameters<typeof updateMemberProfile>[0],
    'firstName' | 'lastName' | 'phone' | 'birthDate' | 'expectedUpdatedAt'
  >,
  now = new Date(),
):
  | { success: true; data: ValidMemberProfileInput }
  | Extract<UpdateMemberProfileResult, { success: false }> {
  const firstName = normalizeName(input.firstName)
  const lastName = normalizeName(input.lastName)
  const phone = normalizeProfilePhone(input.phone)
  const birthDate = parseBirthDate(input.birthDate, now)
  const expectedUpdatedAt = new Date(input.expectedUpdatedAt)
  const fieldErrors: Partial<Record<MemberProfileField, string>> = {}

  if (firstName.length < 1 || firstName.length > 80) {
    fieldErrors.firstName = 'Escribe un nombre de entre 1 y 80 caracteres.'
  }
  if (lastName.length < 1 || lastName.length > 120) {
    fieldErrors.lastName = 'Escribe unos apellidos de entre 1 y 120 caracteres.'
  }
  if (!phone) {
    fieldErrors.phone = 'Escribe un teléfono válido de entre 9 y 15 dígitos.'
  }
  if (birthDate.error) {
    fieldErrors.birthDate = birthDate.error
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      code: 'VALIDATION',
      message: 'Revisa los campos indicados antes de guardar.',
      fieldErrors,
    }
  }

  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    return conflictResult()
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      phone: phone!,
      birthDate: birthDate.value,
      expectedUpdatedAt,
    },
  }
}

export function normalizeProfilePhone(value: string) {
  const trimmed = value.trim()
  if (!trimmed || !/^\+?[\d().\s-]+$/.test(trimmed)) return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) return null

  return `${trimmed.startsWith('+') ? '+' : ''}${digits}`
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function parseBirthDate(value: string, now: Date): { value: Date | null; error?: string } {
  if (!value.trim()) return { value: null }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return { value: null, error: 'Indica una fecha de nacimiento válida.' }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { value: null, error: 'Indica una fecha de nacimiento válida.' }
  }

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  if (date.getTime() > today) {
    return { value: null, error: 'La fecha de nacimiento no puede estar en el futuro.' }
  }
  if (date.getTime() < Date.UTC(1900, 0, 1)) {
    return { value: null, error: 'La fecha de nacimiento no puede ser anterior a 1900.' }
  }

  return { value: date }
}

function collectChangedProfileFields(
  current: {
    firstName: string
    lastName: string
    phone: string | null
    birthDate: Date | null
  },
  next: Pick<ValidMemberProfileInput, 'firstName' | 'lastName' | 'phone' | 'birthDate'>,
) {
  const changed: MemberProfileField[] = []
  if (current.firstName !== next.firstName) changed.push('firstName')
  if (current.lastName !== next.lastName) changed.push('lastName')
  if (current.phone !== next.phone) changed.push('phone')
  if ((current.birthDate?.getTime() ?? null) !== (next.birthDate?.getTime() ?? null)) {
    changed.push('birthDate')
  }
  return changed
}

function conflictResult(): Extract<UpdateMemberProfileResult, { success: false }> {
  return {
    success: false,
    code: 'CONFLICT',
    message: 'Tu perfil ha cambiado desde que lo abriste. Recarga la página y vuelve a intentarlo.',
  }
}
