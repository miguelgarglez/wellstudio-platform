import type { UserRole } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMemberFixture, buildSupabaseUserFixture, buildUserFixture, fixedDate } from '@/tests/fixtures'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import { ensureLocalUser } from '@/modules/auth/server/identity'

const authUser = buildSupabaseUserFixture({
  id: 'auth-1',
  email: 'member@example.test',
})
const localUser = buildUserFixture({
  id: 'user-1',
  externalAuthId: authUser.id,
  email: authUser.email,
  normalizedEmail: 'member@example.test',
})
const member = buildMemberFixture({ userId: localUser.id })
const memberRole: UserRole = {
  id: 'role-member',
  userId: localUser.id,
  role: 'MEMBER',
  createdAt: fixedDate(),
}
const roles = [memberRole]
const linkedUser = { ...localUser, member, roles }

describe('authenticated identity read path', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    prismaMock.user.findUnique.mockResolvedValue(linkedUser)
    prismaMock.$transaction.mockRejectedValue(new Error('Provisioning required'))
  })

  it('reads a synchronized identity without writes or an interactive transaction', async () => {
    await expect(ensureLocalUser(authUser)).resolves.toEqual({ localUser, member, roles })
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: {
        externalAuthProvider_externalAuthId: {
          externalAuthProvider: 'supabase',
          externalAuthId: authUser.id,
        },
      },
      include: { member: true, roles: { orderBy: { createdAt: 'asc' } } },
    })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('records a new provider sign-in once without reprovisioning the member', async () => {
    const lastLoginAt = fixedDate('2026-03-14T12:00:00.000Z')
    const updatedUser = { ...localUser, lastLoginAt }
    prismaMock.user.update.mockResolvedValue(updatedUser)

    await expect(ensureLocalUser({
      ...authUser,
      last_sign_in_at: lastLoginAt.toISOString(),
    })).resolves.toEqual({ localUser: updatedUser, member, roles })

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: {
        id: localUser.id,
        externalAuthProvider: 'supabase',
        externalAuthId: authUser.id,
      },
      data: { lastLoginAt },
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('reloads role revocations and member state on subsequent requests', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      ...linkedUser,
      roles: [...roles, { ...memberRole, id: 'role-admin', role: 'ADMIN' }],
    })
    prismaMock.user.findUnique.mockResolvedValueOnce({
      ...linkedUser,
      member: { ...member, status: 'BLOCKED' },
    })

    expect((await ensureLocalUser(authUser)).roles.map(({ role }) => role)).toContain('ADMIN')
    const second = await ensureLocalUser(authUser)
    expect(second.roles.map(({ role }) => role)).toEqual(['MEMBER'])
    expect(second.member?.status).toBe('BLOCKED')
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('does not move the login timestamp backwards for an older provider snapshot', async () => {
    await ensureLocalUser({ ...authUser, last_sign_in_at: '2026-03-12T12:00:00.000Z' })
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it.each([
    ['unknown identity', null],
    ['missing member', { ...linkedUser, member: null }],
    ['missing member role', { ...linkedUser, roles: [] }],
    ['changed email', { ...linkedUser, email: 'old@example.test' }],
    ['changed normalized email', { ...linkedUser, normalizedEmail: 'old@example.test' }],
    ['changed verification', { ...linkedUser, emailVerifiedAt: null }],
    ['changed auth status', { ...linkedUser, status: 'PENDING_VERIFICATION' }],
  ])('retains the transactional reconciliation for %s', async (_reason, identity) => {
    prismaMock.user.findUnique.mockResolvedValue(identity)
    await expect(ensureLocalUser(authUser)).rejects.toThrow('Provisioning required')
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})
