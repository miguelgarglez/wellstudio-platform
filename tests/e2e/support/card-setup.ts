import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export function hasPaymentsDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function prepareCardSetupFixture() {
  const prisma = createPrisma()
  const { email } = getSandboxCredentials()

  try {
    const member = await prisma.member.findFirst({
      where: { user: { normalizedEmail: email.trim().toLowerCase() } },
      select: { id: true },
    })
    if (!member) throw new Error('Sandbox member must exist before preparing card setup fixture')

    await cleanupCardSetup(prisma, member.id)
    return { memberId: member.id }
  } finally {
    await prisma.$disconnect()
  }
}

export async function readCardSetupFixtureState(memberId: string) {
  const prisma = createPrisma()
  try {
    const [payments, cards] = await Promise.all([
      prisma.payment.findMany({
        where: { memberId, provider: 'sandbox', paymentType: 'CARD_SETUP' },
        select: { id: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.card.findMany({
        where: { memberId, provider: 'sandbox' },
        select: {
          id: true,
          brand: true,
          last4: true,
          isDefault: true,
          status: true,
        },
      }),
    ])
    return { payments, cards }
  } finally {
    await prisma.$disconnect()
  }
}

export async function cleanupCardSetupFixture(memberId: string) {
  const prisma = createPrisma()
  try {
    await cleanupCardSetup(prisma, memberId)
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanupCardSetup(prisma: PrismaClient, memberId: string) {
  const payments = await prisma.payment.findMany({
    where: { memberId, provider: 'sandbox', paymentType: 'CARD_SETUP' },
    select: { id: true },
  })
  const paymentIds = payments.map((payment) => payment.id)

  if (paymentIds.length > 0) {
    await prisma.paymentEvent.deleteMany({ where: { paymentId: { in: paymentIds } } })
    await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } })
  }

  await prisma.card.deleteMany({ where: { memberId, provider: 'sandbox' } })
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}
