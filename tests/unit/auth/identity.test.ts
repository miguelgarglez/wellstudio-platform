import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

import { hasAnyRole } from '@/modules/auth/server/identity'
import type { AuthContext } from '@/modules/auth/server/identity'

function buildAuthenticatedContext(
  roles: Array<{ role: 'MEMBER' | 'ADMIN' | 'STAFF' }>,
): Extract<AuthContext, { isAuthenticated: true }> {
  return {
    isAuthenticated: true,
    authUser: {
      id: 'auth-user-1',
      email: 'admin@wellstudio.test',
    } as Extract<AuthContext, { isAuthenticated: true }>['authUser'],
    localUser: {
      id: 'user-1',
      email: 'admin@wellstudio.test',
      normalizedEmail: 'admin@wellstudio.test',
      status: 'ACTIVE',
    } as Extract<AuthContext, { isAuthenticated: true }>['localUser'],
    member: null,
    roles: roles as Extract<AuthContext, { isAuthenticated: true }>['roles'],
  }
}

describe('hasAnyRole', () => {
  it('accepts contexts that include an allowed role', () => {
    expect(hasAnyRole(buildAuthenticatedContext([{ role: 'ADMIN' }]), ['ADMIN', 'STAFF'])).toBe(true)
  })

  it('rejects contexts that only contain member role', () => {
    expect(hasAnyRole(buildAuthenticatedContext([{ role: 'MEMBER' }]), ['ADMIN', 'STAFF'])).toBe(false)
  })
})
