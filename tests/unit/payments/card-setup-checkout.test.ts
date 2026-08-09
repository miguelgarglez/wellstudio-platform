import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    paymentEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    card: {
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
  }
  return {
    tx: transaction,
    prismaMock: {
      member: { findUnique: vi.fn() },
      payment: { create: vi.fn(), update: vi.fn() },
      paymentEvent: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import type { PaymentCheckoutProvider, VerifiedCheckoutEvent } from '@/modules/payments/server/checkout-provider'
import {
  processCardSetupEvent,
  startCardSetupCheckout,
} from '@/modules/payments/server/card-setup-checkout'

const now = new Date('2026-08-09T10:00:00.000Z')

describe('card setup checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      user: { email: 'member@example.com', status: 'ACTIVE' },
      cards: [],
    })
    prismaMock.payment.create.mockResolvedValue({ id: 'payment-setup-1' })
    prismaMock.payment.update.mockResolvedValue({ id: 'payment-setup-1' })
  })

  it('creates a pending local CARD_SETUP payment before requesting setup checkout', async () => {
    const provider = buildProvider()

    const result = await startCardSetupCheckout({
      memberId: 'member-1',
      appUrl: 'http://localhost:3000/',
      provider,
    })

    expect(result).toEqual({
      success: true,
      paymentId: 'payment-setup-1',
      checkoutUrl: 'http://checkout.test/setup-1',
    })
    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberId: 'member-1',
        status: 'PENDING',
        paymentType: 'CARD_SETUP',
        amount: 0,
        currency: 'EUR',
      }),
      select: { id: true },
    })
    expect(provider.createCardSetupCheckout).toHaveBeenCalledWith(expect.objectContaining({
      paymentId: 'payment-setup-1',
      customerId: null,
      successUrl: expect.stringContaining('card=success'),
    }))
  })

  it('fulfills a setup event by upserting the default card once', async () => {
    prismaMock.paymentEvent.create.mockResolvedValue(buildEventRecord())
    tx.paymentEvent.findUnique.mockResolvedValue(buildEventRecord())
    tx.payment.findFirst.mockResolvedValue(buildPayment())
    tx.card.upsert.mockResolvedValue({ id: 'card-1' })

    const result = await processCardSetupEvent({
      provider: 'sandbox',
      event: buildEvent(),
    })

    expect(result).toEqual({
      success: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-setup-1',
      cardId: 'card-1',
    })
    expect(tx.card.updateMany).toHaveBeenCalled()
    expect(tx.card.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        provider_providerPaymentMethodId: {
          provider: 'sandbox',
          providerPaymentMethodId: 'pm_1',
        },
      },
      create: expect.objectContaining({
        memberId: 'member-1',
        brand: 'Visa',
        last4: '4242',
        isDefault: true,
        status: 'ACTIVE',
      }),
    }))
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-setup-1' },
      data: expect.objectContaining({
        status: 'SUCCEEDED',
        cardId: 'card-1',
      }),
    })
  })

  it('is idempotent when the provider event was already processed', async () => {
    prismaMock.paymentEvent.create.mockResolvedValue({
      ...buildEventRecord(),
      processingStatus: 'PROCESSED',
      paymentId: 'payment-setup-1',
    })

    await expect(processCardSetupEvent({
      provider: 'sandbox',
      event: buildEvent(),
    })).resolves.toEqual({
      success: true,
      outcome: 'ALREADY_PROCESSED',
      paymentId: 'payment-setup-1',
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})

function buildProvider(): PaymentCheckoutProvider {
  return {
    provider: 'sandbox',
    createCreditPackCheckout: vi.fn(),
    createCardSetupCheckout: vi.fn().mockResolvedValue({
      id: 'session-setup-1',
      url: 'http://checkout.test/setup-1',
      expiresAt: new Date('2026-08-09T10:30:00.000Z'),
      customerId: 'sandbox_customer_member-1',
    }),
    verifyWebhook: vi.fn(),
  }
}

function buildEvent(overrides: Partial<VerifiedCheckoutEvent> = {}): VerifiedCheckoutEvent {
  return {
    providerEventId: 'provider-event-setup-1',
    providerEventType: 'sandbox.card_setup.completed',
    occurredAt: now,
    kind: 'CHECKOUT_COMPLETED',
    mode: 'setup',
    checkoutSessionId: 'session-setup-1',
    paymentIntentId: null,
    setupIntentId: 'seti_1',
    paymentMethodId: 'pm_1',
    customerId: 'cus_1',
    paymentStatus: 'no_payment_required',
    paymentId: 'payment-setup-1',
    amountTotal: 0,
    currency: 'eur',
    card: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
    },
    safePayload: { id: 'provider-event-setup-1' },
    ...overrides,
  }
}

function buildEventRecord() {
  return {
    id: 'event-row-setup-1',
    paymentId: null,
    provider: 'sandbox',
    providerEventId: 'provider-event-setup-1',
    eventType: 'sandbox.card_setup.completed',
    payloadJson: {},
    processedAt: null,
    processingStatus: 'RECEIVED',
    createdAt: now,
  }
}

function buildPayment() {
  return {
    id: 'payment-setup-1',
    memberId: 'member-1',
    provider: 'sandbox',
    providerCheckoutSessionId: 'session-setup-1',
    paymentType: 'CARD_SETUP',
    status: 'PENDING',
    amount: 0,
    currency: 'EUR',
  }
}
