import type { AuthContext } from '@/modules/auth/server/identity'
import { hasAnyRole, IdentityLinkConflictError } from '@/modules/auth/server/identity'

export const IDENTITY_CONFLICT_LOGIN_PATH = '/login?authError=identity_conflict'
export const UNAUTHENTICATED_LOGIN_PATH = '/login'
export const UNHANDLED_POST_LOGIN_ERROR_PATH = '/error'

export type PostLoginNavigation = {
  path: string
  signOut: boolean
}

export function resolvePostLoginPath(
  authContext: Extract<AuthContext, { isAuthenticated: true }>,
) {
  if (hasAnyRole(authContext, ['ADMIN', 'STAFF'])) {
    return '/admin'
  }

  return '/app'
}

export function resolveAfterLoginNavigation(
  authContext: AuthContext,
): PostLoginNavigation {
  if (!authContext.isAuthenticated) {
    return { path: UNAUTHENTICATED_LOGIN_PATH, signOut: false }
  }

  return { path: resolvePostLoginPath(authContext), signOut: false }
}

export function resolveAfterLoginFailureNavigation(error: unknown): PostLoginNavigation {
  if (error instanceof IdentityLinkConflictError) {
    return { path: IDENTITY_CONFLICT_LOGIN_PATH, signOut: true }
  }

  return { path: UNHANDLED_POST_LOGIN_ERROR_PATH, signOut: false }
}
