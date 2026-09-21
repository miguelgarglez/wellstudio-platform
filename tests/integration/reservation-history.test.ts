import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db/prisma'
import {
  cancelMemberReservation,
  joinSessionWaitlist,
  leaveSessionWaitlist,
  reservePublishedSession,
} from '@/modules/reservations/server/member-reservation-mutations'

import { createDatabase, deploy, historyFix, migrations } from './database'
import { createScenario } from './fixtures'

let database: Awaited<ReturnType<typeof createDatabase>>

beforeAll(async () => {
  database = await createDatabase(process.env.DATABASE_URL)
  deploy(database.url, process.env.INTEGRATION_SCHEMA === 'legacy'
    ? migrations.filter((name) => name < historyFix)
    : migrations)
})

afterAll(async () => {
  await prisma.$disconnect()
  if (database) await database.dispose()
})

describe('reservation services on PostgreSQL', () => {
  it('preserves three book/cancel cycles, entitlement uses, credits and notification jobs', async () => {
    const { member, session } = await createScenario(prisma)
    const reservationIds: string[] = []
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const booked = await reservePublishedSession(member)
      expect(booked.code).toBe('BOOKED')
      expect(booked.updatedEntityId).toBeTypeOf('string')
      const reservationId = booked.updatedEntityId!
      reservationIds.push(reservationId)
      const canceled = await cancelMemberReservation({ ...member, reservationId })
      expect(canceled.code).toBe('CANCELED')
      expect((await prisma.classSession.findUniqueOrThrow({ where: { id: session.id } })).reservedCount).toBe(0)
    }
    expect(new Set(reservationIds).size).toBe(3)
    const history = await prisma.reservation.findMany({
      where: { memberId: member.memberId },
      include: { entitlementUsages: true },
    })
    expect(history).toHaveLength(3)
    for (const reservation of history) {
      expect(reservation.status).toBe('CANCELED')
      expect(reservation.canceledAt).toEqual(member.now)
      expect(reservation.canceledByUserId).toBe(member.userId)
      expect(reservation.entitlementUsages).toHaveLength(1)
      expect(reservation.entitlementUsages[0].creditsUsed).toBe(1)
    }
    const ledger = await prisma.creditLedgerEntry.findMany({
      where: { memberCreditAccountId: member.creditAccountId },
      orderBy: { createdAt: 'asc' },
    })
    expect(ledger).toHaveLength(6)
    expect(ledger.map((entry) => entry.entryType)).toEqual([
      'RESERVATION_CONSUME', 'RESERVATION_REFUND',
      'RESERVATION_CONSUME', 'RESERVATION_REFUND',
      'RESERVATION_CONSUME', 'RESERVATION_REFUND',
    ])
    expect(ledger.map((entry) => entry.balanceAfter)).toEqual([4, 5, 4, 5, 4, 5])
    expect(ledger.reduce((sum, entry) => sum + entry.creditsDelta, 0)).toBe(0)
    const jobs = await prisma.notificationJob.findMany({ where: { referenceId: { in: reservationIds } } })
    expect(jobs).toHaveLength(6)
    expect(new Set(jobs.map((job) => job.idempotencyKey)).size).toBe(6)
    expect(jobs.every((job) => job.status === 'PENDING')).toBe(true)
  })

  it('preserves three waitlist join/leave cycles and resequences active positions', async () => {
    const { member, createMember, session } = await createScenario(prisma)
    expect((await reservePublishedSession(await createMember())).code).toBe('BOOKED')
    const follower = await createMember()
    const entryIds: string[] = []
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const joined = await joinSessionWaitlist(member)
      expect(joined.code).toBe('WAITLIST_JOINED')
      const waitlistEntryId = joined.updatedEntityId!
      entryIds.push(waitlistEntryId)
      if (cycle === 0) expect((await joinSessionWaitlist(follower)).code).toBe('WAITLIST_JOINED')
      expect((await leaveSessionWaitlist({ ...member, waitlistEntryId })).code).toBe('WAITLIST_LEFT')
      const active = await prisma.waitlistEntry.findMany({
        where: { classSessionId: session.id, status: { in: ['WAITING', 'NOTIFIED'] } },
      })
      expect(active).toHaveLength(1)
      expect(active[0]).toMatchObject({ memberId: follower.memberId, position: 1 })
    }
    expect(new Set(entryIds).size).toBe(3)
    expect(await prisma.waitlistEntry.count({
      where: { memberId: member.memberId, status: 'REMOVED' },
    })).toBe(3)
  })

  it('rejects duplicate BOOKED rows at the database boundary', async () => {
    const { member } = await createScenario(prisma)
    expect((await reservePublishedSession(member)).code).toBe('BOOKED')
    await expect(prisma.reservation.create({
      data: { memberId: member.memberId, classSessionId: member.classSessionId, status: 'BOOKED' },
    })).rejects.toMatchObject({ code: 'P2002' })
    expect((await reservePublishedSession(member)).code).toBe('ALREADY_BOOKED')
  })

  it.each([
    ['WAITING', 'WAITING'],
    ['WAITING', 'NOTIFIED'],
    ['NOTIFIED', 'WAITING'],
    ['NOTIFIED', 'NOTIFIED'],
  ] as const)('rejects active waitlist overlap %s / %s at the database boundary', async (first, second) => {
    const { member } = await createScenario(prisma)
    const data = { memberId: member.memberId, classSessionId: member.classSessionId }
    await prisma.waitlistEntry.create({ data: { ...data, status: first } })
    await expect(prisma.waitlistEntry.create({ data: { ...data, status: second } }))
      .rejects.toMatchObject({ code: 'P2002' })
    expect((await joinSessionWaitlist(member)).code).toBe('ALREADY_WAITLISTED')
  })

  it('allows repeated terminal statuses while preserving a new active row', async () => {
    const { member } = await createScenario(prisma)
    const data = { memberId: member.memberId, classSessionId: member.classSessionId }
    for (const status of ['CANCELED', 'ATTENDED', 'NO_SHOW'] as const) {
      await prisma.reservation.createMany({ data: [{ ...data, status }, { ...data, status }] })
    }
    await prisma.reservation.create({ data: { ...data, status: 'BOOKED' } })
    for (const status of ['PROMOTED', 'EXPIRED', 'REMOVED'] as const) {
      await prisma.waitlistEntry.createMany({ data: [{ ...data, status }, { ...data, status }] })
    }
    await prisma.waitlistEntry.create({ data: { ...data, status: 'WAITING' } })
    expect(await prisma.reservation.count({ where: data })).toBe(7)
    expect(await prisma.waitlistEntry.count({ where: data })).toBe(7)
  })

  it('serializes two real bookings racing for the last place without extra debits or jobs', async () => {
    const { member, createMember, session } = await createScenario(prisma)
    const competitor = await createMember()
    await database.client.query('BEGIN')
    await database.client.query('LOCK TABLE "ClassSession" IN SHARE MODE')
    const pending = Promise.allSettled([
      reservePublishedSession(member),
      reservePublishedSession(competitor),
    ])
    try {
      await expect.poll(async () => {
        await database.client.query('SELECT pg_stat_clear_snapshot()')
        const { rows } = await database.client.query<{ count: number }>(`
          SELECT count(*)::int AS count FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'
            AND query LIKE 'UPDATE%"ClassSession"%'
        `)
        return rows[0].count
      }, { timeout: 3000, interval: 20 }).toBe(2)
    } finally {
      await database.client.query('ROLLBACK')
      await pending
    }
    const outcomes = await pending
    expect(outcomes.every((outcome) => outcome.status === 'fulfilled')).toBe(true)
    const results = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? [outcome.value.code] : [])
    expect(results.sort()).toEqual(['BOOKED', 'SESSION_FULL'])
    const reservations = await prisma.reservation.findMany({ where: { classSessionId: session.id } })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe('BOOKED')
    expect((await prisma.classSession.findUniqueOrThrow({ where: { id: session.id } })).reservedCount).toBe(1)
    expect(await prisma.reservationEntitlementUsage.count({
      where: { reservation: { classSessionId: session.id } },
    })).toBe(1)
    const ledger = await prisma.creditLedgerEntry.findMany({
      where: { memberCreditAccountId: { in: [member.creditAccountId, competitor.creditAccountId] } },
    })
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({ creditsDelta: -1, balanceAfter: 4 })
    expect(await prisma.notificationJob.count({ where: { referenceId: reservations[0].id } })).toBe(1)
  })
})
