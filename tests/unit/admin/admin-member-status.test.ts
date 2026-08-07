import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    member: { findUnique: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
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
  changeAdminMemberStatus,
  parseOperableMemberStatus,
} from '@/modules/members/server/admin-member-status'

const actor = { userId: 'admin-1', displayName: 'Admin Sandbox' }

describe('admin member status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      firstName: 'Marta',
      lastName: 'Semanal',
    })
    tx.member.updateMany.mockResolvedValue({ count: 1 })
  })

  it('accepts only operable member states', () => {
    expect(parseOperableMemberStatus('ACTIVE')).toBe('ACTIVE')
    expect(parseOperableMemberStatus('INACTIVE')).toBe('INACTIVE')
    expect(parseOperableMemberStatus('BLOCKED')).toBe('BLOCKED')
    expect(parseOperableMemberStatus('LEAD_CONVERTED')).toBeNull()
  })

  it('changes status with optimistic concurrency and an audit record', async () => {
    const result = await changeAdminMemberStatus({
      memberId: 'member-1',
      expectedStatus: 'ACTIVE',
      status: 'BLOCKED',
      reason: 'Incidencia operativa pendiente',
      actor,
    })

    expect(result).toEqual({ success: true, memberId: 'member-1', status: 'BLOCKED' })
    expect(tx.member.updateMany).toHaveBeenCalledWith({
      where: { id: 'member-1', status: 'ACTIVE' },
      data: { status: 'BLOCKED' },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actionType: 'MEMBER_STATUS_CHANGED',
        entityType: 'Member',
        entityId: 'member-1',
        contextJson: expect.objectContaining({
          fromStatus: 'ACTIVE',
          toStatus: 'BLOCKED',
          reason: 'Incidencia operativa pendiente',
        }),
      }),
    })
  })

  it('rejects stale forms instead of overwriting another operator', async () => {
    tx.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'INACTIVE',
      firstName: 'Marta',
      lastName: 'Semanal',
    })

    const result = await changeAdminMemberStatus({
      memberId: 'member-1',
      expectedStatus: 'ACTIVE',
      status: 'BLOCKED',
      reason: 'Incidencia operativa pendiente',
      actor,
    })

    expect(result).toMatchObject({ success: false, code: 'CONFLICT' })
    expect(tx.member.updateMany).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('requires a meaningful reason', async () => {
    const result = await changeAdminMemberStatus({
      memberId: 'member-1',
      expectedStatus: 'ACTIVE',
      status: 'INACTIVE',
      reason: 'x',
      actor,
    })

    expect(result).toEqual({
      success: false,
      field: 'reason',
      message: 'Explica el cambio con un motivo de entre 5 y 240 caracteres.',
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})
