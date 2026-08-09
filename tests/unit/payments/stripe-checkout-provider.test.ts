import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StripeCheckoutProvider } from '@/modules/payments/server/stripe-checkout-provider'

const sessionsCreate = vi.fn()
const constructEventAsync = vi.fn()

describe('Stripe checkout provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a hosted card checkout from the trusted local snapshot', async () => {
    sessionsCreate.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.test/cs_test_1',
      expires_at: 1_786_181_400,
    })
    const provider = buildProvider()

    const result = await provider.createCreditPackCheckout({
      paymentId: 'payment-1',
      memberId: 'member-1',
      customerEmail: 'member@example.com',
      productName: 'Bono 8',
      productDescription: 'Ocho reservas',
      unitAmount: 7200,
      currency: 'eur',
      successUrl: 'https://wellstudio.test/app/account?checkout=success',
      cancelUrl: 'https://wellstudio.test/app/account?checkout=canceled',
    })

    expect(sessionsCreate).toHaveBeenCalledWith({
      mode: 'payment',
      locale: 'es',
      payment_method_types: ['card'],
      customer_email: 'member@example.com',
      client_reference_id: 'payment-1',
      metadata: {
        paymentId: 'payment-1',
        memberId: 'member-1',
        purpose: 'credit_pack_purchase',
      },
      payment_intent_data: {
        metadata: { paymentId: 'payment-1', memberId: 'member-1' },
      },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: 7200,
          product_data: { name: 'Bono 8', description: 'Ocho reservas' },
        },
      }],
      success_url: 'https://wellstudio.test/app/account?checkout=success',
      cancel_url: 'https://wellstudio.test/app/account?checkout=canceled',
    }, {
      idempotencyKey: 'credit-pack-checkout:payment-1',
    })
    expect(result).toEqual({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.test/cs_test_1',
      expiresAt: new Date(1_786_181_400_000),
    })
  })

  it('maps a signed completed session to the provider-neutral event', async () => {
    constructEventAsync.mockResolvedValue(buildStripeEvent('checkout.session.completed'))
    const provider = buildProvider()

    const result = await provider.verifyWebhook('{"id":"evt_1"}', 'signature')

    expect(constructEventAsync).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      'signature',
      'whsec_test',
    )
    expect(result).toMatchObject({
      providerEventId: 'evt_1',
      providerEventType: 'checkout.session.completed',
      kind: 'CHECKOUT_COMPLETED',
      checkoutSessionId: 'cs_test_1',
      paymentIntentId: 'pi_1',
      paymentStatus: 'paid',
      paymentId: 'payment-1',
      amountTotal: 7200,
      currency: 'eur',
    })
    expect(JSON.stringify(result.safePayload)).not.toContain('member@example.com')
  })

  it('maps expired sessions and ignores unrelated Stripe events safely', async () => {
    const provider = buildProvider()
    constructEventAsync.mockResolvedValueOnce(buildStripeEvent('checkout.session.expired'))

    await expect(provider.verifyWebhook('{}', 'signature')).resolves.toMatchObject({
      kind: 'CHECKOUT_EXPIRED',
      checkoutSessionId: 'cs_test_1',
    })

    constructEventAsync.mockResolvedValueOnce({
      id: 'evt_other',
      type: 'payment_intent.created',
      created: 1_786_179_600,
      data: { object: { id: 'pi_other' } },
    } as unknown as Stripe.Event)

    await expect(provider.verifyWebhook('{}', 'signature')).resolves.toEqual({
      providerEventId: 'evt_other',
      providerEventType: 'payment_intent.created',
      occurredAt: new Date(1_786_179_600_000),
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
        eventId: 'evt_other',
        eventType: 'payment_intent.created',
        created: 1_786_179_600,
      },
    })
  })

  it('creates a hosted setup checkout and expands payment method details on completion', async () => {
    const customersCreate = vi.fn().mockResolvedValue({ id: 'cus_1' })
    const setupIntentsRetrieve = vi.fn().mockResolvedValue({
      id: 'seti_1',
      payment_method: {
        id: 'pm_1',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2030,
        },
      },
    })
    sessionsCreate.mockResolvedValue({
      id: 'cs_setup_1',
      url: 'https://checkout.stripe.test/cs_setup_1',
      expires_at: 1_786_181_400,
    })
    constructEventAsync.mockResolvedValue({
      id: 'evt_setup_1',
      type: 'checkout.session.completed',
      created: 1_786_179_600,
      data: {
        object: {
          id: 'cs_setup_1',
          mode: 'setup',
          amount_total: 0,
          currency: 'eur',
          customer: 'cus_1',
          setup_intent: 'seti_1',
          payment_status: 'no_payment_required',
          metadata: { paymentId: 'payment-setup-1', memberId: 'member-1', purpose: 'card_setup' },
        },
      },
    } as unknown as Stripe.Event)

    const stripe = {
      customers: { create: customersCreate },
      checkout: { sessions: { create: sessionsCreate } },
      setupIntents: { retrieve: setupIntentsRetrieve },
      webhooks: { constructEventAsync },
    } as unknown as Stripe
    const provider = new StripeCheckoutProvider(stripe, 'whsec_test')

    await expect(provider.createCardSetupCheckout({
      paymentId: 'payment-setup-1',
      memberId: 'member-1',
      customerEmail: 'member@example.com',
      customerId: null,
      successUrl: 'https://wellstudio.test/app/account?card=success',
      cancelUrl: 'https://wellstudio.test/app/account?card=canceled',
    })).resolves.toMatchObject({
      id: 'cs_setup_1',
      url: 'https://checkout.stripe.test/cs_setup_1',
      customerId: 'cus_1',
    })

    await expect(provider.verifyWebhook('{}', 'signature')).resolves.toMatchObject({
      kind: 'CHECKOUT_COMPLETED',
      mode: 'setup',
      paymentMethodId: 'pm_1',
      customerId: 'cus_1',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2030,
      },
    })
  })

  it('verifies a real Stripe signature against the untouched payload', async () => {
    const stripe = new Stripe('sk_test_signature_only')
    const provider = new StripeCheckoutProvider(stripe, 'whsec_test')
    const payload = JSON.stringify(buildStripeEvent('checkout.session.completed'))
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_test',
      timestamp: Math.floor(Date.now() / 1_000),
    })

    await expect(provider.verifyWebhook(payload, signature)).resolves.toMatchObject({
      providerEventId: 'evt_1',
      kind: 'CHECKOUT_COMPLETED',
      paymentId: 'payment-1',
    })
    await expect(provider.verifyWebhook(`${payload} `, signature)).rejects.toThrow()
  })
})

function buildProvider() {
  const stripe = {
    checkout: { sessions: { create: sessionsCreate } },
    webhooks: { constructEventAsync },
  } as unknown as Stripe

  return new StripeCheckoutProvider(stripe, 'whsec_test')
}

function buildStripeEvent(type: 'checkout.session.completed' | 'checkout.session.expired') {
  return {
    id: 'evt_1',
    type,
    created: 1_786_179_600,
    data: {
      object: {
        id: 'cs_test_1',
        mode: 'payment',
        amount_total: 7200,
        currency: 'eur',
        payment_intent: 'pi_1',
        payment_status: type === 'checkout.session.completed' ? 'paid' : 'unpaid',
        metadata: { paymentId: 'payment-1', memberId: 'member-1' },
        customer_details: { email: 'member@example.com' },
      },
    },
  } as unknown as Stripe.Event
}
