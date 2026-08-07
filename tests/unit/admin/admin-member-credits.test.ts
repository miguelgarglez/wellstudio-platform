import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    member: { findUnique: vi.fn() },
    creditPack: { findFirst: vi.fn() },
    memberCreditAccount: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    creditLedgerEntry: { create: vi.fn() },
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
  adjustMemberCreditAccount,
  isOperableCreditAccount,
  openManualCreditAccount,
} from '@/modules/members/server/admin-member-credits'

const actor = { userId: 'admin-1', displayName: 'Admin Sandbox' }
const now = new Date('2026-08-07T10:00:00.000Z')

describe('admin member credits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tx.memberCreditAccount.updateMany.mockResolvedValue({ count: 1 })
    tx.memberCreditAccount.create.mockResolvedValue({ id: 'credit-new' })
    tx.member.findUnique.mockResolvedValue({ id: 'member-1', firstName: 'Marta', lastName: 'Semanal' })
    tx.creditPack.findFirst.mockResolvedValue({
      id: 'pack-1',
      name: 'Bono 10',
      creditsTotal: 10,
      expiresAfterDays: 90,
    })
  })

  it('appends a positive adjustment and reactivates a depleted account', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue(buildAccount({
      status: 'DEPLETED',
      balanceAfter: 0,
    }))

    const result = await adjustMemberCreditAccount({
      memberId: 'member-1',
      creditAccountId: 'credit-1',
      direction: 'ADD',
      amount: 3,
      reason: 'Cortesía autorizada por recepción',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: true, balanceAfter: 3, operation: 'ADJUSTED' })
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entryType: 'MANUAL_ADJUSTMENT',
        creditsDelta: 3,
        balanceAfter: 3,
        referenceId: 'admin-1',
      }),
    })
    expect(tx.memberCreditAccount.updateMany).toHaveBeenCalledWith({
      where: { id: 'credit-1', memberId: 'member-1', status: 'DEPLETED' },
      data: { status: 'ACTIVE' },
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'MEMBER_CREDITS_ADJUSTED',
        contextJson: expect.objectContaining({ balanceBefore: 0, creditsDelta: 3, balanceAfter: 3 }),
      }),
    })
  })

  it('allows a removal down to zero and derives the depleted status', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue(buildAccount({ balanceAfter: 2 }))

    const result = await adjustMemberCreditAccount({
      memberId: 'member-1',
      creditAccountId: 'credit-1',
      direction: 'REMOVE',
      amount: 2,
      reason: 'Corrección de saldo duplicado',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: true, balanceAfter: 0 })
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creditsDelta: -2, balanceAfter: 0 }),
    })
    expect(tx.memberCreditAccount.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'DEPLETED' },
    }))
  })

  it('rejects removing more credits than the current ledger balance', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue(buildAccount({ balanceAfter: 2 }))

    const result = await adjustMemberCreditAccount({
      memberId: 'member-1',
      creditAccountId: 'credit-1',
      direction: 'REMOVE',
      amount: 3,
      reason: 'Corrección de saldo duplicado',
      actor,
      now,
    })

    expect(result).toMatchObject({
      success: false,
      code: 'INSUFFICIENT_BALANCE',
      field: 'amount',
    })
    expect(tx.creditLedgerEntry.create).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('refuses expired or canceled accounts even when their stored status looks active', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue(buildAccount({
      expiresAt: new Date('2026-08-07T09:59:59.000Z'),
    }))

    const result = await adjustMemberCreditAccount({
      memberId: 'member-1',
      creditAccountId: 'credit-1',
      direction: 'ADD',
      amount: 1,
      reason: 'Cortesía autorizada',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: false, code: 'INOPERABLE' })
    expect(isOperableCreditAccount({ status: 'CANCELED', expiresAt: null }, now)).toBe(false)
  })

  it('opens a manual credit account with expiry and no synthetic payment', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue(null)

    const result = await openManualCreditAccount({
      memberId: 'member-1',
      creditPackId: 'pack-1',
      initialCredits: 5,
      reason: 'Bono de bienvenida autorizado',
      actor,
      now,
    })

    expect(result).toEqual({
      success: true,
      memberId: 'member-1',
      creditAccountId: 'credit-new',
      balanceAfter: 5,
      operation: 'OPENED',
    })
    expect(tx.memberCreditAccount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberId: 'member-1',
        creditPackId: 'pack-1',
        status: 'ACTIVE',
        paymentId: null,
        expiresAt: new Date('2026-11-05T10:00:00.000Z'),
      }),
    })
    expect(tx.creditLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ creditsDelta: 5, balanceAfter: 5 }),
    })
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: 'MEMBER_CREDIT_ACCOUNT_OPENED',
        contextJson: expect.objectContaining({ paymentCreated: false, initialCredits: 5 }),
      }),
    })
  })

  it('does not duplicate an operable account for the same pack', async () => {
    tx.memberCreditAccount.findFirst.mockResolvedValue({ id: 'credit-existing' })

    const result = await openManualCreditAccount({
      memberId: 'member-1',
      creditPackId: 'pack-1',
      initialCredits: 10,
      reason: 'Alta manual en recepción',
      actor,
      now,
    })

    expect(result).toMatchObject({ success: false, code: 'CONFLICT', field: 'creditPackId' })
    expect(tx.memberCreditAccount.create).not.toHaveBeenCalled()
  })
})

function buildAccount(input: {
  status?: 'ACTIVE' | 'DEPLETED'
  balanceAfter?: number
  expiresAt?: Date | null
} = {}) {
  return {
    id: 'credit-1',
    memberId: 'member-1',
    status: input.status ?? 'ACTIVE',
    expiresAt: input.expiresAt ?? null,
    creditPack: { id: 'pack-1', name: 'Bono 10', creditsTotal: 10 },
    ledgerEntries: [{ balanceAfter: input.balanceAfter ?? 6 }],
    member: { firstName: 'Marta', lastName: 'Semanal' },
  }
}
