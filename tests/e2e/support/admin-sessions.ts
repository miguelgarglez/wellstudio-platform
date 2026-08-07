import { Client } from 'pg'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_SESSIONS_E2E_CLASS = 'E2E Agenda Flow'
export const ADMIN_ATTENDANCE_E2E_CLASS = 'E2E Attendance Flow'
const CLASS_SLUG = 'e2e-admin-agenda-flow'
const ATTENDANCE_CLASS_SLUG = 'e2e-admin-attendance-flow'
const COACH_NAME = 'E2E Agenda Coach'
export const ATTENDANCE_GUEST_NAME = 'E2E Attendance Guest'
const ATTENDANCE_GUEST_EMAIL = 'e2e.attendance.guest@wellstudio.test'

export async function prepareSandboxAdminSessionsFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to prepare the admin sessions fixture')

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const { email: memberEmail } = getSandboxCredentials()
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

    const attendanceClassType = await client.query<{ id: string }>(
      `
        insert into "ClassType" (
          id, name, slug, "durationMinutes", "capacityDefault", "waitlistEnabled",
          "isPublic", status, "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2, 50, 8, false, false, 'ACTIVE', now(), now()
        )
        on conflict (slug) do update set name = excluded.name, status = 'ACTIVE', "updatedAt" = now()
        returning id
      `,
      [ADMIN_ATTENDANCE_E2E_CLASS, ATTENDANCE_CLASS_SLUG],
    )
    const attendanceClassTypeId = attendanceClassType.rows[0]?.id
    if (!attendanceClassTypeId) throw new Error('Could not prepare attendance class type')

    await client.query(
      `delete from "AuditLog" where "entityType" = 'ClassSession' and "entityId" in (select id from "ClassSession" where "classTypeId" = $1)`,
      [classTypeId],
    )
    await client.query(`delete from "ClassSession" where "classTypeId" = $1`, [classTypeId])

    await client.query(
      `delete from "AuditLog" where "entityType" = 'ClassSession' and "entityId" in (select id from "ClassSession" where "classTypeId" = $1)`,
      [attendanceClassTypeId],
    )
    await client.query(`delete from "ClassSession" where "classTypeId" = $1`, [attendanceClassTypeId])

    const managedMember = await client.query<{ id: string }>(
      `
        select m.id
        from "Member" m
        inner join "User" u on u.id = m."userId"
        where u."normalizedEmail" = lower($1)
        limit 1
      `,
      [memberEmail],
    )
    const managedMemberId = managedMember.rows[0]?.id
    if (!managedMemberId) throw new Error(`Sandbox member ${memberEmail} is missing`)

    const guestUser = await client.query<{ id: string }>(
      `
        insert into "User" (id, email, "normalizedEmail", status, "createdAt", "updatedAt")
        values (gen_random_uuid()::text, $1, lower($1), 'ACTIVE', now(), now())
        on conflict ("normalizedEmail") do update set status = 'ACTIVE', "updatedAt" = now()
        returning id
      `,
      [ATTENDANCE_GUEST_EMAIL],
    )
    const guestUserId = guestUser.rows[0]?.id
    if (!guestUserId) throw new Error('Could not prepare attendance guest user')

    const guestMember = await client.query<{ id: string }>(
      `
        insert into "Member" (id, "userId", "firstName", "lastName", status, "joinedAt", "createdAt", "updatedAt")
        values (gen_random_uuid()::text, $1, 'E2E Attendance', 'Guest', 'ACTIVE', now(), now(), now())
        on conflict ("userId") do update set
          "firstName" = 'E2E Attendance', "lastName" = 'Guest', status = 'ACTIVE', "updatedAt" = now()
        returning id
      `,
      [guestUserId],
    )
    const guestMemberId = guestMember.rows[0]?.id
    if (!guestMemberId) throw new Error('Could not prepare attendance guest member')

    const attendanceSession = await client.query<{ id: string }>(
      `
        insert into "ClassSession" (
          id, "classTypeId", "coachId", "startsAt", "endsAt", capacity,
          "reservedCount", "waitlistEnabled", "locationLabel", status, "publishedAt", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, $2, now() - interval '3 hours', now() - interval '2 hours 10 minutes',
          8, 2, false, 'Sala asistencia E2E', 'CLOSED', now() - interval '2 days', now(), now()
        )
        returning id
      `,
      [attendanceClassTypeId, coachId],
    )
    const attendanceSessionId = attendanceSession.rows[0]?.id
    if (!attendanceSessionId) throw new Error('Could not prepare attendance session')

    await client.query(
      `
        insert into "Reservation" (
          id, "memberId", "classSessionId", status, "attendanceStatus", source,
          "bookedAt", "createdAt", "updatedAt"
        ) values
          (gen_random_uuid()::text, $1, $3, 'BOOKED', 'PENDING', 'STAFF', now() - interval '1 day', now(), now()),
          (gen_random_uuid()::text, $2, $3, 'BOOKED', 'PENDING', 'STAFF', now() - interval '1 day', now(), now())
      `,
      [managedMemberId, guestMemberId, attendanceSessionId],
    )

    return { classTypeId, coachId, coachName: COACH_NAME, attendanceSessionId }
  } finally {
    await client.end()
  }
}
