import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_NOTIFICATIONS_FAILED_JOB_ID = 'e2e-admin-notification-failed'
export const ADMIN_NOTIFICATIONS_FAILED_RECIPIENT =
  'e2e.notifications.sandbox@wellstudio.test'
export const ADMIN_NOTIFICATIONS_PURCHASE_JOB_ID = 'e2e-admin-notification-purchase'
export const ADMIN_NOTIFICATIONS_PURCHASE_RECIPIENT =
  'e2e.purchase.sandbox@wellstudio.test'
export const ADMIN_NOTIFICATIONS_CANCELED_REMINDER_JOB_ID =
  'e2e-admin-notification-canceled-reminder'
export const ADMIN_NOTIFICATIONS_CANCELED_REMINDER_RECIPIENT =
  'e2e.reminder.sandbox@wellstudio.test'
const FIXTURE_REFERENCE_TYPE = 'e2e_admin_notifications'

const payload = {
  reservationId: 'e2e-notification-reservation',
  memberName: 'E2E Notification Member',
  className: 'E2E Strength Delivery',
  coachName: 'E2E Coach',
  locationLabel: 'E2E Sandbox · Sala principal',
  startsAt: '2026-08-10T16:00:00.000Z',
  endsAt: '2026-08-10T16:50:00.000Z',
}

const purchasePayload = {
  paymentId: 'e2e-payment-purchase',
  memberName: 'E2E Purchase Member',
  productName: 'E2E Bono Flexible',
  credits: 6,
  amount: 5400,
  currency: 'EUR',
  purchasedAt: '2026-08-09T10:00:00.000Z',
  expiresAt: '2026-09-23T10:00:00.000Z',
}

