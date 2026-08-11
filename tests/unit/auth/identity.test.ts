import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    user: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    member: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    userRole: { createMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  }
  return {
    tx: transaction,
    prismaMock: {
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import {
  ensureLocalUser,
  hasAnyRole,
  IdentityLinkConflictError,
} from '@/modules/auth/server/identity'
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

describe('ensureLocalUser profile ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.user.findFirst.mockResolvedValue({ id: 'user-1', externalAuthId: 'supabase-1' })
    tx.user.update.mockResolvedValue({ id: 'user-1', email: 'member@wellstudio.test' })
    tx.userRole.createMany.mockResolvedValue({ count: 0 })
    tx.userRole.deleteMany.mockResolvedValue({ count: 0 })
    tx.userRole.findMany.mockResolvedValue([{ id: 'role-1', userId: 'user-1', role: 'MEMBER' }])
  })

  it('does not overwrite an existing member profile from auth metadata', async () => {
    const existingMember = {
      id: 'member-1',
      userId: 'user-1',
      firstName: 'Nombre editado',
      lastName: 'Perfil local',
      phone: '699123456',
      birthDate: null,
      status: 'ACTIVE',
      joinedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    tx.member.findUnique.mockResolvedValue(existingMember)

    const identity = await ensureLocalUser({
      id: 'supabase-1',
      email: 'member@wellstudio.test',
      phone: '612345678',
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      user_metadata: { first_name: 'Nombre auth', last_name: 'Antiguo' },
    } as unknown as Parameters<typeof ensureLocalUser>[0])

    expect(identity.member).toEqual(existingMember)
    expect(tx.member.update).not.toHaveBeenCalled()
    expect(tx.member.create).not.toHaveBeenCalled()
    expect(tx.userRole.deleteMany).not.toHaveBeenCalled()
  })

  it('seeds the local profile from auth metadata when the member is first created', async () => {
    tx.member.findUnique.mockResolvedValue(null)
    tx.member.create.mockResolvedValue({ id: 'member-1' })

    await ensureLocalUser({
      id: 'supabase-1',
      email: 'member@wellstudio.test',
      phone: '612345678',
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      user_metadata: { first_name: 'Nombre auth', last_name: 'Inicial' },
    } as unknown as Parameters<typeof ensureLocalUser>[0])

    expect(tx.member.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        firstName: 'Nombre auth',
        lastName: 'Inicial',
        phone: '612345678',
        status: 'ACTIVE',
        joinedAt: expect.any(Date),
      },
    })
  })
})

describe('ensureLocalUser identity linking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.userRole.createMany.mockResolvedValue({ count: 0 })
    tx.userRole.deleteMany.mockResolvedValue({ count: 0 })
    tx.member.findUnique.mockResolvedValue({ id: 'member-1' })
    tx.userRole.findMany.mockResolvedValue([{ id: 'role-1', userId: 'user-1', role: 'MEMBER' }])
  })

  it('rejects claiming an email already linked to a different auth identity', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-admin',
        externalAuthId: 'supabase-original-admin',
        normalizedEmail: 'admin@wellstudio.test',
      })

    await expect(
      ensureLocalUser({
        id: 'supabase-attacker',
        email: 'admin@wellstudio.test',
        email_confirmed_at: '2026-01-01T00:00:00.000Z',
        user_metadata: {},
      } as unknown as Parameters<typeof ensureLocalUser>[0]),
    ).rejects.toBeInstanceOf(IdentityLinkConflictError)

    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.user.create).not.toHaveBeenCalled()
  })

  it('strips privileged roles when first-linking an unlinked local identity by email', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        externalAuthId: null,
        normalizedEmail: 'admin@wellstudio.test',
      })
    tx.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'admin@wellstudio.test',
    })
    tx.userRole.findMany.mockResolvedValue([{ id: 'role-1', userId: 'user-1', role: 'MEMBER' }])

    await ensureLocalUser({
      id: 'supabase-new',
      email: 'admin@wellstudio.test',
      email_confirmed_at: '2026-01-01T00:00:00.000Z',
      user_metadata: {},
    } as unknown as Parameters<typeof ensureLocalUser>[0])

    expect(tx.userRole.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        role: {
          in: ['ADMIN', 'STAFF'],
        },
      },
    })
  })

  it('refuses email-only linking when the Supabase email is not verified', async () => {
    tx.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        externalAuthId: null,
        normalizedEmail: 'member@wellstudio.test',
      })

    await expect(
      ensureLocalUser({
        id: 'supabase-new',
        email: 'member@wellstudio.test',
        email_confirmed_at: null,
        user_metadata: {},
      } as unknown as Parameters<typeof ensureLocalUser>[0]),
    ).rejects.toBeInstanceOf(IdentityLinkConflictError)

    expect(tx.user.update).not.toHaveBeenCalled()
  })
})
