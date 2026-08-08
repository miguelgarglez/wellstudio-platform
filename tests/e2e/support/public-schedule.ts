import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const PUBLIC_SCHEDULE_E2E_CLASS = 'E2E Fuerza Pública'
export const PUBLIC_SCHEDULE_E2E_SECOND_CLASS = 'E2E Movilidad Pública'
export const PUBLIC_SCHEDULE_E2E_COACH = 'Marta E2E'
export const PUBLIC_SCHEDULE_E2E_SECOND_COACH = 'Leo E2E'
const PUBLIC_CLASS_SLUG = 'e2e-public-schedule'
const SECOND_PUBLIC_CLASS_SLUG = 'e2e-public-schedule-mobility'
const PRIVATE_CLASS_SLUG = 'e2e-private-schedule'

export function hasPublicScheduleDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function preparePublicScheduleFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for the public schedule fixture')

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const publicClassTypeId = await upsertClassType(client, {
      name: PUBLIC_SCHEDULE_E2E_CLASS,
      slug: PUBLIC_CLASS_SLUG,
      isPublic: true,
      category: 'Fuerza',
    })
    const secondPublicClassTypeId = await upsertClassType(client, {
      name: PUBLIC_SCHEDULE_E2E_SECOND_CLASS,
      slug: SECOND_PUBLIC_CLASS_SLUG,
      isPublic: true,
      category: 'Movilidad',
    })
    const privateClassTypeId = await upsertClassType(client, {
      name: 'E2E Clase Privada',
      slug: PRIVATE_CLASS_SLUG,
      isPublic: false,
      category: 'Privada',
    })

    await client.query(
      `delete from "ClassSession" where "classTypeId" = any($1::text[])`,
      [[publicClassTypeId, secondPublicClassTypeId, privateClassTypeId]],
    )

    const coachId = await upsertCoach(client, PUBLIC_SCHEDULE_E2E_COACH)
    const secondCoachId = await upsertCoach(client, PUBLIC_SCHEDULE_E2E_SECOND_COACH)

    const publicSession = await client.query<{ id: string }>(
      `
        insert into "ClassSession" (
          id, "classTypeId", "coachId", "startsAt", "endsAt", capacity, "reservedCount",
          "waitlistEnabled", "locationLabel", status, "publishedAt", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2,
          date_trunc('day', now()) + interval '2 days 17 hours',
          date_trunc('day', now()) + interval '2 days 17 hours 55 minutes',
          8, 6, true, 'Sala E2E Pública', 'PUBLISHED', now(), now(), now()
        ) returning id
      `,
      [publicClassTypeId, coachId],
    )
    const draftSession = await client.query<{ id: string }>(
      `
        insert into "ClassSession" (
          id, "classTypeId", "startsAt", "endsAt", capacity, "reservedCount",
          "waitlistEnabled", status, "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1,
          date_trunc('day', now()) + interval '3 days 17 hours',
          date_trunc('day', now()) + interval '3 days 17 hours 55 minutes',
          8, 0, true, 'DRAFT', now(), now()
        ) returning id
      `,
      [publicClassTypeId],
    )

    await client.query(
      `
        insert into "ClassSession" (
          id, "classTypeId", "startsAt", "endsAt", capacity, "reservedCount",
          "waitlistEnabled", status, "publishedAt", "createdAt", "updatedAt"
        ) values
          (gen_random_uuid()::text, $1, date_trunc('day', now()) + interval '4 days 17 hours', date_trunc('day', now()) + interval '4 days 17 hours 55 minutes', 8, 0, true, 'PUBLISHED', now(), now(), now()),
          (gen_random_uuid()::text, $2, now() - interval '2 days', now() - interval '2 days' + interval '55 minutes', 8, 0, true, 'PUBLISHED', now() - interval '3 days', now(), now())
      `,
      [privateClassTypeId, publicClassTypeId],
    )

    await client.query(
      `
        insert into "ClassSession" (
          id, "classTypeId", "coachId", "startsAt", "endsAt", capacity, "reservedCount",
          "waitlistEnabled", "locationLabel", status, "publishedAt", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2,
          date_trunc('day', now()) + interval '3 days 10 hours',
          date_trunc('day', now()) + interval '3 days 10 hours 45 minutes',
          10, 1, true, 'Sala E2E Movimiento', 'PUBLISHED', now(), now(), now()
        )
      `,
      [secondPublicClassTypeId, secondCoachId],
    )

    const sessionId = publicSession.rows[0]?.id
    const hiddenSessionId = draftSession.rows[0]?.id
    if (!sessionId || !hiddenSessionId) throw new Error('Could not prepare public schedule sessions')

    return { sessionId, hiddenSessionId }
  } finally {
    await client.end()
  }
}

async function upsertCoach(client: Client, displayName: string) {
  const existing = await client.query<{ id: string }>(
    `select id from "Coach" where "displayName" = $1 order by "createdAt" asc limit 1`,
    [displayName],
  )
  const existingId = existing.rows[0]?.id

  if (existingId) {
    await client.query(
      `update "Coach" set status = 'ACTIVE', "updatedAt" = now() where id = $1`,
      [existingId],
    )
    return existingId
  }

  const created = await client.query<{ id: string }>(
    `insert into "Coach" (id, "displayName", status, "createdAt", "updatedAt") values (gen_random_uuid()::text, $1, 'ACTIVE', now(), now()) returning id`,
    [displayName],
  )
  const id = created.rows[0]?.id
  if (!id) throw new Error(`Could not prepare coach ${displayName}`)
  return id
}

async function upsertClassType(
  client: Client,
  input: { name: string; slug: string; isPublic: boolean; category: string },
) {
  const result = await client.query<{ id: string }>(
    `
      insert into "ClassType" (
        id, name, slug, description, category, "durationMinutes", "capacityDefault",
        "waitlistEnabled", "isPublic", status, "createdAt", "updatedAt"
      ) values (
        gen_random_uuid()::text, $1, $2, 'Sesión pública preparada para validar la agenda.',
        $4, 55, 8, true, $3, 'ACTIVE', now(), now()
      )
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description,
        category = excluded.category,
        "isPublic" = excluded."isPublic",
        status = 'ACTIVE',
        "updatedAt" = now()
      returning id
    `,
    [input.name, input.slug, input.isPublic, input.category],
  )
  const id = result.rows[0]?.id
  if (!id) throw new Error(`Could not prepare class type ${input.slug}`)
  return id
}
