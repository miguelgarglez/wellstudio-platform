import { Client } from 'pg'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_PAYMENT_FAILED_ID = 'e2e-admin-payment-failed'
export const ADMIN_PAYMENT_SUCCEEDED_ID = 'e2e-admin-payment-succeeded'
export const ADMIN_PAYMENT_PACK_NAME = 'E2E Admin Payment Pack'
const CREDIT_PACK_ID = 'e2e-admin-payment-pack'
const PAYMENT_IDS = [
  ADMIN_PAYMENT_FAILED_ID,
  ADMIN_PAYMENT_SUCCEEDED_ID,
  'e2e-admin-payment-pending',
  'e2e-admin-payment-canceled',
]

export async function prepareSandboxAdminPaymentsFixture() {
  const client = await connect()
  const { email } = getSandboxCredentials()

  try {
    const member = await client.query<{ id: string }>(
      `
        select m.id
        from "Member" m
        join "User" u on u.id = m."userId"
        where u."normalizedEmail" = lower($1)
        limit 1
      `,
      [email],
    )
    const memberId = member.rows[0]?.id
    if (!memberId) throw new Error(`Sandbox member not found for ${email}`)

    await client.query('delete from "PaymentEvent" where "paymentId" = any($1::text[])', [PAYMENT_IDS])
    await client.query('delete from "PaymentItem" where "paymentId" = any($1::text[])', [PAYMENT_IDS])
    await client.query('delete from "Payment" where id = any($1::text[])', [PAYMENT_IDS])
    await client.query('delete from "CreditPack" where id = $1', [CREDIT_PACK_ID])

    await client.query(
      `
        insert into "CreditPack" (
          id, name, slug, description, "creditsTotal", "priceAmount",
          currency, "expiresAfterDays", status, "isPublic", "createdAt", "updatedAt"
        ) values (
          $1, $2, 'e2e-admin-payment-pack', 'Fixture operativa del monitor de cobros.',
          8, 5900, 'EUR', 60, 'ACTIVE', false, now(), now()
        )
      `,
      [CREDIT_PACK_ID, ADMIN_PAYMENT_PACK_NAME],
    )

    await client.query(
      `
        insert into "Payment" (
          id, "memberId", provider, "providerPaymentIntentId",
          "providerCheckoutSessionId", status, "paymentType", amount, currency,
          "capturedAt", "failedAt", "failureReason", "createdAt", "updatedAt"
        ) values
        ($1, $5, 'stripe', 'pi_e2e_failed_1234567890', 'cs_e2e_failed_1234567890',
          'FAILED', 'CREDIT_PACK_PURCHASE', 5900, 'EUR', null, now() - interval '70 minutes',
          'checkout_provider_error', now() - interval '70 minutes', now() - interval '70 minutes'),
        ($2, $5, 'stripe', 'pi_e2e_succeeded_1234567890', 'cs_e2e_succeeded_1234567890',
          'SUCCEEDED', 'CREDIT_PACK_PURCHASE', 5900, 'EUR', now() - interval '40 minutes', null,
          null, now() - interval '45 minutes', now() - interval '40 minutes'),
        ($3, $5, 'stripe', null, 'cs_e2e_pending_1234567890',
          'PENDING', 'CREDIT_PACK_PURCHASE', 5900, 'EUR', null, null,
          null, now() - interval '20 minutes', now() - interval '20 minutes'),
        ($4, $5, 'stripe', null, 'cs_e2e_canceled_1234567890',
          'CANCELED', 'CREDIT_PACK_PURCHASE', 5900, 'EUR', null, null,
          null, now() - interval '10 minutes', now() - interval '10 minutes')
      `,
      [...PAYMENT_IDS, memberId],
    )

    for (const paymentId of PAYMENT_IDS) {
      await client.query(
        `
          insert into "PaymentItem" (
            id, "paymentId", "itemType", "referenceId", quantity,
            "unitAmount", "totalAmount", "entitlementUnits", "entitlementExpiresAfterDays", "createdAt"
          ) values ($1, $2, 'CREDIT_PACK', $3, 1, 5900, 5900, 8, 60, now())
        `,
        [`${paymentId}-item`, paymentId, CREDIT_PACK_ID],
      )
    }

    await client.query(
      `
        insert into "PaymentEvent" (
          id, "paymentId", provider, "providerEventId", "eventType",
          "payloadJson", "processedAt", "processingStatus", "createdAt"
        ) values
        ('e2e-admin-payment-event-failed', $1, 'stripe', 'evt_e2e_failed_1234567890',
          'checkout.session.completed', '{"fixture":"safe"}'::jsonb, now() - interval '69 minutes',
          'FAILED', now() - interval '70 minutes'),
        ('e2e-admin-payment-event-succeeded', $2, 'stripe', 'evt_e2e_succeeded_1234567890',
          'checkout.session.completed', '{"fixture":"safe"}'::jsonb, now() - interval '40 minutes',
          'PROCESSED', now() - interval '41 minutes')
      `,
      [ADMIN_PAYMENT_FAILED_ID, ADMIN_PAYMENT_SUCCEEDED_ID],
    )
  } finally {
    await client.end()
  }
}

async function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to prepare admin payment fixtures')
  const client = new Client({ connectionString })
  await client.connect()
  return client
}
