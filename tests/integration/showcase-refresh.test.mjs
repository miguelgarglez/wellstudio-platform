import assert from 'node:assert/strict'
import test from 'node:test'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import {
  buildRollingShowcaseSessionBlueprints,
  ensureShowcaseVitrinaScenario,
  refreshShowcaseVitrinaSessions,
} from '../../modules/testing/server/sandbox-scenarios/showcase-vitrina.mjs'

const connectionString = process.env.SHOWCASE_TEST_DATABASE_URL
assert.ok(connectionString, 'Set SHOWCASE_TEST_DATABASE_URL to an empty isolated local database.')
const database = new URL(connectionString)
assert.ok(['postgres:', 'postgresql:'].includes(database.protocol))
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname), 'Local PostgreSQL only.')
assert.equal(database.pathname, '/wellstudio_showcase_test')
assert.equal(database.search, '', 'Connection overrides are not permitted.')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const now = new Date('2026-09-21T00:00:00Z')

async function activitySnapshot() {
  return Promise.all([
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.member.findMany({ orderBy: { id: 'asc' } }),
    prisma.reservation.findMany({ orderBy: { id: 'asc' } }),
    prisma.waitlistEntry.findMany({ orderBy: { id: 'asc' } }),
    prisma.memberMembership.findMany({ orderBy: { id: 'asc' } }),
    prisma.memberCreditAccount.findMany({ orderBy: { id: 'asc' } }),
    prisma.creditLedgerEntry.findMany({ orderBy: { id: 'asc' } }),
    prisma.reservationEntitlementUsage.findMany({ orderBy: { id: 'asc' } }),
    prisma.classTypeEligibilityRule.findMany({ orderBy: { id: 'asc' } }),
    prisma.payment.findMany({ orderBy: { id: 'asc' } }),
    prisma.notificationJob.findMany({ orderBy: { id: 'asc' } }),
  ])
}

test('additive showcase refresh against isolated PostgreSQL', async (t) => {
  try {
    assert.equal(await prisma.user.count(), 0, 'Use a fresh local test database; this test never resets data.')
    assert.equal(await prisma.classSession.count(), 0, 'Use a fresh local test database.')

    await t.test('fails without bootstrapping a missing catalog', async () => {
      await assert.rejects(refreshShowcaseVitrinaSessions({ prisma, now }), /catalog is not ready/)
      assert.equal(await prisma.classSession.count(), 0)
      assert.equal(await prisma.classType.count(), 0)
    })

    await ensureShowcaseVitrinaScenario({ prisma, now })
    const member = await prisma.member.create({
      data: {
        firstName: 'Independent', lastName: 'Member', status: 'ACTIVE',
        user: { create: {
          email: 'independent@example.test', normalizedEmail: 'independent@example.test', status: 'ACTIVE',
        } },
        memberships: { create: {
          membershipPlan: { connect: { slug: 'showcase-plan-constancia' } },
          status: 'ACTIVE', startsAt: now,
        } },
        creditAccounts: { create: {
          creditPack: { connect: { slug: 'showcase-bono-6' } },
          status: 'ACTIVE',
          ledgerEntries: { create: { entryType: 'PURCHASE', creditsDelta: 6, balanceAfter: 6 } },
        } },
      },
    })
    const seededSession = await prisma.classSession.findFirstOrThrow({ orderBy: { startsAt: 'asc' } })
    await prisma.reservation.create({
      data: { memberId: member.id, classSessionId: seededSession.id, status: 'BOOKED' },
    })
    await prisma.classSession.update({
      where: { id: seededSession.id }, data: { reservedCount: { increment: 1 } },
    })
    await prisma.waitlistEntry.create({
      data: { memberId: member.id, classSessionId: seededSession.id, status: 'WAITING' },
    })

    const [firstSlot] = buildRollingShowcaseSessionBlueprints(now)
    const canceled = await prisma.classSession.create({
      data: {
        classType: { connect: { slug: firstSlot.classTypeSlug } },
        startsAt: firstSlot.startsAt, endsAt: firstSlot.endsAt,
        capacity: 5, status: 'CANCELED',
      },
    })
    const originalSessions = await prisma.classSession.findMany({ orderBy: { id: 'asc' } })
    const activity = await activitySnapshot()

    await t.test('creates future sessions without touching member activity or canceled operator slots', async () => {
      const result = await refreshShowcaseVitrinaSessions({ prisma, now })
      assert.ok(result.createdCount > 0 && result.createdCount <= 11)
      assert.ok(result.futureSessionCount > 0)
      assert.deepEqual(await activitySnapshot(), activity)
      assert.deepEqual(
        await prisma.classSession.findMany({
          where: { id: { in: originalSessions.map((session) => session.id) } }, orderBy: { id: 'asc' },
        }),
        originalSessions,
      )
      assert.equal(await prisma.classSession.count({
        where: { classTypeId: canceled.classTypeId, startsAt: canceled.startsAt },
      }), 1)
      const created = await prisma.classSession.findMany({ where: { id: { startsWith: 'showcase-rolling-' } } })
      assert.ok(created.every((session) => session.reservedCount === 0))
    })

    await t.test('is idempotent with concurrent callers and preserves rescheduled stable IDs', async () => {
      const shifted = await prisma.classSession.findFirstOrThrow({
        where: { id: { startsWith: 'showcase-rolling-' } }, orderBy: { startsAt: 'asc' },
      })
      await prisma.classSession.update({
        where: { id: shifted.id },
        data: { startsAt: new Date(shifted.startsAt.getTime() + 3_600_000) },
      })
      const count = await prisma.classSession.count()
      const results = await Promise.all([
        refreshShowcaseVitrinaSessions({ prisma, now }),
        refreshShowcaseVitrinaSessions({ prisma, now }),
      ])
      assert.ok(results.every((result) => result.createdCount === 0))
      assert.equal(await prisma.classSession.count(), count)
      assert.deepEqual(await activitySnapshot(), activity)
    })

    await t.test('adds only the next week at rollover, retaining historical sessions and activity', async () => {
      const existing = await prisma.classSession.findMany({ orderBy: { id: 'asc' } })
      const later = new Date('2026-09-28T00:00:00Z')
      const results = await Promise.all([
        refreshShowcaseVitrinaSessions({ prisma, now: later }),
        refreshShowcaseVitrinaSessions({ prisma, now: later }),
      ])
      assert.equal(results.reduce((sum, result) => sum + result.createdCount, 0), 6)
      assert.equal(await prisma.classSession.count(), existing.length + 6)
      assert.deepEqual(await activitySnapshot(), activity)
      assert.deepEqual(await prisma.classSession.findMany({
        where: { id: { in: existing.map((session) => session.id) } }, orderBy: { id: 'asc' },
      }), existing)
      assert.equal((await refreshShowcaseVitrinaSessions({ prisma, now: later })).createdCount, 0)
    })

    await t.test('does not reactivate an archived showcase class type or insert partial data', async () => {
      const count = await prisma.classSession.count()
      await prisma.classType.update({
        where: { slug: 'showcase-fuerza-premium' }, data: { status: 'ARCHIVED' },
      })
      await assert.rejects(
        refreshShowcaseVitrinaSessions({ prisma, now: new Date('2026-10-12T00:00:00Z') }),
        /catalog is not ready/,
      )
      assert.equal(await prisma.classSession.count(), count)
      assert.deepEqual(await activitySnapshot(), activity)
    })
  } finally {
    await prisma.$disconnect()
  }
})
