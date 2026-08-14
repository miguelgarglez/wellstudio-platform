import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  buildAdminPaymentsOverview,
  parseAdminPaymentStatusFilter,
  truncateOperationalId,
} from '@/modules/admin/server/admin-payments-overview'

const now = new Date('2026-08-09T12:00:00.000Z')

describe('admin payments overview', () => {
  it('maps payment, product and webhook health into safe operational copy', () => {
    const payment = {
      id: 'payment-safe-1234567890',
      status: 'FAILED',
      paymentType: 'CREDIT_PACK_PURCHASE',
      amount: 8900,
      currency: 'EUR',
      provider: 'stripe',
      createdAt: new Date('2026-08-09T10:00:00.000Z'),
      member: {
        firstName: 'Ana',
        lastName: 'Socio',
        user: { email: 'ana@example.com' },
      },
      items: [{ itemType: 'CREDIT_PACK', referenceId: 'pack-1' }],
      events: [{ processingStatus: 'FAILED' }],
    }

    const overview = buildAdminPaymentsOverview({
      query: 'ana',
      status: 'failed',
      payments: [payment] as never,
      failedCount: 2,
      activeCount: 1,
      succeededRecentCount: 7,
      selectedPayment: null,
      productNames: { 'pack-1': 'Bono 10 sesiones' },
      now,
    })

    expect(overview.summary).toEqual({
      failedCount: 2,
      activeCount: 1,
      succeededRecentCount: 7,
    })
    expect(overview.payments[0]).toMatchObject({
      memberName: 'Ana Socio',
      productLabel: 'Bono 10 sesiones',
      amountLabel: '89,00 €',
      statusLabel: 'Fallido',
      eventHealthLabel: 'Evento fallido',
      providerLabel: 'Stripe',
    })
  })

  it('maps detail without exposing provider payload or full external ids', () => {
    const selectedPayment = {
      id: 'payment-internal-1234567890',
      status: 'SUCCEEDED',
      paymentType: 'CREDIT_PACK_PURCHASE',
      amount: 4900,
      currency: 'EUR',
      provider: 'stripe',
      providerCheckoutSessionId: 'cs_test_1234567890abcdefghijklmnop',
      providerPaymentIntentId: 'pi_1234567890abcdefghijklmnop',
      createdAt: now,
      capturedAt: now,
      failedAt: null,
      failureReason: null,
      member: {
        firstName: 'Leo',
        lastName: 'Mensual',
        status: 'ACTIVE',
        user: { email: 'leo@example.com' },
      },
      items: [{
        id: 'item-1',
        itemType: 'CREDIT_PACK',
        referenceId: 'missing-pack',
        quantity: 1,
        totalAmount: 4900,
        entitlementUnits: 5,
      }],
      events: [{
        id: 'event-1',
        providerEventId: 'evt_1234567890abcdefghijklmnop',
        eventType: 'checkout.session.completed',
        processingStatus: 'PROCESSED',
        createdAt: now,
        processedAt: now,
      }],
    }

    const overview = buildAdminPaymentsOverview({
      query: '',
      status: 'all',
      payments: [],
      failedCount: 0,
      activeCount: 0,
      succeededRecentCount: 1,
      selectedPayment: selectedPayment as never,
      productNames: {},
      now,
    })

    expect(overview.selectedPayment).toMatchObject({
      memberStatusLabel: 'Socio activo',
      productLabel: 'Bono no disponible',
      checkoutSessionIdLabel: 'cs_test_12…klmnop',
      paymentIntentIdLabel: 'pi_1234567…klmnop',
      events: [{
        providerEventIdLabel: 'evt_123456…klmnop',
        typeLabel: 'Checkout confirmado',
        statusLabel: 'Evento procesado',
      }],
    })
    expect(overview.selectedPayment).not.toHaveProperty('payloadJson')
    expect(JSON.stringify(overview.selectedPayment)).not.toContain('abcdefghijklmnop')
  })

  it('labels canceled payments without webhook noise', () => {
    const overview = buildAdminPaymentsOverview({
      query: '',
      status: 'all',
      payments: [{
        id: 'payment-canceled-1',
        status: 'CANCELED',
        paymentType: 'CREDIT_PACK_PURCHASE',
        amount: 6500,
        currency: 'EUR',
        provider: 'stripe',
        createdAt: now,
        member: {
          firstName: 'Miguel',
          lastName: 'García',
          user: { email: 'miguel@example.com' },
        },
        items: [{ itemType: 'CREDIT_PACK', referenceId: 'pack-1' }],
        events: [],
      }] as never,
      failedCount: 0,
      activeCount: 0,
      succeededRecentCount: 0,
      selectedPayment: null,
      productNames: { 'pack-1': 'Bono 5 sesiones' },
      now,
    })

    expect(overview.payments[0]?.eventHealthLabel).toBe('Cancelado sin cobro')
  })

  it('normalizes manipulated filters and truncates operational references', () => {
    expect(parseAdminPaymentStatusFilter('unexpected')).toBe('all')
    expect(parseAdminPaymentStatusFilter('pending')).toBe('pending')
    expect(parseAdminPaymentStatusFilter('refunded')).toBe('refunded')
    expect(truncateOperationalId(null)).toBeNull()
    expect(truncateOperationalId('short-reference')).toBe('short-reference')
    expect(truncateOperationalId('1234567890abcdefghij123456')).toBe('1234567890…123456')
  })
})