export async function prepareSandboxAdminNotificationsFixture() {
  const client = await connect()

  try {
    await client.query(
      `delete from "AuditLog" where "entityType" = 'NotificationJob' and "entityId" = $1`,
      [ADMIN_NOTIFICATIONS_FAILED_JOB_ID],
    )
    await client.query('delete from "NotificationJob" where "referenceType" = $1', [
      FIXTURE_REFERENCE_TYPE,
    ])

    await client.query(
      `
        insert into "NotificationJob" (
          id, "eventType", status, recipient, payload, "idempotencyKey",
          "referenceType", "referenceId", "attemptCount", "availableAt",
          "sentAt", "providerMessageId", "lastError", "createdAt", "updatedAt"
        ) values
        (
          $1, 'WAITLIST_PROMOTED', 'FAILED', $2, $3::jsonb,
          'e2e_admin_notifications/failed', $4, 'e2e-reservation-failed', 5,
          now() + interval '24 hours', null, null,
          'Resend returned 503 while sending transactional email.',
          now() - interval '2 hours', now()
        ),
        (
          'e2e-admin-notification-sent', 'RESERVATION_BOOKED', 'SENT',
          'e2e.sent.sandbox@wellstudio.test', $3::jsonb,
          'e2e_admin_notifications/sent', $4, 'e2e-reservation-sent', 1,
          now() - interval '90 minutes', now() - interval '90 minutes',
          'e2e-provider-sent', null, now() - interval '90 minutes', now() - interval '90 minutes'
        ),
        (
          'e2e-admin-notification-pending', 'RESERVATION_CANCELED', 'PENDING',
          'e2e.pending.sandbox@wellstudio.test', $3::jsonb,
          'e2e_admin_notifications/pending', $4, 'e2e-reservation-pending', 0,
          now() + interval '1 hour', null, null, null, now() - interval '30 minutes', now() - interval '30 minutes'
        ),
        (
          $5, 'CREDIT_PACK_PURCHASED', 'SENT', $6, $7::jsonb,
          'e2e_admin_notifications/purchase', $4, 'e2e-payment-purchase', 1,
          now() - interval '20 minutes', now() - interval '20 minutes',
          'e2e-provider-purchase', null, now() - interval '20 minutes', now() - interval '20 minutes'
        ),
        (
          $8, 'RESERVATION_REMINDER', 'CANCELED', $9, $3::jsonb,
          'e2e_admin_notifications/canceled-reminder', $4, 'e2e-reservation-reminder', 0,
          now() - interval '10 minutes', null, null,
          'La reserva o la sesión dejó de ser válida antes del recordatorio.',
          now() - interval '10 minutes', now() - interval '10 minutes'
        )
      `,
      [
        ADMIN_NOTIFICATIONS_FAILED_JOB_ID,
        ADMIN_NOTIFICATIONS_FAILED_RECIPIENT,
        JSON.stringify(payload),
        FIXTURE_REFERENCE_TYPE,
        ADMIN_NOTIFICATIONS_PURCHASE_JOB_ID,
        ADMIN_NOTIFICATIONS_PURCHASE_RECIPIENT,
        JSON.stringify(purchasePayload),
        ADMIN_NOTIFICATIONS_CANCELED_REMINDER_JOB_ID,
        ADMIN_NOTIFICATIONS_CANCELED_REMINDER_RECIPIENT,
      ],
    )

    for (let attemptNumber = 1; attemptNumber <= 5; attemptNumber += 1) {
      await client.query(
        `
          insert into "NotificationDeliveryAttempt" (
            id, "notificationJobId", "attemptNumber", status, provider, error, "attemptedAt"
          ) values (
            $1, $2, $3, 'FAILED', 'resend',
            'Resend returned 503 while sending transactional email.',
            now() - ($4 * interval '10 minutes')
          )
        `,
        [
          `e2e-admin-notification-attempt-${attemptNumber}`,
          ADMIN_NOTIFICATIONS_FAILED_JOB_ID,
          attemptNumber,
          6 - attemptNumber,
        ],
      )
    }

    await client.query(
      `
        insert into "NotificationDeliveryAttempt" (
          id, "notificationJobId", "attemptNumber", status, provider,
          "providerMessageId", "attemptedAt"
        ) values (
          'e2e-admin-notification-sent-attempt', 'e2e-admin-notification-sent',
          1, 'SENT', 'resend', 'e2e-provider-sent', now() - interval '90 minutes'
        )
      `,
    )
    await client.query(
      `
        insert into "NotificationDeliveryAttempt" (
          id, "notificationJobId", "attemptNumber", status, provider,
          "providerMessageId", "attemptedAt"
        ) values (
          'e2e-admin-notification-purchase-attempt', $1,
          1, 'SENT', 'resend', 'e2e-provider-purchase', now() - interval '20 minutes'
        )
      `,
      [ADMIN_NOTIFICATIONS_PURCHASE_JOB_ID],
    )
  } finally {
    await client.end()
  }
}

export async function readSandboxAdminNotificationRetryState() {
  const client = await connect()

  try {
    const job = await client.query<{
      status: string
      attemptCount: number
    }>(
      'select status, "attemptCount" from "NotificationJob" where id = $1',
      [ADMIN_NOTIFICATIONS_FAILED_JOB_ID],
    )
    const attempts = await client.query<{ attemptNumber: number; status: string }>(
      'select "attemptNumber", status from "NotificationDeliveryAttempt" where "notificationJobId" = $1 order by "attemptNumber" desc',
      [ADMIN_NOTIFICATIONS_FAILED_JOB_ID],
    )
    const audit = await client.query<{ count: string }>(
      `
        select count(*)::text as count
        from "AuditLog"
        where "entityType" = 'NotificationJob'
          and "entityId" = $1
          and "actionType" = 'NOTIFICATION_RETRY_REQUESTED'
      `,
      [ADMIN_NOTIFICATIONS_FAILED_JOB_ID],
    )

    return {
      status: job.rows[0]?.status ?? null,
      attemptCount: job.rows[0]?.attemptCount ?? null,
      latestAttempt: attempts.rows[0] ?? null,
      auditCount: Number(audit.rows[0]?.count ?? 0),
    }
  } finally {
    await client.end()
  }
}

async function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to prepare admin notification fixtures')
  }

  const client = new Client({ connectionString })
  await client.connect()
  return client
}
