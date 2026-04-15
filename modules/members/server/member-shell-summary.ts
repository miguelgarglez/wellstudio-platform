import { cache } from 'react'

import type { AuthContext } from '@/modules/auth/server/identity'

export type MemberShellSummary = {
  displayName: string
  email: string
  memberStatusLabel: string
  rolesLabel: string
}

export const getAuthenticatedMemberShellSummary = cache(async (): Promise<MemberShellSummary> => {
  const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
  const authContext = await requireAuthenticatedContext()

  return buildMemberShellSummary(authContext)
})

export function buildMemberShellSummary(
  authContext: Extract<AuthContext, { isAuthenticated: true }>,
): MemberShellSummary {
  const displayName =
    [authContext.member?.firstName, authContext.member?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || authContext.localUser.email

  return {
    displayName,
    email: authContext.localUser.email,
    memberStatusLabel: formatMemberStatusLabel(
      authContext.member?.status ?? authContext.localUser.status,
    ),
    rolesLabel:
      authContext.roles.map((role) => role.role).join(' · ') || 'Sin roles asignados',
  }
}

function formatMemberStatusLabel(status: string) {
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
      return 'Estado de socio'
  }
}
