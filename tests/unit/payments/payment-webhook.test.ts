import { beforeEach, describe, expect, it, vi } from 'vitest'

const { processCheckoutEventMock, processCardSetupEventMock } = vi.hoisted(() => ({
  processCheckoutEventMock: vi.fn(),
  processCardSetupEventMock: vi.fn(),
}))

vi.mock('@/modules/payments/server/credit-pack-checkout', () => ({
  processCheckoutEvent: processCheckoutEventMock,
}))

vi.mock('@/modules/payments/server/card-setup-checkout', () => ({
  processCardSetupEvent: processCardSetupEventMock,
}))

import type {
  PaymentCheckoutProvider,
  VerifiedCheckoutEvent,
} from '@/modules/payments/server/checkout-provider'
import { processPaymentWebhook } from '@/modules/payments/server/payment-webhook'

describe('payment webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an invalid signature without touching payment state', async () => {
    const provider = buildProvider()
    vi.mocked(provider.verifyWebhook).mockRejectedValue(new Error('signature mismatch'))

    const result = await processPaymentWebhook({
      provider,
      rawBody: '{}',
      signature: 'invalid',
    })

    expect(result).toEqual({
      accepted: false,
      code: 'INVALID_SIGNATURE',
      retryable: false,
    })
    expect(processCheckoutEventMock).not.toHaveBeenCalled()
    expect(processCardSetupEventMock).not.toHaveBeenCalled()
  })

  it('accepts duplicate and unsupported events without requesting a retry', async () => {
    const provider = buildProvider()
    processCheckoutEventMock.mockResolvedValue({
      success: true,
      outcome: 'ALREADY_PROCESSED',
      paymentId: 'payment-1',
    })

    const result = await processPaymentWebhook({
      provider,
      rawBody: '{"id":"event-1"}',
      signature: 'valid',
    })

    expect(result).toEqual({
      accepted: true,
      outcome: 'ALREADY_PROCESSED',
      paymentId: 'payment-1',
      notificationJobIds: [],
    })
  })

  it('routes setup mode events to card linking fulfillment', async () => {
    const provider = buildProvider()
    vi.mocked(provider.verifyWebhook).mockResolvedValue(buildEvent({ mode: 'setup' }))
    processCardSetupEventMock.mockResolvedValue({
      success: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-setup-1',
      cardId: 'card-1',
    })

    await expect(processPaymentWebhook({
      provider,
      rawBody: '{"id":"event-setup-1"}',
      signature: 'valid',
    })).resolves.toEqual({
      accepted: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-setup-1',
      notificationJobIds: [],
    })
    expect(processCardSetupEventMock).toHaveBeenCalled()
    expect(processCheckoutEventMock).not.toHaveBeenCalled()
  })

  it('returns notification jobs created by a fulfilled payment', async () => {
    const provider = buildProvider()
    processCheckoutEventMock.mockResolvedValue({
      success: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-1',
      notificationJobIds: ['job-payment-1'],
    })

    await expect(processPaymentWebhook({
      provider,
      rawBody: '{"id":"event-1"}',
      signature: 'valid',
    })).resolves.toEqual({
      accepted: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-1',
      notificationJobIds: ['job-payment-1'],
    })
  })

  it('marks domain processing failures as retryable', async () => {
    const provider = buildProvider()
    processCheckoutEventMock.mockResolvedValue({
      success: false,
      code: 'PAYMENT_NOT_FOUND',
      message: 'internal detail',
    })

    const result = await processPaymentWebhook({
      provider,
      rawBody: '{"id":"event-1"}',
      signature: 'valid',
    })

    expect(result).toEqual({
      accepted: false,
      code: 'PROCESSING_FAILED',
      retryable: true,
    })
  })
})

function buildProvider(): PaymentCheckoutProvider {
  return {
    provider: 'stripe',
    createCreditPackCheckout: vi.fn(),
    createCardSetupCheckout: vi.fn(),
    verifyWebhook: vi.fn().mockResolvedValue(buildEvent()),
  }
}

function buildEvent(overrides: Partial<VerifiedCheckoutEvent> = {}): VerifiedCheckoutEvent {
  return {
    providerEventId: 'event-1',
    providerEventType: 'checkout.session.completed',
    occurredAt: new Date('2026-08-08T10:00:00.000Z'),
    kind: 'CHECKOUT_COMPLETED',
    mode: 'payment',
    checkoutSessionId: 'session-1',
    paymentIntentId: 'intent-1',
    setupIntentId: null,
    paymentMethodId: null,
    customerId: null,
    paymentStatus: 'paid',
    paymentId: 'payment-1',
    amountTotal: 7200,
    currency: 'eur',
    card: null,
    safePayload: { id: 'event-1' },
    ...overrides,
  }
}
