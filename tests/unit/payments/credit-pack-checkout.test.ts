import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, tx } = vi.hoisted(() => {
  const transaction = {
    paymentEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creditPack: {
      findUnique: vi.fn(),
    },
    memberCreditAccount: {
      upsert: vi.fn(),
    },
    notificationJob: {
      upsert: vi.fn(),
    },
  }
  return {
    tx: transaction,
    prismaMock: {
      member: { findUnique: vi.fn() },
      creditPack: { findFirst: vi.fn() },
      payment: { create: vi.fn(), update: vi.fn() },
      paymentEvent: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import type { PaymentCheckoutProvider, VerifiedCheckoutEvent } from '@/modules/payments/server/checkout-provider'
import {
  processCheckoutEvent,
  startCreditPackCheckout,
} from '@/modules/payments/server/credit-pack-checkout'

const now = new Date('2026-08-08T10:00:00.000Z')

describe('credit pack checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'ACTIVE',
      user: { email: 'member@example.com', status: 'ACTIVE' },
    })
    prismaMock.creditPack.findFirst.mockResolvedValue({
      id: 'pack-1',
      name: 'Bono 8',
      description: 'Ocho sesiones',
      creditsTotal: 8,
      priceAmount: 7200,
      currency: 'EUR',
      expiresAfterDays: 60,
    })
    prismaMock.payment.create.mockResolvedValue({ id: 'payment-1' })
    prismaMock.payment.update.mockResolvedValue({ id: 'payment-1' })
    tx.payment.findUnique.mockResolvedValue(buildNotificationPayment())
    tx.notificationJob.upsert.mockResolvedValue({ id: 'job-payment-1' })
  })

  it('creates a pending local snapshot before requesting checkout', async () => {
    const provider = buildProvider()

    const result = await startCreditPackCheckout({
      memberId: 'member-1',
      creditPackId: 'pack-1',
      appUrl: 'http://localhost:3000/',
      provider,
    })

    expect(result).toEqual({
      success: true,
      paymentId: 'payment-1',
      checkoutUrl: 'http://checkout.test/session-1',
    })
    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        memberId: 'member-1',
        status: 'PENDING',
        paymentType: 'CREDIT_PACK_PURCHASE',
        amount: 7200,
        currency: 'EUR',
        items: {
          create: expect.objectContaining({
            referenceId: 'pack-1',
            productNameSnapshot: 'Bono 8',
            entitlementUnits: 8,
            entitlementExpiresAfterDays: 60,
          }),
        },
      }),
      select: { id: true },
    })
    expect(provider.createCreditPackCheckout).toHaveBeenCalledWith(expect.objectContaining({
      paymentId: 'payment-1',
      unitAmount: 7200,
      currency: 'eur',
      successUrl: expect.stringContaining('payment=payment-1'),
    }))
  })

  it('rejects an inactive member before creating any payment', async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: 'member-1',
      status: 'BLOCKED',
      user: { email: 'member@example.com', status: 'ACTIVE' },
    })

    const result = await startCreditPackCheckout({
      memberId: 'member-1',
      creditPackId: 'pack-1',
      appUrl: 'http://localhost:3000',
      provider: buildProvider(),
    })

    expect(result).toMatchObject({ success: false, code: 'MEMBER_INACTIVE' })
    expect(prismaMock.payment.create).not.toHaveBeenCalled()
  })

  it('marks the local payment failed without leaking provider details', async () => {
    const provider = buildProvider()
    vi.mocked(provider.createCreditPackCheckout).mockRejectedValue(new Error('secret provider response'))

    const result = await startCreditPackCheckout({
      memberId: 'member-1',
      creditPackId: 'pack-1',
      appUrl: 'http://localhost:3000',
      provider,
    })

    expect(result).toEqual({
      success: false,
      code: 'PROVIDER_ERROR',
      message: 'No se ha podido preparar el pago. Inténtalo de nuevo en unos minutos.',
    })
    expect(prismaMock.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({
        status: 'FAILED',
        failureReason: 'checkout_provider_error',
      }),
    })
  })

  it('fulfills a paid event using the immutable item snapshot', async () => {
    const event = buildEvent()
    prismaMock.paymentEvent.create.mockResolvedValue(buildEventRecord())
    tx.paymentEvent.findUnique.mockResolvedValue(buildEventRecord())
    tx.payment.findFirst.mockResolvedValue(buildPayment())

    const result = await processCheckoutEvent({ provider: 'sandbox', event })

    expect(result).toEqual({
      success: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-1',
      notificationJobIds: ['job-payment-1'],
    })
    expect(tx.memberCreditAccount.upsert).toHaveBeenCalledWith({
      where: { paymentId: 'payment-1' },
      update: {},
      create: expect.objectContaining({
        memberId: 'member-1',
        creditPackId: 'pack-1',
        paymentId: 'payment-1',
        expiresAt: new Date('2026-10-07T10:00:00.000Z'),
        ledgerEntries: {
          create: expect.objectContaining({
            entryType: 'PURCHASE',
            creditsDelta: 8,
            balanceAfter: 8,
          }),
        },
      }),
    })
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ status: 'SUCCEEDED' }),
    })
    expect(tx.notificationJob.upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: 'credit_pack_purchased/payment-1' },
      create: expect.objectContaining({
        eventType: 'CREDIT_PACK_PURCHASED',
        recipient: 'member@example.com',
        referenceType: 'payment',
        referenceId: 'payment-1',
        payload: expect.objectContaining({
          paymentId: 'payment-1',
          productName: 'Bono 8',
          credits: 8,
          amount: 7200,
        }),
      }),
      update: {},
      select: { id: true },
    })
  })

  it('fails closed when provider amount does not match the local payment', async () => {
    prismaMock.paymentEvent.create.mockResolvedValue(buildEventRecord())
    tx.paymentEvent.findUnique.mockResolvedValue(buildEventRecord())
    tx.payment.findFirst.mockResolvedValue(buildPayment())

    const result = await processCheckoutEvent({
      provider: 'sandbox',
      event: buildEvent({ amountTotal: 7100 }),
    })

    expect(result).toMatchObject({ success: false, code: 'PAYMENT_MISMATCH' })
    expect(tx.memberCreditAccount.upsert).not.toHaveBeenCalled()
    expect(tx.paymentEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-row-1' },
      data: expect.objectContaining({ processingStatus: 'FAILED' }),
    })
  })

  it('does not enter fulfillment again for an already processed provider event', async () => {
    prismaMock.paymentEvent.create.mockResolvedValue({
      ...buildEventRecord(),
      paymentId: 'payment-1',
      processingStatus: 'PROCESSED',
    })

    const result = await processCheckoutEvent({ provider: 'sandbox', event: buildEvent() })

    expect(result).toEqual({
      success: true,
      outcome: 'ALREADY_PROCESSED',
      paymentId: 'payment-1',
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('retries a previously failed event without duplicating the entitlement', async () => {
    prismaMock.paymentEvent.create.mockResolvedValue({
      ...buildEventRecord(),
      processingStatus: 'FAILED',
      processedAt: new Date('2026-08-08T09:59:00.000Z'),
    })
    tx.paymentEvent.findUnique.mockResolvedValue({
      ...buildEventRecord(),
      processingStatus: 'FAILED',
    })
    tx.payment.findFirst.mockResolvedValue(buildPayment())

    const result = await processCheckoutEvent({ provider: 'sandbox', event: buildEvent() })

    expect(result).toEqual({
      success: true,
      outcome: 'FULFILLED',
      paymentId: 'payment-1',
      notificationJobIds: ['job-payment-1'],
    })
    expect(tx.memberCreditAccount.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { paymentId: 'payment-1' },
      update: {},
    }))
  })
})

