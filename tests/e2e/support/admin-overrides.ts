import { Client } from 'pg'

import { normalizeEmail } from '@/modules/auth/lib/normalize-email'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'
import { ensureSandboxReservationScenarioReady } from './sandbox'

loadE2EEnvFiles()

export async function prepareSandboxAdminOverridesFixture() {
  await ensureSandboxReservationScenarioReady()

  const connectionString = process.env.DATABASE_URL
  const { email } = getSandboxCredentials()

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to prepare the sandbox admin overrides fixture')
  }

  const client = new Client({
    connectionString,
  })

  await client.connect()

  try {
    const membershipResult = await client.query<{
      membership_id: string
      membership_plan_id: string
    }>(
      `
        select
          mm.id as membership_id,
          mm."membershipPlanId" as membership_plan_id
        from "MemberMembership" mm
        inner join "Member" m on m.id = mm."memberId"
        inner join "User" u on u.id = m."userId"
        where u."normalizedEmail" = $1
          and mm.status = 'ACTIVE'
        order by mm."startsAt" desc
        limit 1
      `,
      [normalizeEmail(email)],
    )

    const membership = membershipResult.rows[0] ?? null

    if (!membership) {
      throw new Error(`Sandbox member ${email} does not have an active membership`)
    }

    await client.query(
      `
        insert into "MembershipBookingPolicy" (
          "id",
          "membershipPlanId",
          "policyType",
          "periodType",
          "allowanceCount",
          "createdAt",
          "updatedAt"
        )
        values (
          gen_random_uuid()::text,
          $1,
          'PERIODIC_ALLOWANCE',
          'CALENDAR_WEEK',
          4,
          now(),
          now()
        )
        on conflict ("membershipPlanId") do update
        set
          "policyType" = excluded."policyType",
          "periodType" = excluded."periodType",
          "allowanceCount" = excluded."allowanceCount",
          "updatedAt" = now()
      `,
      [membership.membership_plan_id],
    )

    await client.query(
      'delete from "MemberMembershipBookingOverride" where "memberMembershipId" = $1',
      [membership.membership_id],
    )
  } finally {
    await client.end()
  }
}
