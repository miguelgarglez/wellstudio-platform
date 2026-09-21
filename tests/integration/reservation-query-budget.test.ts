import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

import { createDatabase, deploy } from './database'
import { createScenario } from './fixtures'

const queries: string[] = []
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: [{ emit: 'event', level: 'query' }],
})
prisma.$on('query', (event) => queries.push(event.query))
vi.doMock('@/lib/db/prisma', () => ({ prisma }))

const { cancelMemberReservation, joinSessionWaitlist, reservePublishedSession } =
  await import('@/modules/reservations/server/member-reservation-mutations')
const { getMemberReservationsOverviewForMember } =
  await import('@/modules/reservations/server/member-reservations-overview')

let database: Awaited<ReturnType<typeof createDatabase>>

beforeAll(async () => {
  database = await createDatabase(process.env.DATABASE_URL)
  deploy(database.url)
})

afterAll(async () => {
  await prisma.$disconnect()
  if (database) await database.dispose()
})

it('cancels, refunds and promotes atomically within the remote query budget', async () => {
  const { member, createMember, session } = await createScenario(prisma)
  const next = await createMember()
  const booked = await reservePublishedSession(member)
  expect(booked.code).toBe('BOOKED')
  expect((await joinSessionWaitlist(next)).code).toBe('WAITLIST_JOINED')

  queries.length = 0
  const canceled = await cancelMemberReservation({
    ...member,
    reservationId: booked.updatedEntityId!,
  })
  const roundTrips = queries.length

  expect(canceled.code).toBe('CANCELED')
  expect(canceled.notificationJobIds).toHaveLength(2)
  expect(await prisma.reservation.findUnique({
    where: { id: booked.updatedEntityId },
  })).toMatchObject({ status: 'CANCELED' })
  expect(await prisma.reservation.findMany({
    where: { classSessionId: session.id, status: 'BOOKED' },
    include: { entitlementUsages: true },
  })).toMatchObject([{
    memberId: next.memberId,
    entitlementUsages: [{ usageType: 'CREDIT', creditsUsed: 1 }],
  }])
  expect(await prisma.classSession.findUnique({ where: { id: session.id } }))
    .toMatchObject({ reservedCount: 1 })
  expect(await prisma.waitlistEntry.findFirst({ where: { memberId: next.memberId } }))
    .toMatchObject({ status: 'PROMOTED', position: null })
  expect(await prisma.creditLedgerEntry.findMany({
    where: { memberCreditAccountId: member.creditAccountId },
    orderBy: { createdAt: 'asc' },
  })).toMatchObject([
    { creditsDelta: -1, balanceAfter: 4 },
    { creditsDelta: 1, balanceAfter: 5 },
  ])
  expect(await prisma.notificationJob.count({
    where: { id: { in: canceled.notificationJobIds } },
  })).toBe(2)
  expect(roundTrips, 'SQL round trips inside the 5-second transaction').toBeLessThanOrEqual(35)
})

it('loads the reservation shell without one query per nested relation', async () => {
  const { member } = await createScenario(prisma)
  expect((await reservePublishedSession(member)).code).toBe('BOOKED')

  queries.length = 0
  const overview = await getMemberReservationsOverviewForMember({
    memberId: member.memberId,
    memberStatus: 'ACTIVE',
    now: member.now,
  })
  const roundTrips = queries.length

  expect(overview.upcomingReservations).toHaveLength(1)
  expect(roundTrips, 'SQL round trips while revalidating the reservation shell').toBeLessThanOrEqual(8)
})
