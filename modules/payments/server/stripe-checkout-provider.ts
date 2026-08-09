import Stripe from 'stripe'

import type {
  CreateCardSetupCheckoutInput,
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
        purpose: 'credit_pack_purchase',
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

  async createCardSetupCheckout(input: CreateCardSetupCheckoutInput) {
    const customerId = input.customerId ?? (await this.stripe.customers.create({
      email: input.customerEmail,
      metadata: { memberId: input.memberId },
    }, {
      idempotencyKey: `member-customer:${input.memberId}`,
    })).id

    const session = await this.stripe.checkout.sessions.create({
      mode: 'setup',
      locale: 'es',
      payment_method_types: ['card'],
      customer: customerId,
      client_reference_id: input.paymentId,
      metadata: {
        paymentId: input.paymentId,
        memberId: input.memberId,
        purpose: 'card_setup',
      },
      setup_intent_data: {
        metadata: {
          paymentId: input.paymentId,
          memberId: input.memberId,
        },
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }, {
      idempotencyKey: `card-setup-checkout:${input.paymentId}`,
    })

    if (!session.url) {
      throw new Error('Stripe Checkout did not return a hosted setup URL')
    }

    return {
      id: session.id,
      url: session.url,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1_000) : null,
      customerId,
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
        mode: null,
        checkoutSessionId: null,
        paymentIntentId: null,
        setupIntentId: null,
        paymentMethodId: null,
        customerId: null,
        paymentStatus: null,
        paymentId: null,
        amountTotal: null,
        currency: null,
        card: null,
        safePayload: {
          eventId: event.id,
          eventType: event.type,
          created: event.created,
        },
      }
    }

    const session = event.data.object
    let mode: VerifiedCheckoutEvent['mode'] = null
    if (session.mode === 'payment') mode = 'payment'
    else if (session.mode === 'setup') mode = 'setup'
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null
    const setupIntentId = typeof session.setup_intent === 'string'
      ? session.setup_intent
      : session.setup_intent?.id ?? null
    const paymentId = session.metadata?.paymentId ?? null
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

    let paymentMethodId: string | null = null
    let card: VerifiedCheckoutEvent['card'] = null

    if (event.type === 'checkout.session.completed' && mode === 'setup' && setupIntentId) {
      const setupIntent = await this.stripe.setupIntents.retrieve(setupIntentId, {
        expand: ['payment_method'],
      })
      const paymentMethod = typeof setupIntent.payment_method === 'string'
        ? null
        : setupIntent.payment_method

      paymentMethodId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : paymentMethod?.id ?? null

      if (paymentMethod?.card) {
        card = {
          brand: paymentMethod.card.brand ?? null,
          last4: paymentMethod.card.last4 ?? null,
          expMonth: paymentMethod.card.exp_month ?? null,
          expYear: paymentMethod.card.exp_year ?? null,
        }
      }
    }

    return {
      providerEventId: event.id,
      providerEventType: event.type,
      occurredAt: new Date(event.created * 1_000),
      kind: event.type === 'checkout.session.completed'
        ? 'CHECKOUT_COMPLETED'
        : 'CHECKOUT_EXPIRED',
      mode,
      checkoutSessionId: session.id,
      paymentIntentId,
      setupIntentId,
      paymentMethodId,
      customerId,
      paymentStatus: normalizePaymentStatus(session.payment_status),
      paymentId,
      amountTotal: session.amount_total,
      currency: session.currency,
      card,
      safePayload: {
        eventId: event.id,
        eventType: event.type,
        created: event.created,
        checkoutSessionId: session.id,
        mode,
        paymentIntentId,
        setupIntentId,
        paymentMethodId,
        customerId,
        paymentStatus: session.payment_status,
        paymentId,
        amountTotal: session.amount_total,
        currency: session.currency,
        cardBrand: card?.brand ?? null,
        cardLast4: card?.last4 ?? null,
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
