import { prisma } from '@/lib/db/prisma'

type EntitlementReconciliationRepository = {
  expireMemberships(now: Date): Promise<number>
  expireCreditAccounts(now: Date): Promise<number>
}

const repository: EntitlementReconciliationRepository = {
  async expireMemberships(now) {
    const result = await prisma.memberMembership.updateMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    })
    return result.count
  },
  async expireCreditAccounts(now) {
    const result = await prisma.memberCreditAccount.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    })
    return result.count
  },
}

export async function reconcileExpiredEntitlements(
  input: { now?: Date } = {},
  reconciliationRepository: EntitlementReconciliationRepository = repository,
) {
  const now = input.now ?? new Date()
  const [expiredMemberships, expiredCreditAccounts] = await Promise.all([
    reconciliationRepository.expireMemberships(now),
    reconciliationRepository.expireCreditAccounts(now),
  ])

  return {
    reconciledAt: now,
    expiredMemberships,
    expiredCreditAccounts,
  }
}
