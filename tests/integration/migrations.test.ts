import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import type { Client } from 'pg'
import { describe, expect, it } from 'vitest'

import {
  baseline,
  createDatabase,
  deploy,
  historyFix,
  legacyMigrations,
  migrations,
  migrationsPath,
  runPrisma,
  withMigrationHistory,
} from './database'
import { createScenario } from './fixtures'

function migrationSql(name: string) {
  return readFileSync(path.join(migrationsPath, name, 'migration.sql'), 'utf8')
}

async function appliedMigrations(client: Client) {
  return (await client.query<{ migration_name: string, checksum: string }>(`
    SELECT migration_name, checksum FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name
  `)).rows
}

async function assertFinalSchema(client: Client, url: string) {
  expect((await appliedMigrations(client)).map((row) => row.migration_name)).toEqual(migrations)
  for (const row of await appliedMigrations(client)) {
    expect(row.checksum).toBe(createHash('sha256').update(migrationSql(row.migration_name)).digest('hex'))
  }
  const { rows: indexes } = await client.query<{ indexname: string, indexdef: string }>(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND tablename IN ('Reservation', 'WaitlistEntry')
  `)
  expect(indexes.find((index) => index.indexname === 'reservation_member_session_booked_unique')?.indexdef)
    .toContain(`WHERE (status = 'BOOKED'::"ReservationStatus")`)
  const waitlist = indexes.find((index) => index.indexname === 'waitlist_member_session_active_unique')?.indexdef
  expect(waitlist).toContain('CREATE UNIQUE INDEX')
  expect(waitlist).toContain(`'WAITING'::"WaitlistStatus", 'NOTIFIED'::"WaitlistStatus"`)
  expect(indexes.some((index) => index.indexname.endsWith('_status_unique'))).toBe(false)
  const { rows: unprotected } = await client.query(`
    SELECT relname FROM pg_class JOIN pg_namespace n ON n.oid = relnamespace
    WHERE n.nspname = 'public' AND relkind = 'r'
      AND relname <> '_prisma_migrations' AND NOT relrowsecurity
  `)
  expect(unprotected).toEqual([])
  expect(runPrisma(url, [
    'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code',
  ])).toContain('No difference detected')
}

describe('PostgreSQL migration history', () => {
  it('reproduces the original empty database deployment failure', async () => {
    const database = await createDatabase()
    try {
      expect(() => deploy(database.url, legacyMigrations)).toThrow(/P3018/)
      const { rows } = await database.client.query<{ logs: string }>('SELECT logs FROM "_prisma_migrations"')
      expect(rows).toHaveLength(1)
      expect(rows[0].logs).toContain('42P01')
      expect(rows[0].logs).toContain('relation "Reservation" does not exist')
    } finally {
      await database.dispose()
    }
  })

  it('deploys an empty database through all migrations and can deploy again', async () => {
    const database = await createDatabase()
    try {
      deploy(database.url)
      await assertFinalSchema(database.client, database.url)
      expect(deploy(database.url)).toContain('No pending migrations to apply')
    } finally {
      await database.dispose()
    }
  })

  it('baselines an existing database and upgrades without rewriting history or losing rows', async () => {
    const database = await createDatabase()
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: database.url }) })
    try {
      await database.client.query(migrationSql(baseline))
      await database.client.query(migrationSql(legacyMigrations[0]))
      withMigrationHistory(legacyMigrations, (config) => {
        runPrisma(database.url, ['migrate', 'resolve', '--applied', legacyMigrations[0], '--config', config])
        runPrisma(database.url, ['migrate', 'deploy', '--config', config])
      })
      const oldHistory = await appliedMigrations(database.client)
      expect(oldHistory.map((row) => row.migration_name)).toEqual(legacyMigrations)

      const { member } = await createScenario(prisma)
      const data = { memberId: member.memberId, classSessionId: member.classSessionId }
      const reservation = await prisma.reservation.create({
        data: {
          ...data,
          status: 'CANCELED',
          canceledAt: member.now,
          canceledByUserId: member.userId,
          entitlementUsages: {
            create: {
              usageType: 'CREDIT',
              memberCreditAccountId: member.creditAccountId,
              creditsUsed: 1,
            },
          },
        },
        include: { entitlementUsages: true },
      })
      const entry = await prisma.waitlistEntry.create({ data: { ...data, status: 'REMOVED' } })
      await expect(prisma.reservation.create({ data: { ...data, status: 'CANCELED' } }))
        .rejects.toMatchObject({ code: 'P2002' })
      await expect(prisma.waitlistEntry.create({ data: { ...data, status: 'REMOVED' } }))
        .rejects.toMatchObject({ code: 'P2002' })

      runPrisma(database.url, ['migrate', 'resolve', '--applied', baseline])
      const output = deploy(database.url)
      expect(output).toContain(`Applying migration \`${historyFix}\``)
      expect(output).not.toContain(`Applying migration \`${baseline}\``)
      expect((await appliedMigrations(database.client))
        .filter((row) => legacyMigrations.includes(row.migration_name))).toEqual(oldHistory)
      expect(await prisma.reservation.findUnique({
        where: { id: reservation.id }, include: { entitlementUsages: true },
      })).toEqual(reservation)
      expect(await prisma.waitlistEntry.findUnique({ where: { id: entry.id } })).toEqual(entry)
      await prisma.reservation.create({ data: { ...data, status: 'CANCELED' } })
      await prisma.waitlistEntry.create({ data: { ...data, status: 'REMOVED' } })
      await assertFinalSchema(database.client, database.url)
    } finally {
      await prisma.$disconnect()
      await database.dispose()
    }
  })
})
