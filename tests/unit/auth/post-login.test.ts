import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  hasAnyRole,
  IdentityLinkConflictError,
  type AuthContext,
} from '@/modules/auth/server/identity'
import {
  IDENTITY_CONFLICT_LOGIN_PATH,
  UNAUTHENTICATED_LOGIN_PATH,
  UNHANDLED_POST_LOGIN_ERROR_PATH,
  resolveAfterLoginFailureNavigation,
  resolveAfterLoginNavigation,
  resolvePostLoginPath,
} from '@/modules/auth/server/post-login'

function buildAuthenticatedContext(
  roles: Array<{ role: 'MEMBER' | 'ADMIN' | 'STAFF' }>,
): Extract<AuthContext, { isAuthenticated: true }> {
  return {
    isAuthenticated: true,
    authUser: {
      id: 'auth-user-1',
      email: 'member@wellstudio.test',
    } as Extract<AuthContext, { isAuthenticated: true }>['authUser'],
    localUser: {
      id: 'user-1',
      email: 'member@wellstudio.test',
      normalizedEmail: 'member@wellstudio.test',
      status: 'ACTIVE',
    } as Extract<AuthContext, { isAuthenticated: true }>['localUser'],
    member: null,
    roles: roles as Extract<AuthContext, { isAuthenticated: true }>['roles'],
  }
}

describe('resolvePostLoginPath', () => {
  it('sends staff and admins to the backoffice', () => {
    expect(resolvePostLoginPath(buildAuthenticatedContext([{ role: 'ADMIN' }]))).toBe('/admin')
    expect(resolvePostLoginPath(buildAuthenticatedContext([{ role: 'STAFF' }]))).toBe('/admin')
  })

  it('sends members to the private app', () => {
    expect(resolvePostLoginPath(buildAuthenticatedContext([{ role: 'MEMBER' }]))).toBe('/app')
  })
})

describe('resolveAfterLoginNavigation', () => {
  it('sends anonymous visitors to login without signing out', () => {
    expect(
      resolveAfterLoginNavigation({
        isAuthenticated: false,
        authUser: null,
        localUser: null,
        member: null,
        roles: [],
      }),
    ).toEqual({ path: UNAUTHENTICATED_LOGIN_PATH, signOut: false })
  })

  it('keeps authenticated members on the post-login path', () => {
    const context = buildAuthenticatedContext([{ role: 'MEMBER' }])

    expect(hasAnyRole(context, ['ADMIN', 'STAFF'])).toBe(false)
    expect(resolveAfterLoginNavigation(context)).toEqual({ path: '/app', signOut: false })
  })
})

describe('resolveAfterLoginFailureNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signs out and explains leftover local identity conflicts', () => {
    expect(resolveAfterLoginFailureNavigation(new IdentityLinkConflictError('conflict'))).toEqual({
      path: IDENTITY_CONFLICT_LOGIN_PATH,
      signOut: true,
    })
  })

  it('does not absorb unexpected failures into the identity-conflict path', () => {
    expect(resolveAfterLoginFailureNavigation(new Error('database unavailable'))).toEqual({
      path: UNHANDLED_POST_LOGIN_ERROR_PATH,
      signOut: false,
    })
  })
})
