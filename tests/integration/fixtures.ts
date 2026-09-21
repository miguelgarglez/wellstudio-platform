import { randomUUID } from 'node:crypto'

import type { PrismaClient } from '@prisma/client'

export const now = new Date('2030-01-10T10:00:00.000Z')

export async function createScenario(prisma: PrismaClient) {
  const creditPack = await prisma.creditPack.create({
    data: {
      name: 'Integration credits',
      slug: randomUUID(),
      creditsTotal: 5,
      priceAmount: 5000,
      currency: 'EUR',
      status: 'ACTIVE',
    },
  })
  const session = await prisma.classSession.create({
    data: {
      startsAt: new Date('2030-01-12T10:00:00.000Z'),
      endsAt: new Date('2030-01-12T11:00:00.000Z'),
      capacity: 1,
      status: 'PUBLISHED',
      classType: {
        create: {
          name: 'Integration class',
          slug: randomUUID(),
          durationMinutes: 60,
          capacityDefault: 1,
          status: 'ACTIVE',
          eligibilityRules: { create: { ruleType: 'CREDIT', creditCost: 1 } },
        },
      },
    },
  })

  async function createMember() {
    const email = `${randomUUID()}@example.invalid`
    const member = await prisma.member.create({
      data: {
        firstName: 'Integration',
        lastName: 'Member',
        status: 'ACTIVE',
        user: { create: { email, normalizedEmail: email, status: 'ACTIVE' } },
        creditAccounts: {
          create: {
            creditPackId: creditPack.id,
            openedAt: now,
            status: 'ACTIVE',
          },
        },
      },
      include: { creditAccounts: true },
    })
    return {
      memberId: member.id,
      userId: member.userId,
      classSessionId: session.id,
      creditAccountId: member.creditAccounts[0].id,
      now,
    }
  }

  return { session, createMember, member: await createMember() }
}
