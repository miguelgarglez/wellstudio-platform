import type { PaymentCheckoutProvider } from '@/modules/payments/server/checkout-provider'
import { processCheckoutEvent } from '@/modules/payments/server/credit-pack-checkout'

export type ProcessPaymentWebhookResult =
  | {
      accepted: true
      outcome: 'FULFILLED' | 'CANCELED' | 'IGNORED' | 'ALREADY_PROCESSED'
      paymentId: string | null
      notificationJobIds: string[]
    }
  | {
      accepted: false
      code: 'INVALID_SIGNATURE' | 'PROCESSING_FAILED'
      retryable: boolean
    }

export async function processPaymentWebhook(input: {
  provider: PaymentCheckoutProvider
  rawBody: string
  signature: string
}): Promise<ProcessPaymentWebhookResult> {
  let event

  try {
    event = await input.provider.verifyWebhook(input.rawBody, input.signature)
  } catch {
    return { accepted: false, code: 'INVALID_SIGNATURE', retryable: false }
  }

  const result = await processCheckoutEvent({
    provider: input.provider.provider,
    event,
  })

  if (!result.success) {
    return { accepted: false, code: 'PROCESSING_FAILED', retryable: true }
  }

  return {
    accepted: true,
    outcome: result.outcome,
    paymentId: result.paymentId,
    notificationJobIds: result.notificationJobIds ?? [],
  }
}
