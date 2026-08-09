import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const PAYMENT_E2E_PACK_NAME = 'E2E Bono Checkout'
export const PAYMENT_E2E_PACK_SLUG = 'e2e-payment-checkout'

export function hasPaymentsDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function preparePaymentsFixture() {
  const prisma = createPrisma()
  const { email } = getSandboxCredentials()

  try {
    const member = await prisma.member.findFirst({
      where: { user: { normalizedEmail: email.trim().toLowerCase() } },
      select: { id: true },
    })
    if (!member) throw new Error('Sandbox member must exist before preparing payments fixture')

    const pack = await prisma.creditPack.upsert({
      where: { slug: PAYMENT_E2E_PACK_SLUG },
      update: {
        name: PAYMENT_E2E_PACK_NAME,
        description: 'Seis sesiones para validar el checkout completo.',
        creditsTotal: 6,
        priceAmount: 5400,
        currency: 'EUR',
        expiresAfterDays: 45,
        status: 'ACTIVE',
        isPublic: true,
      },
      create: {
        name: PAYMENT_E2E_PACK_NAME,
        slug: PAYMENT_E2E_PACK_SLUG,
        description: 'Seis sesiones para validar el checkout completo.',
        creditsTotal: 6,
        priceAmount: 5400,
        currency: 'EUR',
        expiresAfterDays: 45,
        status: 'ACTIVE',
        isPublic: true,
      },
      select: { id: true },
    })

    await cleanupPayments(prisma, member.id, pack.id)
    return { memberId: member.id, creditPackId: pack.id }
  } finally {
    await prisma.$disconnect()
  }
}

export async function readPaymentsFixtureState(memberId: string, creditPackId: string) {
  const prisma = createPrisma()
  try {
    const [payments, accounts] = await Promise.all([
      prisma.payment.findMany({
        where: { memberId, provider: 'sandbox', items: { some: { referenceId: creditPackId } } },
        select: { id: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.memberCreditAccount.findMany({
        where: { memberId, creditPackId, payment: { provider: 'sandbox' } },
        select: {
          id: true,
          ledgerEntries: { select: { entryType: true, creditsDelta: true, balanceAfter: true } },
        },
      }),
    ])
    const paymentIds = payments.map((payment) => payment.id)
    const notificationJobs = paymentIds.length > 0
      ? await prisma.notificationJob.findMany({
          where: {
            eventType: 'CREDIT_PACK_PURCHASED',
            referenceType: 'payment',
            referenceId: { in: paymentIds },
          },
          select: {
            id: true,
            eventType: true,
            referenceId: true,
            idempotencyKey: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
        })
      : []
    return { payments, accounts, notificationJobs }
  } finally {
    await prisma.$disconnect()
  }
}

export async function cleanupPaymentsFixture(memberId: string, creditPackId: string) {
  const prisma = createPrisma()
  try {
    await cleanupPayments(prisma, memberId, creditPackId)
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanupPayments(prisma: PrismaClient, memberId: string, creditPackId: string) {
  const payments = await prisma.payment.findMany({
    where: { memberId, provider: 'sandbox', items: { some: { referenceId: creditPackId } } },
    select: { id: true },
  })
  const paymentIds = payments.map((payment) => payment.id)
  if (paymentIds.length === 0) return

  const accounts = await prisma.memberCreditAccount.findMany({
    where: { paymentId: { in: paymentIds } },
    select: { id: true },
  })
  const accountIds = accounts.map((account) => account.id)
  const notificationJobs = await prisma.notificationJob.findMany({
    where: {
      referenceType: 'payment',
      referenceId: { in: paymentIds },
    },
    select: { id: true },
  })
  const notificationJobIds = notificationJobs.map((job) => job.id)

  await prisma.$transaction([
    prisma.notificationDeliveryAttempt.deleteMany({
      where: { notificationJobId: { in: notificationJobIds } },
    }),
    prisma.notificationJob.deleteMany({ where: { id: { in: notificationJobIds } } }),
    prisma.creditLedgerEntry.deleteMany({ where: { memberCreditAccountId: { in: accountIds } } }),
    prisma.memberCreditAccount.deleteMany({ where: { id: { in: accountIds } } }),
    prisma.paymentEvent.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.paymentItem.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
  ])
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for payments E2E')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}
