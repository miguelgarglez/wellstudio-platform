import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_SESSIONS_E2E_CLASS = 'E2E Agenda Flow'
const CLASS_SLUG = 'e2e-admin-agenda-flow'
const COACH_NAME = 'E2E Agenda Coach'

export async function prepareSandboxAdminSessionsFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to prepare the admin sessions fixture')

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const classType = await client.query<{ id: string }>(
      `
        insert into "ClassType" (
          id, name, slug, "durationMinutes", "capacityDefault", "waitlistEnabled",
          "isPublic", status, "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2, 50, 9, true, true, 'ACTIVE', now(), now()
        )
        on conflict (slug) do update set
          name = excluded.name,
          "durationMinutes" = excluded."durationMinutes",
          "capacityDefault" = excluded."capacityDefault",
          status = 'ACTIVE',
          "updatedAt" = now()
        returning id
      `,
      [ADMIN_SESSIONS_E2E_CLASS, CLASS_SLUG],
    )
    const classTypeId = classType.rows[0]?.id
    if (!classTypeId) throw new Error('Could not prepare agenda class type')

    const coach = await client.query<{ id: string }>(
      `
        select id from "Coach" where "displayName" = $1 limit 1
      `,
      [COACH_NAME],
    )
    let coachId = coach.rows[0]?.id
    if (!coachId) {
      const created = await client.query<{ id: string }>(
        `
          insert into "Coach" (id, "displayName", status, "createdAt", "updatedAt")
          values (gen_random_uuid()::text, $1, 'ACTIVE', now(), now())
          returning id
        `,
        [COACH_NAME],
      )
      coachId = created.rows[0]?.id
    }
    if (!coachId) throw new Error('Could not prepare agenda coach')

    await client.query(
      `delete from "AuditLog" where "entityType" = 'ClassSession' and "entityId" in (select id from "ClassSession" where "classTypeId" = $1)`,
      [classTypeId],
    )
    await client.query(`delete from "ClassSession" where "classTypeId" = $1`, [classTypeId])

    return { classTypeId, coachId, coachName: COACH_NAME }
  } finally {
    await client.end()
  }
}
