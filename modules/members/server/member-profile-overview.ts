import { cache } from 'react'
import type { ConsentType, MemberStatus, UserConsent } from '@prisma/client'

export type MemberProfileConsentItem = {
  id: string
  label: string
  statusLabel: string
  detailLabel: string
}

export type MemberProfileOverview = {
  fullName: string
  email: string
  phoneLabel: string
  birthDateLabel: string
  joinedAtLabel: string
  statusLabel: string
  editable: {
    firstName: string
    lastName: string
    phone: string
    birthDate: string
    updatedAtIso: string
  }
  consents: MemberProfileConsentItem[]
}

export const getMemberProfileOverview = cache(async (): Promise<MemberProfileOverview> => {
  const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
  const { prisma } = await import('@/lib/db/prisma')

  const authContext = await requireAuthenticatedContext()
  const memberId = authContext.member?.id

  if (!memberId) {
    throw new Error('Authenticated member required for member profile overview')
  }

  const member = await prisma.member.findUnique({
    where: {
      id: memberId,
    },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      birthDate: true,
      joinedAt: true,
      status: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
          consents: {
            select: {
              id: true,
              consentType: true,
              accepted: true,
              acceptedAt: true,
              createdAt: true,
            },
            orderBy: [
              {
                accepted: 'desc',
              },
              {
                createdAt: 'desc',
              },
            ],
          },
        },
      },
    },
  })

  if (!member) {
    throw new Error('Member profile not found for authenticated user')
  }

  return buildMemberProfileOverview({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.user.email,
    phone: member.phone,
    birthDate: member.birthDate,
    joinedAt: member.joinedAt,
    status: member.status,
    updatedAt: member.updatedAt,
    consents: member.user.consents,
  })
})

export function buildMemberProfileOverview({
  firstName,
  lastName,
  email,
  phone,
  birthDate,
  joinedAt,
  status,
  updatedAt,
  consents,
}: {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  birthDate: Date | null
  joinedAt: Date | null
  status: MemberStatus
  updatedAt: Date
  consents: Array<Pick<UserConsent, 'id' | 'consentType' | 'accepted' | 'acceptedAt' | 'createdAt'>>
}): MemberProfileOverview {
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return {
    fullName: [firstName, lastName].join(' ').trim(),
    email,
    phoneLabel: phone ?? 'Sin teléfono',
    birthDateLabel: birthDate ? dateFormatter.format(birthDate) : 'Fecha no disponible',
    joinedAtLabel: joinedAt ? dateFormatter.format(joinedAt) : 'Alta no registrada',
    statusLabel: formatMemberStatus(status),
    editable: {
      firstName,
      lastName,
      phone: phone ?? '',
      birthDate: birthDate ? formatDateInputValue(birthDate) : '',
      updatedAtIso: updatedAt.toISOString(),
    },
    consents: consents.map((consent) => buildConsentItem(consent, dateFormatter)),
  }
}

function formatDateInputValue(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildConsentItem(
  consent: Pick<UserConsent, 'id' | 'consentType' | 'accepted' | 'acceptedAt' | 'createdAt'>,
  dateFormatter: Intl.DateTimeFormat,
): MemberProfileConsentItem {
  const recordedAt = consent.acceptedAt ?? consent.createdAt

  return {
    id: consent.id,
    label: formatConsentLabel(consent.consentType),
    statusLabel: consent.accepted ? 'Aceptado' : 'Pendiente',
    detailLabel: consent.accepted
      ? `Registrado el ${dateFormatter.format(recordedAt)}`
      : 'Sin aceptación registrada',
  }
}

function formatConsentLabel(consentType: ConsentType) {
  switch (consentType) {
    case 'TERMS':
      return 'Términos'
    case 'PRIVACY':
      return 'Privacidad'
    case 'MARKETING':
      return 'Marketing'
    default:
      return 'Consentimiento'
  }
}

function formatMemberStatus(status: MemberStatus) {
  switch (status) {
    case 'LEAD_CONVERTED':
      return 'Perfil pendiente de activación'
    case 'ACTIVE':
      return 'Socio activo'
    case 'INACTIVE':
      return 'Socio inactivo'
    case 'BLOCKED':
      return 'Socio bloqueado'
    default:
      return 'Estado no disponible'
  }
}
