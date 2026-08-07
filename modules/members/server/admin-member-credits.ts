import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

const MAX_MANUAL_CREDIT_AMOUNT = 1_000

export type AdminCreditActor = {
  userId: string
  displayName: string
}

export type AdminCreditOperationResult =
  | {
      success: true
      memberId: string
      creditAccountId: string
      balanceAfter: number
      operation: 'ADJUSTED' | 'OPENED'
    }
  | {
      success: false
      message: string
      field?: 'creditAccountId' | 'creditPackId' | 'direction' | 'amount' | 'reason'
      code?: 'NOT_FOUND' | 'CONFLICT' | 'INOPERABLE' | 'INSUFFICIENT_BALANCE'
    }

export async function adjustMemberCreditAccount(input: {
  memberId: string
  creditAccountId: string
  direction: 'ADD' | 'REMOVE'
  amount: number
  reason: string
  actor: AdminCreditActor
  now?: Date
}): Promise<AdminCreditOperationResult> {
  const now = input.now ?? new Date()
  const reason = input.reason.trim()
  const amountError = validateAmount(input.amount)

  if (!input.memberId || !input.creditAccountId) {
    return { success: false, code: 'NOT_FOUND', field: 'creditAccountId', message: 'Selecciona una cuenta de créditos válida.' }
  }

  if (input.direction !== 'ADD' && input.direction !== 'REMOVE') {
    return { success: false, field: 'direction', message: 'Indica si quieres añadir o retirar créditos.' }
  }

  if (amountError) return { success: false, field: 'amount', message: amountError }
  if (!isMeaningfulReason(reason)) {
    return { success: false, field: 'reason', message: 'Explica el ajuste con un motivo de entre 5 y 240 caracteres.' }
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.memberCreditAccount.findFirst({
      where: { id: input.creditAccountId, memberId: input.memberId },
      select: {
        id: true,
        memberId: true,
        status: true,
        expiresAt: true,
        creditPack: { select: { id: true, name: true, creditsTotal: true } },
        ledgerEntries: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: { balanceAfter: true },
        },
        member: { select: { firstName: true, lastName: true } },
      },
    })

    if (!account) {
      return { success: false, code: 'NOT_FOUND', field: 'creditAccountId', message: 'La cuenta de créditos ya no existe.' }
    }

    if (!isOperableCreditAccount(account, now)) {
      return {
        success: false,
        code: 'INOPERABLE',
        field: 'creditAccountId',
        message: 'Esta cuenta está cancelada o expirada y no admite ajustes. Abre una cuenta nueva si necesitas conceder créditos.',
      }
    }

    const balanceBefore = account.ledgerEntries[0]?.balanceAfter ?? account.creditPack.creditsTotal
    const creditsDelta = input.direction === 'ADD' ? input.amount : -input.amount
    const balanceAfter = balanceBefore + creditsDelta

    if (balanceAfter < 0) {
      return {
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        field: 'amount',
        message: `No puedes retirar ${input.amount} créditos: el saldo actual es ${balanceBefore}.`,
      }
    }

    await tx.creditLedgerEntry.create({
      data: {
        memberCreditAccountId: account.id,
        entryType: 'MANUAL_ADJUSTMENT',
        creditsDelta,
        balanceAfter,
        referenceType: 'admin_user',
        referenceId: input.actor.userId,
        notes: reason,
      },
    })

    const updated = await tx.memberCreditAccount.updateMany({
      where: { id: account.id, memberId: input.memberId, status: account.status },
      data: { status: balanceAfter > 0 ? 'ACTIVE' : 'DEPLETED' },
    })

    if (updated.count !== 1) {
      throw new Error('Credit account changed concurrently')
    }

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'MEMBER_CREDITS_ADJUSTED',
        entityType: 'MemberCreditAccount',
        entityId: account.id,
        contextJson: {
          memberId: account.memberId,
          memberDisplayName: displayName(account.member),
          creditPackId: account.creditPack.id,
          creditPackName: account.creditPack.name,
          balanceBefore,
          creditsDelta,
          balanceAfter,
          reason,
          actorDisplayName: input.actor.displayName,
        },
      },
    })

    return {
      success: true,
      memberId: account.memberId,
      creditAccountId: account.id,
      balanceAfter,
      operation: 'ADJUSTED',
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function openManualCreditAccount(input: {
  memberId: string
  creditPackId: string
  initialCredits: number
  reason: string
  actor: AdminCreditActor
  now?: Date
}): Promise<AdminCreditOperationResult> {
  const now = input.now ?? new Date()
  const reason = input.reason.trim()
  const amountError = validateAmount(input.initialCredits)

  if (!input.memberId || !input.creditPackId) {
    return { success: false, code: 'NOT_FOUND', field: 'creditPackId', message: 'Selecciona un bono activo válido.' }
  }

  if (amountError) return { success: false, field: 'amount', message: amountError }
  if (!isMeaningfulReason(reason)) {
    return { success: false, field: 'reason', message: 'Explica la apertura con un motivo de entre 5 y 240 caracteres.' }
  }

  return prisma.$transaction(async (tx) => {
    const [member, creditPack, existingAccount] = await Promise.all([
      tx.member.findUnique({
        where: { id: input.memberId },
        select: { id: true, firstName: true, lastName: true },
      }),
      tx.creditPack.findFirst({
        where: { id: input.creditPackId, status: 'ACTIVE' },
        select: { id: true, name: true, creditsTotal: true, expiresAfterDays: true },
      }),
      tx.memberCreditAccount.findFirst({
        where: {
          memberId: input.memberId,
          creditPackId: input.creditPackId,
          status: { in: ['ACTIVE', 'DEPLETED'] },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true },
      }),
    ])

    if (!member || !creditPack) {
      return { success: false, code: 'NOT_FOUND', field: 'creditPackId', message: 'El socio o el bono activo ya no está disponible.' }
    }

    if (existingAccount) {
      return {
        success: false,
        code: 'CONFLICT',
        field: 'creditPackId',
        message: 'El socio ya tiene una cuenta vigente de este bono. Ajusta su saldo en lugar de abrir otra.',
      }
    }

    const expiresAt = creditPack.expiresAfterDays
      ? new Date(now.getTime() + creditPack.expiresAfterDays * 24 * 60 * 60 * 1_000)
      : null
    const account = await tx.memberCreditAccount.create({
      data: {
        memberId: member.id,
        creditPackId: creditPack.id,
        status: 'ACTIVE',
        openedAt: now,
        expiresAt,
        paymentId: null,
      },
    })

    await tx.creditLedgerEntry.create({
      data: {
        memberCreditAccountId: account.id,
        entryType: 'MANUAL_ADJUSTMENT',
        creditsDelta: input.initialCredits,
        balanceAfter: input.initialCredits,
        referenceType: 'admin_user',
        referenceId: input.actor.userId,
        notes: reason,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'MEMBER_CREDIT_ACCOUNT_OPENED',
        entityType: 'MemberCreditAccount',
        entityId: account.id,
        contextJson: {
          memberId: member.id,
          memberDisplayName: displayName(member),
          creditPackId: creditPack.id,
          creditPackName: creditPack.name,
          initialCredits: input.initialCredits,
          expiresAt: expiresAt?.toISOString() ?? null,
          reason,
          actorDisplayName: input.actor.displayName,
          paymentCreated: false,
        },
      },
    })

    return {
      success: true,
      memberId: member.id,
      creditAccountId: account.id,
      balanceAfter: input.initialCredits,
      operation: 'OPENED',
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export function isOperableCreditAccount(
  account: { status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'; expiresAt: Date | null },
  now: Date,
) {
  return (account.status === 'ACTIVE' || account.status === 'DEPLETED') &&
    (!account.expiresAt || account.expiresAt.getTime() > now.getTime())
}

function validateAmount(amount: number) {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_MANUAL_CREDIT_AMOUNT) {
    return `Indica una cantidad entera entre 1 y ${MAX_MANUAL_CREDIT_AMOUNT}.`
  }
  return null
}

function isMeaningfulReason(reason: string) {
  return reason.length >= 5 && reason.length <= 240
}

function displayName(member: { firstName: string; lastName: string }) {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
}
