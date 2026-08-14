import { cache } from 'react'

import type { AuthContext } from '@/modules/auth/server/identity'
import { resolveAdminAccess } from '@/modules/auth/server/identity'

export type AdminShellSummary = {
  displayName: string
  email: string
  rolesLabel: string
}

export const getAuthenticatedAdminShellSummary = cache(async (): Promise<AdminShellSummary> => {
  const access = await resolveAdminAccess()

  if (access.kind !== 'ok') {
    throw new Error('Admin or staff context required')
  }

  return buildAdminShellSummary(access.context)
})

export function buildAdminShellSummary(
  authContext: Extract<AuthContext, { isAuthenticated: true }>,
): AdminShellSummary {
  const displayName =
    [authContext.member?.firstName, authContext.member?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || authContext.localUser.email

  return {
    displayName,
    email: authContext.localUser.email,
    rolesLabel: authContext.roles.map((role) => role.role).join(' · ') || 'Sin roles asignados',
  }
}
