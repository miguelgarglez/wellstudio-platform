import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const REPORTS_RECENT_CLASS = 'E2E Informe Fuerza reciente'
export const REPORTS_OLDER_CLASS = 'E2E Informe Movilidad histórica'
export const REPORTS_QUALITY_CLASS = 'E2E Informe Calidad pendiente'
export const REPORTS_SOURCE = 'e2e-reporting'
export const REPORTS_OLDER_SOURCE = 'e2e-reporting-older'

const REPORT_CLASS_SLUGS = [
  'e2e-admin-report-recent',
  'e2e-admin-report-older',
  'e2e-admin-report-quality',
]

export async function prepareSandboxAdminReportsFixture() {
  const client = await connect()

  try {
    await cleanupWithClient(client)

    const members = await client.query<{ id: string }>(
      `select id from "Member" where status = 'ACTIVE' order by "createdAt" asc limit 2`,
    )
    if (members.rows.length < 2) {
      throw new Error('At least two active sandbox members are required for admin reports E2E')
    }
    const [firstMember, secondMember] = members.rows

    const recentClassTypeId = await insertClassType(client, REPORTS_RECENT_CLASS, REPORT_CLASS_SLUGS[0], 10)
    const olderClassTypeId = await insertClassType(client, REPORTS_OLDER_CLASS, REPORT_CLASS_SLUGS[1], 8)
    const qualityClassTypeId = await insertClassType(client, REPORTS_QUALITY_CLASS, REPORT_CLASS_SLUGS[2], 6)

    const recentSessionId = await insertSession(client, {
      classTypeId: recentClassTypeId,
      startInterval: '3 days',
      capacity: 10,
      reservedCount: 2,
      status: 'COMPLETED',
    })
    const olderSessionId = await insertSession(client, {
      classTypeId: olderClassTypeId,
      startInterval: '14 days',
      capacity: 8,
      reservedCount: 1,
      status: 'COMPLETED',
    })
    const qualitySessionId = await insertSession(client, {
      classTypeId: qualityClassTypeId,
      startInterval: '2 days',
      capacity: 6,
      reservedCount: 1,
      status: 'PUBLISHED',
    })

    await client.query(
      `
        insert into "Reservation" (
          id, "memberId", "classSessionId", status, "attendanceStatus", source,
          "bookedAt", "canceledAt", "createdAt", "updatedAt"
        ) values
          (gen_random_uuid()::text, $1, $3, 'ATTENDED', 'ATTENDED', 'STAFF', now() - interval '4 days', null, now(), now()),
          (gen_random_uuid()::text, $2, $3, 'NO_SHOW', 'NO_SHOW', 'STAFF', now() - interval '4 days', null, now(), now()),
          (gen_random_uuid()::text, $1, $3, 'CANCELED', 'PENDING', 'STAFF', now() - interval '4 days', now() - interval '3 days', now(), now()),
          (gen_random_uuid()::text, $1, $4, 'ATTENDED', 'ATTENDED', 'STAFF', now() - interval '15 days', null, now(), now()),
          (gen_random_uuid()::text, $1, $5, 'BOOKED', 'PENDING', 'STAFF', now() - interval '3 days', null, now(), now())
      `,
      [firstMember.id, secondMember.id, recentSessionId, olderSessionId, qualitySessionId],
    )

    await client.query(
      `
        insert into "Lead" (
          id, "firstName", phone, "normalizedPhone", status, source, "utmSource",
          "convertedMemberId", "createdAt", "updatedAt"
        ) values
          (gen_random_uuid()::text, 'E2E Informe Uno', '611000001', '611000001', 'CONVERTED', 'public_home', $1, $3, now() - interval '2 days', now()),
          (gen_random_uuid()::text, 'E2E Informe Dos', '611000002', '611000002', 'NEW', 'public_home', $1, null, now() - interval '1 day', now()),
          (gen_random_uuid()::text, 'E2E Informe Antiguo', '611000003', '611000003', 'CONVERTED', 'public_home', $2, $3, now() - interval '14 days', now())
      `,
      [REPORTS_SOURCE, REPORTS_OLDER_SOURCE, firstMember.id],
    )
  } finally {
    await client.end()
  }
}

export async function cleanupSandboxAdminReportsFixture() {
  const client = await connect()
  try {
    await cleanupWithClient(client)
  } finally {
    await client.end()
  }
}

async function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for admin reports E2E')
  const client = new Client({ connectionString })
  await client.connect()
  return client
}

async function cleanupWithClient(client: Client) {
  await client.query(`delete from "Lead" where "utmSource" = any($1::text[])`, [[REPORTS_SOURCE, REPORTS_OLDER_SOURCE]])
  await client.query(
    `delete from "ClassSession" where "classTypeId" in (select id from "ClassType" where slug = any($1::text[]))`,
    [REPORT_CLASS_SLUGS],
  )
  await client.query(`delete from "ClassType" where slug = any($1::text[])`, [REPORT_CLASS_SLUGS])
}

async function insertClassType(client: Client, name: string, slug: string, capacity: number) {
  const result = await client.query<{ id: string }>(
    `
      insert into "ClassType" (
        id, name, slug, "durationMinutes", "capacityDefault", "waitlistEnabled",
        "isPublic", status, "createdAt", "updatedAt"
      ) values (
        gen_random_uuid()::text, $1, $2, 50, $3, false, false, 'ACTIVE', now(), now()
      ) returning id
    `,
    [name, slug, capacity],
  )
  const id = result.rows[0]?.id
  if (!id) throw new Error(`Could not create report class type ${name}`)
  return id
}

async function insertSession(client: Client, input: {
  classTypeId: string
  startInterval: string
  capacity: number
  reservedCount: number
  status: 'PUBLISHED' | 'COMPLETED'
}) {
  const result = await client.query<{ id: string }>(
    `
      insert into "ClassSession" (
        id, "classTypeId", "startsAt", "endsAt", capacity, "reservedCount",
        "waitlistEnabled", "locationLabel", status, "publishedAt", "createdAt", "updatedAt"
      ) values (
        gen_random_uuid()::text, $1, now() - $2::interval,
        now() - $2::interval + interval '50 minutes', $3, $4, false,
        'Sala informes E2E', $5::"ClassSessionStatus", now() - $2::interval - interval '2 days', now(), now()
      ) returning id
    `,
    [input.classTypeId, input.startInterval, input.capacity, input.reservedCount, input.status],
  )
  const id = result.rows[0]?.id
  if (!id) throw new Error('Could not create report class session')
  return id
}
