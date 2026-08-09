import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getStripeCheckoutProviderMock, processPaymentWebhookMock, provider } = vi.hoisted(() => ({
  getStripeCheckoutProviderMock: vi.fn(),
  processPaymentWebhookMock: vi.fn(),
  provider: { provider: 'stripe' },
}))

vi.mock('@/modules/payments/server/payment-checkout-provider', () => ({
  getStripeCheckoutProvider: getStripeCheckoutProviderMock,
}))
vi.mock('@/modules/payments/server/payment-webhook', () => ({
  processPaymentWebhook: processPaymentWebhookMock,
}))
vi.mock('@/modules/notifications/server/notification-outbox', () => ({
  dispatchNotificationJobSafely: vi.fn(),
}))

import { POST } from '@/app/api/payments/stripe/webhook/route'

describe('Stripe webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStripeCheckoutProviderMock.mockReturnValue(provider)
  })

  it('rejects requests without a Stripe signature before resolving the provider', async () => {
    const response = await POST(new Request('http://localhost/api/payments/stripe/webhook', {
      method: 'POST',
      body: '{}',
    }))

    expect(response.status).toBe(400)
    expect(getStripeCheckoutProviderMock).not.toHaveBeenCalled()
  })

  it('passes the untouched raw body and signature to the payment boundary', async () => {
    processPaymentWebhookMock.mockResolvedValue({
      accepted: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-1',
      notificationJobIds: [],
    })
    const rawBody = '{ "id": "evt_1", "spacing": true }'

    const response = await POST(new Request('http://localhost/api/payments/stripe/webhook', {
      method: 'POST',
      body: rawBody,
      headers: { 'stripe-signature': 'signature' },
    }))

    expect(response.status).toBe(200)
    expect(processPaymentWebhookMock).toHaveBeenCalledWith({
      provider,
      rawBody,
      signature: 'signature',
    })
  })

  it.each([
    [{ accepted: false, code: 'INVALID_SIGNATURE', retryable: false }, 400],
    [{ accepted: false, code: 'PROCESSING_FAILED', retryable: true }, 500],
  ])('maps rejected events to the expected HTTP status', async (result, expectedStatus) => {
    processPaymentWebhookMock.mockResolvedValue(result)

    const response = await POST(new Request('http://localhost/api/payments/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'signature' },
    }))

    expect(response.status).toBe(expectedStatus)
  })
})
