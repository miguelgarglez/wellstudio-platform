import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserMock, prismaTransactionMock, tx } = vi.hoisted(() => {
  const transaction = {
    user: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    member: { findUnique: vi.fn(), create: vi.fn() },
    userRole: { createMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  }

  return {
    getUserMock: vi.fn(),
    prismaTransactionMock: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    tx: transaction,
  }
})

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: prismaTransactionMock,
  },
}))

vi.mock('@/modules/auth/lib/supabase-server-client', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}))

import {
  requireAdminOrStaffContext,
  resolveAdminAccess,
} from '@/modules/auth/server/identity'

function mockProvisionedStaffUser() {
  getUserMock.mockResolvedValue({
    data: {
      user: {
        id: 'auth-admin-1',
        email: 'admin@wellstudio.test',
        email_confirmed_at: '2026-01-01T00:00:00.000Z',
        user_metadata: {
          first_name: 'Admin',
          last_name: 'Sandbox',
        },
      },
    },
    error: null,
  })
  tx.user.findFirst.mockResolvedValue({
    id: 'user-admin-1',
    externalAuthId: 'auth-admin-1',
  })
  tx.user.update.mockResolvedValue({
    id: 'user-admin-1',
    email: 'admin@wellstudio.test',
  })
  tx.member.findUnique.mockResolvedValue(null)
  tx.member.create.mockResolvedValue({
    id: 'member-admin-1',
    userId: 'user-admin-1',
    firstName: 'Admin',
    lastName: 'Sandbox',
  })
  tx.userRole.createMany.mockResolvedValue({ count: 0 })
  tx.userRole.findMany.mockResolvedValue([
    { id: 'role-admin', userId: 'user-admin-1', role: 'ADMIN' },
    { id: 'role-member', userId: 'user-admin-1', role: 'MEMBER' },
  ])
}

describe('resolveAdminAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns unauthenticated without throwing when Supabase has no session', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })

    await expect(resolveAdminAccess()).resolves.toEqual({ kind: 'unauthenticated' })
    await expect(requireAdminOrStaffContext()).resolves.toBeNull()
  })

  it('returns forbidden for authenticated members without admin roles', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'auth-member-1',
          email: 'member@wellstudio.test',
          email_confirmed_at: '2026-01-01T00:00:00.000Z',
          user_metadata: {},
        },
      },
      error: null,
    })
    tx.user.findFirst.mockResolvedValue({
      id: 'user-member-1',
      externalAuthId: 'auth-member-1',
    })
    tx.user.update.mockResolvedValue({
      id: 'user-member-1',
      email: 'member@wellstudio.test',
    })
    tx.member.findUnique.mockResolvedValue({
      id: 'member-1',
      userId: 'user-member-1',
      firstName: 'Member',
      lastName: 'Only',
    })
    tx.userRole.createMany.mockResolvedValue({ count: 0 })
    tx.userRole.findMany.mockResolvedValue([
      { id: 'role-member', userId: 'user-member-1', role: 'MEMBER' },
    ])

    await expect(resolveAdminAccess()).resolves.toEqual({ kind: 'forbidden' })
    await expect(requireAdminOrStaffContext()).resolves.toBeNull()
  })

  it('returns admin context for staff users', async () => {
    mockProvisionedStaffUser()

    const access = await resolveAdminAccess()

    expect(access.kind).toBe('ok')
    if (access.kind === 'ok') {
      expect(access.context.localUser.email).toBe('admin@wellstudio.test')
      expect(access.context.roles.map((role) => role.role)).toContain('ADMIN')
    }
  })
})
