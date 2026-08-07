import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const PUBLIC_PLAN_E2E_NAME = 'E2E Plan Constancia'
export const PUBLIC_PACK_E2E_NAME = 'E2E Bono Flexible'
export const PRIVATE_PLAN_E2E_NAME = 'E2E Plan Interno'
export const PRIVATE_PACK_E2E_NAME = 'E2E Bono Interno'

export function hasPublicProductCatalogDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function preparePublicProductCatalogFixture() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for the public product catalog fixture')

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const publicPlan = await client.query<{ id: string }>(
      `
        insert into "MembershipPlan" (
          id, name, slug, description, "billingType", "priceAmount", currency,
          "billingInterval", "bookingPolicyType", "includedCredits", status, "isPublic", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, 'e2e-public-plan', 'Tres entrenamientos semanales con seguimiento profesional.',
          'RECURRING', 8950, 'EUR', 'MONTH', null, null, 'ACTIVE', true, now(), now()
        )
        on conflict (slug) do update set
          name = excluded.name, description = excluded.description, "priceAmount" = excluded."priceAmount",
          "billingInterval" = excluded."billingInterval", status = 'ACTIVE', "isPublic" = true, "updatedAt" = now()
        returning id
      `,
      [PUBLIC_PLAN_E2E_NAME],
    )
    const planId = publicPlan.rows[0]?.id
    if (!planId) throw new Error('Could not prepare public membership plan')

    await client.query(
      `
        insert into "MembershipBookingPolicy" (
          id, "membershipPlanId", "policyType", "periodType", "allowanceCount", "createdAt", "updatedAt"
        ) values (gen_random_uuid()::text, $1, 'PERIODIC_ALLOWANCE', 'CALENDAR_WEEK', 3, now(), now())
        on conflict ("membershipPlanId") do update set
          "policyType" = 'PERIODIC_ALLOWANCE', "periodType" = 'CALENDAR_WEEK', "allowanceCount" = 3, "updatedAt" = now()
      `,
      [planId],
    )

    await client.query(
      `
        insert into "MembershipPlan" (
          id, name, slug, "priceAmount", currency, "billingInterval", status, "isPublic", "createdAt", "updatedAt"
        ) values (gen_random_uuid()::text, $1, 'e2e-private-plan', 100, 'EUR', 'MONTH', 'ACTIVE', false, now(), now())
        on conflict (slug) do update set name = excluded.name, status = 'ACTIVE', "isPublic" = false, "updatedAt" = now()
      `,
      [PRIVATE_PLAN_E2E_NAME],
    )

    await client.query(
      `
        insert into "CreditPack" (
          id, name, slug, description, "creditsTotal", "priceAmount", currency,
          "expiresAfterDays", status, "isPublic", "createdAt", "updatedAt"
        ) values (
          gen_random_uuid()::text, $1, 'e2e-public-pack', 'Cinco sesiones para organizar con flexibilidad.',
          5, 6500, 'EUR', 90, 'ACTIVE', true, now(), now()
        )
        on conflict (slug) do update set
          name = excluded.name, description = excluded.description, "creditsTotal" = 5,
          "priceAmount" = 6500, "expiresAfterDays" = 90, status = 'ACTIVE', "isPublic" = true, "updatedAt" = now()
      `,
      [PUBLIC_PACK_E2E_NAME],
    )

    await client.query(
      `
        insert into "CreditPack" (
          id, name, slug, "creditsTotal", "priceAmount", currency, status, "isPublic", "createdAt", "updatedAt"
        ) values (gen_random_uuid()::text, $1, 'e2e-private-pack', 99, 100, 'EUR', 'ACTIVE', false, now(), now())
        on conflict (slug) do update set name = excluded.name, status = 'ACTIVE', "isPublic" = false, "updatedAt" = now()
      `,
      [PRIVATE_PACK_E2E_NAME],
    )
  } finally {
    await client.end()
  }
}
