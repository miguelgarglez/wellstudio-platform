import { after, NextResponse } from 'next/server'

import { dispatchNotificationJobSafely } from '@/modules/notifications/server/notification-outbox'
import { getStripeCheckoutProvider } from '@/modules/payments/server/payment-checkout-provider'
import { processPaymentWebhook } from '@/modules/payments/server/payment-webhook'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  const result = await processPaymentWebhook({
    provider: getStripeCheckoutProvider(),
    rawBody: await request.text(),
    signature,
  })

  if (!result.accepted) {
    return NextResponse.json(
      { error: result.code === 'INVALID_SIGNATURE' ? 'Invalid webhook signature.' : 'Webhook processing failed.' },
      { status: result.retryable ? 500 : 400 },
    )
  }

  for (const jobId of result.notificationJobIds) {
    after(() => dispatchNotificationJobSafely(jobId))
  }

  return NextResponse.json({ received: true })
}
