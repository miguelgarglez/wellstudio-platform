import Stripe from 'stripe'

import type {
  CreateCreditPackCheckoutInput,
  PaymentCheckoutProvider,
  VerifiedCheckoutEvent,
} from '@/modules/payments/server/checkout-provider'

export class StripeCheckoutProvider implements PaymentCheckoutProvider {
  readonly provider = 'stripe'

  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
  ) {}

  async createCreditPackCheckout(input: CreateCreditPackCheckoutInput) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'es',
      payment_method_types: ['card'],
      customer_email: input.customerEmail,
      client_reference_id: input.paymentId,
      metadata: {
        paymentId: input.paymentId,
        memberId: input.memberId,
      },
      payment_intent_data: {
        metadata: {
          paymentId: input.paymentId,
          memberId: input.memberId,
        },
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: input.unitAmount,
          product_data: {
            name: input.productName,
            ...(input.productDescription ? { description: input.productDescription } : {}),
          },
        },
      }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }, {
      idempotencyKey: `credit-pack-checkout:${input.paymentId}`,
    })

    if (!session.url) {
      throw new Error('Stripe Checkout did not return a hosted URL')
    }

    return {
      id: session.id,
      url: session.url,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1_000) : null,
    }
  }

  async verifyWebhook(rawBody: string, signature: string): Promise<VerifiedCheckoutEvent> {
    const event = await this.stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      this.webhookSecret,
    )

    if (
      event.type !== 'checkout.session.completed'
      && event.type !== 'checkout.session.expired'
    ) {
      return {
        providerEventId: event.id,
        providerEventType: event.type,
        occurredAt: new Date(event.created * 1_000),
        kind: 'UNSUPPORTED',
        checkoutSessionId: null,
        paymentIntentId: null,
        paymentStatus: null,
        paymentId: null,
        amountTotal: null,
        currency: null,
        safePayload: {
          eventId: event.id,
          eventType: event.type,
          created: event.created,
        },
      }
    }

    const session = event.data.object
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null
    const paymentId = session.metadata?.paymentId ?? null

    return {
      providerEventId: event.id,
      providerEventType: event.type,
      occurredAt: new Date(event.created * 1_000),
      kind: event.type === 'checkout.session.completed'
        ? 'CHECKOUT_COMPLETED'
        : 'CHECKOUT_EXPIRED',
      checkoutSessionId: session.id,
      paymentIntentId,
      paymentStatus: normalizePaymentStatus(session.payment_status),
      paymentId,
      amountTotal: session.amount_total,
      currency: session.currency,
      safePayload: {
        eventId: event.id,
        eventType: event.type,
        created: event.created,
        checkoutSessionId: session.id,
        paymentIntentId,
        paymentStatus: session.payment_status,
        paymentId,
        amountTotal: session.amount_total,
        currency: session.currency,
      },
    }
  }
}

function normalizePaymentStatus(status: string) {
  if (status === 'paid' || status === 'unpaid' || status === 'no_payment_required') {
    return status
  }
  return null
}
