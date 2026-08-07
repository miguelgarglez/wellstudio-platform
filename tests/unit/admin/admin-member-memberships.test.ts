import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    member: { findUnique: vi.fn() },
    membershipPlan: { findFirst: vi.fn() },
    memberMembership: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
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
  assignManualMembership,
  endManualMembership,
  parseCalendarDate,
} from '@/modules/members/server/admin-member-memberships'

const actor = { userId: 'admin-1', displayName: 'Admin Sandbox' }
const now = new Date('2026-08-07T10:00:00.000Z')

describe('admin member memberships', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.member.findUnique.mockResolvedValue({ id: 'member-1', firstName: 'Marta', lastName: 'Semanal' })
    tx.membershipPlan.findFirst.mockResolvedValue({ id: 'plan-1', name: 'Plan semanal' })
    tx.memberMembership.findFirst.mockResolvedValue(null)
    tx.memberMembership.create.mockResolvedValue({ id: 'membership-1' })
    tx.memberMembership.updateMany.mockResolvedValue({ count: 1 })
  })

  it('interprets calendar boundaries in the WellStudio timezone, including DST', () => {
    expect(parseCalendarDate('2026-08-07', 'start')?.toISOString()).toBe('2026-08-06T22:00:00.000Z')
    expect(parseCalendarDate('2026-08-07', 'end')?.toISOString()).toBe('2026-08-07T21:59:59.999Z')
    expect(parseCalendarDate('2026-02-30', 'start')).toBeNull()
    expect(parseCalendarDate('not-a-date', 'start')).toBeNull()
  })

  it('assigns an immediate internal membership and audits its commercial origin', async () => {
    const result = await assignManualMembership({
      memberId: 'member-1',
      membershipPlanId: 'plan-1',
      startsOn: '2026-08-07',
      endsOn: '2026-09-07',
      reason: 'Alta abonada en recepción',
      actor,
      now,
    })

    expect(result).toEqual({
      success: true,
      memberId: 'member-1',
      membershipId: 'membership-1',
      status: 'ACTIVE',
    })
    expect(tx.memberMembership.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { memberId: 'member-1', status: 'ACTIVE' },
    }))
    expect(tx.memberMembership.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberId: 'member-1',
        membershipPlanId: 'plan-1',
        status: 'ACTIVE',
        autoRenews: false,
      }),
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'MEMBER_MEMBERSHIP_ASSIGNED',
        entityType: 'MemberMembership',
        contextJson: expect.objectContaining({
          reason: 'Alta abonada en recepción',
          assignmentSource: 'ADMIN_MANUAL',
        }),
      }),
    })
  })

  it('rejects future assignments until a scheduled activation workflow exists', async () => {
    const result = await assignManualMembership({
      memberId: 'member-1',
      membershipPlanId: 'plan-1',
      startsOn: '2026-09-01',
      endsOn: null,
      reason: 'Renovación programada',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: false, field: 'startsOn' })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a second membership in the same operational slot', async () => {
    tx.memberMembership.findFirst.mockResolvedValue({
      id: 'membership-existing',
      status: 'ACTIVE',
      membershipPlan: { name: 'Plan actual' },
    })

    const result = await assignManualMembership({
      memberId: 'member-1',
      membershipPlanId: 'plan-1',
      startsOn: '2026-08-07',
      endsOn: '2026-09-07',
      reason: 'Alta duplicada de prueba',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: false, code: 'CONFLICT' })
    expect(tx.memberMembership.create).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('ends an internal membership with optimistic concurrency and keeps existing reservations', async () => {
    tx.memberMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      memberId: 'member-1',
      status: 'ACTIVE',
      providerSubscriptionId: null,
      membershipPlan: { id: 'plan-1', name: 'Plan semanal' },
      member: { firstName: 'Marta', lastName: 'Semanal' },
    })

    const result = await endManualMembership({
      memberId: 'member-1',
      membershipId: 'membership-1',
      expectedStatus: 'ACTIVE',
      reason: 'Baja solicitada por la socia',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: true, status: 'CANCELED' })
    expect(tx.memberMembership.updateMany).toHaveBeenCalledWith({
      where: { id: 'membership-1', memberId: 'member-1', status: 'ACTIVE' },
      data: { status: 'CANCELED', autoRenews: false },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'MEMBER_MEMBERSHIP_ENDED',
        contextJson: expect.objectContaining({ existingReservationsPreserved: true }),
      }),
    })
  })

  it('refuses to end a provider-managed membership locally', async () => {
    tx.memberMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      memberId: 'member-1',
      status: 'ACTIVE',
      providerSubscriptionId: 'sub_external_1',
      membershipPlan: { id: 'plan-1', name: 'Plan externo' },
      member: { firstName: 'Marta', lastName: 'Semanal' },
    })

    const result = await endManualMembership({
      memberId: 'member-1',
      membershipId: 'membership-1',
      expectedStatus: 'ACTIVE',
      reason: 'Solicitud recibida en recepción',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: false, code: 'EXTERNAL_PROVIDER' })
    expect(tx.memberMembership.updateMany).not.toHaveBeenCalled()
  })
})
