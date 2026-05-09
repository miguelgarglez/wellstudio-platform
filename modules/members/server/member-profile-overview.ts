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
    fullName: [member.firstName, member.lastName].join(' ').trim(),
    email: member.user.email,
    phone: member.phone,
    birthDate: member.birthDate,
    joinedAt: member.joinedAt,
    status: member.status,
    consents: member.user.consents,
  })
})

export function buildMemberProfileOverview({
  fullName,
  email,
  phone,
  birthDate,
  joinedAt,
  status,
  consents,
}: {
  fullName: string
  email: string
  phone: string | null
  birthDate: Date | null
  joinedAt: Date | null
  status: MemberStatus
  consents: Array<Pick<UserConsent, 'id' | 'consentType' | 'accepted' | 'acceptedAt' | 'createdAt'>>
}): MemberProfileOverview {
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return {
    fullName,
    email,
    phoneLabel: phone ?? 'Sin teléfono',
    birthDateLabel: birthDate ? dateFormatter.format(birthDate) : 'Fecha no disponible',
    joinedAtLabel: joinedAt ? dateFormatter.format(joinedAt) : 'Alta no registrada',
    statusLabel: formatMemberStatus(status),
    consents: consents.map((consent) => buildConsentItem(consent, dateFormatter)),
  }
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