function buildProvider(): PaymentCheckoutProvider {
  return {
    provider: 'sandbox',
    createCreditPackCheckout: vi.fn().mockResolvedValue({
      id: 'session-1',
      url: 'http://checkout.test/session-1',
      expiresAt: new Date('2026-08-08T10:30:00.000Z'),
    }),
    verifyWebhook: vi.fn(),
  }
}

function buildEvent(overrides: Partial<VerifiedCheckoutEvent> = {}): VerifiedCheckoutEvent {
  return {
    providerEventId: 'provider-event-1',
    providerEventType: 'checkout.session.completed',
    occurredAt: now,
    kind: 'CHECKOUT_COMPLETED',
    checkoutSessionId: 'session-1',
    paymentIntentId: 'intent-1',
    paymentStatus: 'paid',
    paymentId: 'payment-1',
    amountTotal: 7200,
    currency: 'eur',
    safePayload: { id: 'provider-event-1' },
    ...overrides,
  }
}

function buildEventRecord() {
  return {
    id: 'event-row-1',
    paymentId: null,
    provider: 'sandbox',
    providerEventId: 'provider-event-1',
    eventType: 'checkout.session.completed',
    payloadJson: {},
    processedAt: null,
    processingStatus: 'RECEIVED',
    createdAt: now,
  }
}

function buildPayment() {
  return {
    id: 'payment-1',
    memberId: 'member-1',
    cardId: null,
    provider: 'sandbox',
    providerPaymentIntentId: null,
    providerInvoiceId: null,
    providerCheckoutSessionId: 'session-1',
    checkoutExpiresAt: null,
    status: 'PENDING',
    paymentType: 'CREDIT_PACK_PURCHASE',
    amount: 7200,
    currency: 'EUR',
    capturedAt: null,
    failedAt: null,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
    items: [{
      id: 'item-1',
      paymentId: 'payment-1',
      itemType: 'CREDIT_PACK',
      referenceId: 'pack-1',
      productNameSnapshot: 'Bono 8',
      quantity: 1,
      unitAmount: 7200,
      totalAmount: 7200,
      entitlementUnits: 8,
      entitlementExpiresAfterDays: 60,
      createdAt: now,
    }],
  }
}

function buildNotificationPayment() {
  return {
    id: 'payment-1',
    memberId: 'member-1',
    paymentType: 'CREDIT_PACK_PURCHASE',
    amount: 7200,
    currency: 'EUR',
    member: {
      firstName: 'Ana',
      lastName: 'Socio',
      user: { email: 'member@example.com' },
    },
    items: [{
      itemType: 'CREDIT_PACK',
      referenceId: 'pack-1',
      productNameSnapshot: 'Bono 8',
      entitlementUnits: 8,
      entitlementExpiresAfterDays: 60,
    }],
  }
}
