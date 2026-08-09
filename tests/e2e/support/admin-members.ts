import { Client } from 'pg'

import { normalizeEmail } from '@/modules/auth/lib/normalize-email'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_MEMBER_NOTE_E2E_PREFIX = '[E2E member note]'
export const ADMIN_STAFF_BOOKING_EMAIL = 'e2e.admin.playground.unlimited.sandbox@wellstudio.test'
export const ADMIN_STAFF_BOOKING_AVAILABLE_SESSION_ID = 'e2e-staff-booking-available'
export const ADMIN_STAFF_BOOKING_FULL_SESSION_ID = 'e2e-staff-booking-full'
const ADMIN_STAFF_BOOKING_CLASS_TYPE_ID = 'e2e-staff-booking-class-type'
const ADMIN_STAFF_BOOKING_BLOCKER_RESERVATION_ID = 'e2e-staff-booking-capacity-blocker'

export async function cleanupSandboxAdminMemberNotes() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to clean admin member notes')

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query('delete from "MemberNote" where body like $1', [`${ADMIN_MEMBER_NOTE_E2E_PREFIX}%`])
  } finally {
    await client.end()
  }
}

export async function prepareSandboxStaffBookingFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to prepare staff booking E2E')

  const client = new Client({ connectionString })
  await client.connect()
  try {
    const membershipResult = await client.query<{ member_id: string; plan_id: string }>(
      `
        select m.id as member_id, mm."membershipPlanId" as plan_id
        from "Member" m
        inner join "User" u on u.id = m."userId"
        inner join "MemberMembership" mm on mm."memberId" = m.id and mm.status = 'ACTIVE'
        where u."normalizedEmail" = $1
        order by mm."startsAt" desc
        limit 1
      `,
      [normalizeEmail(ADMIN_STAFF_BOOKING_EMAIL)],
    )
    const membership = membershipResult.rows[0]
    if (!membership) throw new Error('Staff booking E2E member requires an active membership')

    const blockerResult = await client.query<{ member_id: string }>(
      `
        select id as member_id
        from "Member"
        where id <> $1
        order by "createdAt" asc
        limit 1
      `,
      [membership.member_id],
    )
    const blocker = blockerResult.rows[0]
    if (!blocker) throw new Error('Staff booking E2E requires a second member to occupy the full session')

    await cleanupStaffBookingFixture(client)

    await client.query(
      `
        insert into "ClassType" (
          id, name, slug, description, category, "durationMinutes", "capacityDefault",
          "waitlistEnabled", "isPublic", status, "createdAt", "updatedAt"
        ) values (
          $1, 'E2E Staff Assisted', 'e2e-staff-assisted-booking',
          'Fixture reversible para reserva asistida', 'E2E', 50, 4, true, false,
          'ACTIVE', now(), now()
        )
        on conflict (id) do update set "updatedAt" = now(), status = 'ACTIVE'
      `,
      [ADMIN_STAFF_BOOKING_CLASS_TYPE_ID],
    )
    await client.query(
      `
        insert into "ClassTypeEligibilityRule" (
          id, "classTypeId", "ruleType", "membershipPlanId", "creditCost", priority, "isActive", "createdAt"
        ) values (
          'e2e-staff-booking-rule', $1, 'MEMBERSHIP_PLAN', $2, null, 0, true, now()
        )
        on conflict (id) do update set "membershipPlanId" = excluded."membershipPlanId", "isActive" = true
      `,
      [ADMIN_STAFF_BOOKING_CLASS_TYPE_ID, membership.plan_id],
    )
    await client.query(
      `
        insert into "ClassSession" (
          id, "classTypeId", "startsAt", "endsAt", capacity, "reservedCount",
          "waitlistEnabled", "locationLabel", status, "publishedAt", "createdAt", "updatedAt"
        ) values
          ($1, $3, now() + interval '2 hours', now() + interval '2 hours 50 minutes', 4, 0, true, 'Sala E2E', 'PUBLISHED', now(), now(), now()),
          ($2, $3, now() + interval '3 hours', now() + interval '3 hours 50 minutes', 1, 1, true, 'Sala E2E', 'PUBLISHED', now(), now(), now())
        on conflict (id) do update set
          "startsAt" = excluded."startsAt", "endsAt" = excluded."endsAt",
          capacity = excluded.capacity, "reservedCount" = excluded."reservedCount",
          status = 'PUBLISHED', "updatedAt" = now()
      `,
      [ADMIN_STAFF_BOOKING_AVAILABLE_SESSION_ID, ADMIN_STAFF_BOOKING_FULL_SESSION_ID, ADMIN_STAFF_BOOKING_CLASS_TYPE_ID],
    )
    await client.query(
      `
        insert into "Reservation" (
          id, "memberId", "classSessionId", status, source, "bookedAt", "createdAt", "updatedAt"
        ) values ($1, $2, $3, 'BOOKED', 'SYSTEM', now(), now(), now())
      `,
      [ADMIN_STAFF_BOOKING_BLOCKER_RESERVATION_ID, blocker.member_id, ADMIN_STAFF_BOOKING_FULL_SESSION_ID],
    )
    await client.query('update "Member" set status = \'ACTIVE\', "updatedAt" = now() where id = $1', [membership.member_id])
  } finally {
    await client.end()
  }
}

export async function cleanupSandboxStaffBookingFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to clean staff booking E2E')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await cleanupStaffBookingFixture(client)
  } finally {
    await client.end()
  }
}

export async function getSandboxStaffBookingEvidence() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to inspect staff booking E2E')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    const member = await client.query<{ member_id: string }>(
      `
        select m.id as member_id
        from "Member" m
        inner join "User" u on u.id = m."userId"
        where u."normalizedEmail" = $1
        limit 1
      `,
      [normalizeEmail(ADMIN_STAFF_BOOKING_EMAIL)],
    )
    const memberId = member.rows[0]?.member_id
    if (!memberId) throw new Error('Staff booking E2E member was not found')

    const reservation = await client.query<{
        status: string
        source: string
        cancellation_reason: string | null
      }>(
      `
        select status, source, "cancellationReason" as cancellation_reason
        from "Reservation"
        where "memberId" = $1 and "classSessionId" = $2
        order by "createdAt" desc
        limit 1
      `,
      [memberId, ADMIN_STAFF_BOOKING_AVAILABLE_SESSION_ID],
    )
    const waitlist = await client.query<{ status: string }>(
      `
        select status
        from "WaitlistEntry"
        where "memberId" = $1 and "classSessionId" = $2
        order by "joinedAt" desc
        limit 1
      `,
      [memberId, ADMIN_STAFF_BOOKING_FULL_SESSION_ID],
    )
    const audits = await client.query<{ action_type: string }>(
      `
        select "actionType" as action_type
        from "AuditLog"
        where "actionType" like 'STAFF_%'
          and "contextJson"->>'memberId' = $1
          and "contextJson"->>'classSessionId' = any($2::text[])
        order by "createdAt" asc
      `,
      [memberId, [ADMIN_STAFF_BOOKING_AVAILABLE_SESSION_ID, ADMIN_STAFF_BOOKING_FULL_SESSION_ID]],
    )

    return {
      reservation: reservation.rows[0] ?? null,
      waitlist: waitlist.rows[0] ?? null,
      auditActions: audits.rows.map((row) => row.action_type),
    }
  } finally {
    await client.end()
  }
}

async function cleanupStaffBookingFixture(client: Client) {
  const sessionIds = [ADMIN_STAFF_BOOKING_AVAILABLE_SESSION_ID, ADMIN_STAFF_BOOKING_FULL_SESSION_ID]
  const reservationIds = await client.query<{ id: string }>(
    'select id from "Reservation" where "classSessionId" = any($1::text[])',
    [sessionIds],
  )
  const ids = reservationIds.rows.map((row) => row.id)
  if (ids.length > 0) {
    await client.query('delete from "NotificationDeliveryAttempt" where "notificationJobId" in (select id from "NotificationJob" where "referenceId" = any($1::text[]))', [ids])
    await client.query('delete from "NotificationJob" where "referenceId" = any($1::text[])', [ids])
  }
  await client.query(
    `delete from "AuditLog" where "actionType" like 'STAFF_%' and ("entityId" in (select id from "Reservation" where "classSessionId" = any($1::text[])) or "entityId" in (select id from "WaitlistEntry" where "classSessionId" = any($1::text[])))`,
    [sessionIds],
  )
  await client.query('delete from "Reservation" where "classSessionId" = any($1::text[])', [sessionIds])
  await client.query('delete from "WaitlistEntry" where "classSessionId" = any($1::text[])', [sessionIds])
  await client.query('delete from "ClassSession" where id = any($1::text[])', [sessionIds])
  await client.query('delete from "ClassTypeEligibilityRule" where "classTypeId" = $1', [ADMIN_STAFF_BOOKING_CLASS_TYPE_ID])
  await client.query('delete from "ClassType" where id = $1', [ADMIN_STAFF_BOOKING_CLASS_TYPE_ID])
}
