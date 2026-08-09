import type {
  CreateCreditPackCheckoutInput,
  PaymentCheckoutProvider,
  VerifiedCheckoutEvent,
} from '@/modules/payments/server/checkout-provider'
import { ensureSandboxCheckoutEnabled } from '@/modules/payments/server/payment-environment'

export class SandboxCheckoutProvider implements PaymentCheckoutProvider {
  readonly provider = 'sandbox'

  constructor(private readonly appUrl: string) {
    ensureSandboxCheckoutEnabled()
  }

  async createCreditPackCheckout(input: CreateCreditPackCheckoutInput) {
    const sessionId = `sandbox_checkout_${input.paymentId}`
    return {
      id: sessionId,
      url: `${this.appUrl.replace(/\/$/, '')}/checkout/sandbox?payment=${input.paymentId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
    }
  }

  async verifyWebhook(): Promise<VerifiedCheckoutEvent> {
    throw new Error('Sandbox checkout does not expose a public webhook')
  }
}

export function buildSandboxCompletedEvent(input: {
  paymentId: string
  checkoutSessionId: string
  amount: number
  currency: string
  occurredAt?: Date
}): VerifiedCheckoutEvent {
  const occurredAt = input.occurredAt ?? new Date()
  return {
    providerEventId: `sandbox_checkout_completed_${input.paymentId}`,
    providerEventType: 'sandbox.checkout.completed',
    occurredAt,
    kind: 'CHECKOUT_COMPLETED',
    checkoutSessionId: input.checkoutSessionId,
    paymentIntentId: `sandbox_payment_${input.paymentId}`,
    paymentStatus: 'paid',
    paymentId: input.paymentId,
    amountTotal: input.amount,
    currency: input.currency,
    safePayload: {
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId,
      outcome: 'paid',
      occurredAt: occurredAt.toISOString(),
    },
  }
}
