import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_SESSION_NOTIFICATIONS_CLASS = 'E2E Session Communications'
const CLASS_SLUG = 'e2e-session-communications'
const COACH_NAME = 'E2E Communications Coach'
const BOOKED_EMAIL = 'e2e.session.booked@wellstudio.test'
const WAITLIST_EMAIL = 'e2e.session.waitlist@wellstudio.test'

export async function prepareSandboxAdminSessionNotificationsFixture() {
  const client = await connect()

  try {
    const previousSessions = await client.query<{ id: string }>(
      `select id from "ClassSession" where "classTypeId" in (select id from "ClassType" where slug = $1)`,
      [CLASS_SLUG],
    )
    const previousIds = previousSessions.rows.map((row) => row.id)
    if (previousIds.length > 0) {
      await client.query(
        `delete from "AuditLog" where "entityType" = 'NotificationJob' and "entityId" in (select id from "NotificationJob" where "referenceType" = 'class_session' and "referenceId" = any($1::text[]))`,
        [previousIds],
      )
      await client.query(
        `delete from "NotificationJob" where "referenceType" = 'class_session' and "referenceId" = any($1::text[])`,
        [previousIds],
      )
      await client.query(
        `delete from "AuditLog" where "entityType" = 'ClassSession' and "entityId" = any($1::text[])`,
        [previousIds],
      )
      await client.query(`delete from "ClassSession" where id = any($1::text[])`, [previousIds])
    }

    const classType = await client.query<{ id: string }>(
      `
        insert into "ClassType" (
          id, name, slug, "durationMinutes", "capacityDefault", "waitlistEnabled",
          "isPublic", status, "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2, 50, 2, true, false, 'ACTIVE', now(), now()
        )
        on conflict (slug) do update set
          name = excluded.name, status = 'ACTIVE', "updatedAt" = now()
        returning id
      `,
      [ADMIN_SESSION_NOTIFICATIONS_CLASS, CLASS_SLUG],
    )
    const classTypeId = classType.rows[0]?.id
    if (!classTypeId) throw new Error('Could not prepare session communications class type')

    const coach = await client.query<{ id: string }>(
      `select id from "Coach" where "displayName" = $1 limit 1`,
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
    if (!coachId) throw new Error('Could not prepare session communications coach')

    const bookedMemberId = await upsertMember(client, {
      email: BOOKED_EMAIL,
      firstName: 'E2E Reserva',
      lastName: 'Afectada',
    })
    const waitlistMemberId = await upsertMember(client, {
      email: WAITLIST_EMAIL,
      firstName: 'E2E Waitlist',
      lastName: 'Afectada',
    })

    const session = await client.query<{ id: string; startsAt: Date }>(
      `
        insert into "ClassSession" (
          id, "classTypeId", "coachId", "startsAt", "endsAt", capacity,
          "reservedCount", "waitlistEnabled", "locationLabel", status,
          "publishedAt", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2,
          date_trunc('day', now() + interval '8 days') + interval '18 hours',
          date_trunc('day', now() + interval '8 days') + interval '18 hours 50 minutes',
          2, 1, true, 'Sala comunicaciones E2E', 'PUBLISHED', now(), now(), now()
        )
        returning id, "startsAt"
      `,
      [classTypeId, coachId],
    )
    const sessionId = session.rows[0]?.id
    const startsAt = session.rows[0]?.startsAt
    if (!sessionId || !startsAt) throw new Error('Could not prepare session communications session')

    await client.query(
      `
        insert into "Reservation" (
          id, "memberId", "classSessionId", status, "attendanceStatus", source,
          "bookedAt", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2, 'BOOKED', 'PENDING', 'STAFF', now(), now(), now()
        )
      `,
      [bookedMemberId, sessionId],
    )
    await client.query(
      `
        insert into "WaitlistEntry" (
          id, "memberId", "classSessionId", position, status, "joinedAt"
        ) values (gen_random_uuid()::text, $1, $2, 1, 'WAITING', now())
      `,
      [waitlistMemberId, sessionId],
    )

    return {
      sessionId,
      rescheduledLocalInput: formatMadridLocalInput(
        new Date(startsAt.getTime() + 24 * 60 * 60 * 1_000),
      ),
    }
  } finally {
    await client.end()
  }
}

export async function readSandboxSessionNotificationState(sessionId: string) {
  const client = await connect()

  try {
    const [jobs, reservation, waitlist] = await Promise.all([
      client.query<{
        eventType: string
        recipient: string
        status: string
        payload: { audience?: string; reason?: string }
      }>(
        `
          select "eventType", recipient, status, payload
          from "NotificationJob"
          where "referenceType" = 'class_session' and "referenceId" = $1
          order by "createdAt" asc
        `,
        [sessionId],
      ),
      client.query<{ status: string }>(
        `select status from "Reservation" where "classSessionId" = $1`,
        [sessionId],
      ),
      client.query<{ status: string }>(
        `select status from "WaitlistEntry" where "classSessionId" = $1`,
        [sessionId],
      ),
    ])

    return {
      jobs: jobs.rows,
      reservationStatus: reservation.rows[0]?.status ?? null,
      waitlistStatus: waitlist.rows[0]?.status ?? null,
    }
  } finally {
    await client.end()
  }
}

async function upsertMember(
  client: Client,
  input: { email: string; firstName: string; lastName: string },
) {
  const user = await client.query<{ id: string }>(
    `
      insert into "User" (id, email, "normalizedEmail", status, "createdAt", "updatedAt")
      values (gen_random_uuid()::text, $1, lower($1), 'ACTIVE', now(), now())
      on conflict ("normalizedEmail") do update set
        email = excluded.email, status = 'ACTIVE', "updatedAt" = now()
      returning id
    `,
    [input.email],
  )
  const userId = user.rows[0]?.id
  if (!userId) throw new Error(`Could not prepare user ${input.email}`)

  const member = await client.query<{ id: string }>(
    `
      insert into "Member" (
        id, "userId", "firstName", "lastName", status, "joinedAt", "createdAt", "updatedAt"
      ) values (gen_random_uuid()::text, $1, $2, $3, 'ACTIVE', now(), now(), now())
      on conflict ("userId") do update set
        "firstName" = excluded."firstName", "lastName" = excluded."lastName",
        status = 'ACTIVE', "updatedAt" = now()
      returning id
    `,
    [userId, input.firstName, input.lastName],
  )
  const memberId = member.rows[0]?.id
  if (!memberId) throw new Error(`Could not prepare member ${input.email}`)
  return memberId
}

async function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for admin session notification fixtures')
  }
  const client = new Client({ connectionString })
  await client.connect()
  return client
}

function formatMadridLocalInput(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}
