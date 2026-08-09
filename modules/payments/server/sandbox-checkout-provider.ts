import type {
  CreateCardSetupCheckoutInput,
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

  async createCardSetupCheckout(input: CreateCardSetupCheckoutInput) {
    const sessionId = `sandbox_card_setup_${input.paymentId}`
    return {
      id: sessionId,
      url: `${this.appUrl.replace(/\/$/, '')}/checkout/sandbox/card?payment=${input.paymentId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
      customerId: input.customerId ?? `sandbox_customer_${input.memberId}`,
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
    mode: 'payment',
    checkoutSessionId: input.checkoutSessionId,
    paymentIntentId: `sandbox_payment_${input.paymentId}`,
    setupIntentId: null,
    paymentMethodId: null,
    customerId: null,
    paymentStatus: 'paid',
    paymentId: input.paymentId,
    amountTotal: input.amount,
    currency: input.currency,
    card: null,
    safePayload: {
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId,
      outcome: 'paid',
      occurredAt: occurredAt.toISOString(),
    },
  }
}

export function buildSandboxCardSetupCompletedEvent(input: {
  paymentId: string
  memberId: string
  checkoutSessionId: string
  customerId?: string
  paymentMethodId?: string
  occurredAt?: Date
}): VerifiedCheckoutEvent {
  const occurredAt = input.occurredAt ?? new Date()
  const customerId = input.customerId ?? `sandbox_customer_${input.memberId}`
  const paymentMethodId = input.paymentMethodId ?? `sandbox_pm_${input.paymentId}`

  return {
    providerEventId: `sandbox_card_setup_completed_${input.paymentId}`,
    providerEventType: 'sandbox.card_setup.completed',
    occurredAt,
    kind: 'CHECKOUT_COMPLETED',
    mode: 'setup',
    checkoutSessionId: input.checkoutSessionId,
    paymentIntentId: null,
    setupIntentId: `sandbox_seti_${input.paymentId}`,
    paymentMethodId,
    customerId,
    paymentStatus: 'no_payment_required',
    paymentId: input.paymentId,
    amountTotal: 0,
    currency: 'eur',
    card: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
    },
    safePayload: {
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId,
      outcome: 'setup',
      customerId,
      paymentMethodId,
      occurredAt: occurredAt.toISOString(),
    },
  }
}
