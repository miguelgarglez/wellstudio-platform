import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

type MembershipSnapshot = {
  id: string
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELED'
  startsAt: Date
  endsAt: Date | null
}

type CreditAccountSnapshot = {
  id: string
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'CANCELED'
  openedAt: Date
  expiresAt: Date | null
}

export type ExpiredEntitlementsFixture = {
  memberId: string
  membershipId: string
  creditAccountId: string
  memberships: MembershipSnapshot[]
  creditAccounts: CreditAccountSnapshot[]
}

export function hasMemberEntitlementsDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function prepareExpiredEntitlementsFixture(): Promise<ExpiredEntitlementsFixture> {
  const prisma = createPrisma()
  const { email } = getSandboxCredentials()
  const now = new Date()
  const expiredAt = new Date(now.getTime() - 60_000)
  const startedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000)

  try {
    const member = await prisma.member.findFirst({
      where: { user: { normalizedEmail: email.trim().toLowerCase() } },
      select: {
        id: true,
        memberships: {
          select: { id: true, status: true, startsAt: true, endsAt: true },
        },
        creditAccounts: {
          select: { id: true, status: true, openedAt: true, expiresAt: true },
        },
      },
    })
    if (!member) throw new Error('Sandbox member must exist before preparing entitlement fixture')

    const [membershipPlan, creditPack] = await Promise.all([
      prisma.membershipPlan.findFirst({ select: { id: true } }),
      prisma.creditPack.findFirst({ select: { id: true } }),
    ])
    if (!membershipPlan || !creditPack) {
      throw new Error('At least one membership plan and credit pack are required for entitlement E2E')
    }

    const [membership, creditAccount] = await prisma.$transaction(async (transaction) => {
      await transaction.memberMembership.updateMany({
        where: { memberId: member.id },
        data: { status: 'CANCELED' },
      })
      await transaction.memberCreditAccount.updateMany({
        where: { memberId: member.id },
        data: { status: 'CANCELED' },
      })

      const createdMembership = await transaction.memberMembership.create({
        data: {
          memberId: member.id,
          membershipPlanId: membershipPlan.id,
          status: 'ACTIVE',
          startsAt: startedAt,
          endsAt: expiredAt,
        },
        select: { id: true },
      })
      const createdCreditAccount = await transaction.memberCreditAccount.create({
        data: {
          memberId: member.id,
          creditPackId: creditPack.id,
          status: 'ACTIVE',
          openedAt: startedAt,
          expiresAt: expiredAt,
          ledgerEntries: {
            create: {
              entryType: 'PURCHASE',
              creditsDelta: 4,
              balanceAfter: 4,
              notes: 'MIG-130 temporal validity E2E fixture',
            },
          },
        },
        select: { id: true },
      })

      return [createdMembership, createdCreditAccount] as const
    })

    return {
      memberId: member.id,
      membershipId: membership.id,
      creditAccountId: creditAccount.id,
      memberships: member.memberships,
      creditAccounts: member.creditAccounts,
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function restoreExpiredEntitlementsFixture(fixture: ExpiredEntitlementsFixture) {
  const prisma = createPrisma()

  try {
    await prisma.$transaction([
      prisma.creditLedgerEntry.deleteMany({
        where: { memberCreditAccountId: fixture.creditAccountId },
      }),
      prisma.memberCreditAccount.deleteMany({
        where: { id: fixture.creditAccountId },
      }),
      prisma.memberMembership.deleteMany({
        where: { id: fixture.membershipId },
      }),
      ...fixture.memberships.map((membership) => prisma.memberMembership.update({
        where: { id: membership.id },
        data: {
          status: membership.status,
          startsAt: membership.startsAt,
          endsAt: membership.endsAt,
        },
      })),
      ...fixture.creditAccounts.map((account) => prisma.memberCreditAccount.update({
        where: { id: account.id },
        data: {
          status: account.status,
          openedAt: account.openedAt,
          expiresAt: account.expiresAt,
        },
      })),
    ])
  } finally {
    await prisma.$disconnect()
  }
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for entitlement E2E')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}
