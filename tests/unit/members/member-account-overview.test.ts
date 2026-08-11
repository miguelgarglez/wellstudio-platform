import { describe, expect, it } from 'vitest'

import type { AuthContext } from '@/modules/auth/server/identity'
import {
  buildCardLinkNotice,
  buildCheckoutNotice,
  buildMemberAccountAlerts,
  buildMemberAccountOverview,
} from '@/modules/members/server/member-account-overview'

function buildAuthenticatedContext(): Extract<AuthContext, { isAuthenticated: true }> {
  return {
    isAuthenticated: true,
    authUser: {
      id: 'auth-user-1',
      email: 'maria@wellstudio.test',
    } as Extract<AuthContext, { isAuthenticated: true }>['authUser'],
    localUser: {
      id: 'user-1',
      email: 'maria@wellstudio.test',
      normalizedEmail: 'maria@wellstudio.test',
      status: 'ACTIVE',
    } as Extract<AuthContext, { isAuthenticated: true }>['localUser'],
    member: {
      id: 'member-1',
      firstName: 'María',
      lastName: 'WellStudio',
      status: 'ACTIVE',
    } as Extract<AuthContext, { isAuthenticated: true }>['member'],
    roles: [{ role: 'MEMBER' }] as Extract<AuthContext, { isAuthenticated: true }>['roles'],
  }
}

describe('member account helpers', () => {
  it('builds real alerts from existing commercial signals', () => {
    const alerts = buildMemberAccountAlerts({
      currentPlanName: null,
      pendingPlanName: 'Premium',
      creditsRemaining: 0,
      hasLinkedCard: false,
    })

    expect(alerts.map((alert) => alert.kind)).toEqual([
      'no-entitlement',
      'pending-plan',
      'no-card',
    ])
    expect(alerts.find((alert) => alert.kind === 'no-entitlement')?.description).toContain('bono')
    expect(alerts.find((alert) => alert.kind === 'no-entitlement')?.description).not.toContain(
      'cobertura activa',
    )
    expect(alerts.find((alert) => alert.kind === 'no-card')?.description).not.toContain(
      'checkout alojado',
    )
  })

  it('observes only payments that are still awaiting provider confirmation', () => {
    expect(buildCheckoutNotice({
      checkout: 'success',
      payment: { id: 'payment-pending', status: 'PENDING' },
    })).toEqual({
      kind: 'processing',
      title: 'Estamos confirmando el pago',
      description: 'El proveedor todavía está procesando la confirmación. Tus créditos aparecerán automáticamente.',
      instanceKey: 'payment-pending',
    })

    expect(buildCheckoutNotice({
      checkout: 'success',
      payment: { id: 'payment-succeeded', status: 'SUCCEEDED' },
    })).toMatchObject({ kind: 'success', instanceKey: 'payment-succeeded' })

    expect(buildCheckoutNotice({
      checkout: 'success',
      payment: { id: 'payment-failed', status: 'FAILED' },
    })).toMatchObject({ kind: 'failed', instanceKey: 'payment-failed' })
  })

  it('does not reveal whether a manipulated payment id belongs to another account', () => {
    expect(buildCheckoutNotice({ checkout: 'success', payment: null })).toEqual({
      kind: 'failed',
      title: 'No pudimos verificar la compra',
      description: 'No encontramos una compra vinculada a este regreso. Revisa tus pagos recientes o vuelve a intentarlo.',
      instanceKey: 'checkout-success',
    })
  })

  it('observes card linking without inventing success from the redirect alone', () => {
    expect(buildCardLinkNotice({
      card: 'success',
      payment: { id: 'card-pending', status: 'PENDING' },
    })).toMatchObject({ kind: 'processing', instanceKey: 'card-pending' })

    expect(buildCardLinkNotice({
      card: 'success',
      payment: { id: 'card-succeeded', status: 'SUCCEEDED' },
    })).toMatchObject({ kind: 'success', title: 'Tarjeta vinculada' })

    expect(buildCardLinkNotice({ card: 'canceled', payment: null })).toMatchObject({
      kind: 'canceled',
      title: 'Vinculación cancelada',
    })
  })
})

describe('buildMemberAccountOverview', () => {
  it('maps membership, credits, card and payments into a commercial account view model', () => {
    const overview = buildMemberAccountOverview({
      authContext: buildAuthenticatedContext(),
      memberships: [
        {
          id: 'membership-1',
          memberId: 'member-1',
          membershipPlanId: 'plan-1',
          status: 'ACTIVE',
          startsAt: new Date('2026-03-01T09:00:00.000Z'),
          endsAt: new Date('2026-04-01T09:00:00.000Z'),
          autoRenews: false,
          providerSubscriptionId: null,
          paymentId: null,
          createdAt: new Date('2026-03-01T09:00:00.000Z'),
          updatedAt: new Date('2026-03-01T09:00:00.000Z'),
          membershipPlan: {
            name: 'Fuerza Base',
          },
        },
      ],
      creditAccounts: [
        {
          id: 'credit-account-1',
          memberId: 'member-1',
          creditPackId: 'pack-1',
          status: 'ACTIVE',
          openedAt: new Date('2026-03-01T09:00:00.000Z'),
          expiresAt: null,
          paymentId: null,
          createdAt: new Date('2026-03-01T09:00:00.000Z'),
          updatedAt: new Date('2026-03-01T09:00:00.000Z'),
          creditPack: {
            name: 'Pack 10',
            creditsTotal: 10,
          },
          ledgerEntries: [{ balanceAfter: 6 }],
        },
      ],
      cards: [
        {
          brand: 'visa',
          last4: '4242',
          expMonth: 7,
          expYear: 2028,
          isDefault: true,
          updatedAt: new Date('2026-03-15T09:00:00.000Z'),
        },
      ],
      payments: [
        {
          id: 'payment-1',
          status: 'SUCCEEDED',
          paymentType: 'MEMBERSHIP_PURCHASE',
          amount: 8900,
          currency: 'EUR',
          createdAt: new Date('2026-03-12T09:00:00.000Z'),
          card: {
            brand: 'visa',
            last4: '4242',
          },
        },
      ],
      creditPacks: [
        {
          id: 'pack-public-1',
          slug: 'pack-flexible',
          name: 'Pack Flexible',
          description: 'Seis reservas',
          creditsTotal: 6,
          expiresAfterDays: 45,
          priceAmount: 5400,
          currency: 'EUR',
        },
      ],
      selectedPackSlug: 'pack-flexible',
      checkout: 'success',
      checkoutPayment: { status: 'SUCCEEDED' },
      now: new Date('2026-03-20T09:00:00.000Z'),
    })

    expect(overview.highlights.plan.title).toBe('Fuerza Base')
    expect(overview.highlights.credits.title).toBe('6 disponibles')
    expect(overview.highlights.card.title).toBe('visa terminada en 4242')
    expect(overview.hasLinkedCard).toBe(true)
    expect(overview.linkedCardLabel).toBe('visa terminada en 4242')
    expect(overview.alerts).toEqual([])
    expect(overview.payments[0]).toMatchObject({
      title: 'Compra de membresía',
      amountLabel: '89,00 €',
      statusLabel: 'Pagado',
    })
    expect(overview.purchasableCreditPacks[0]).toMatchObject({
      name: 'Pack Flexible',
      creditsLabel: '6 reservas',
      priceLabel: '54,00 €',
    })
    expect(overview.selectedCreditPackId).toBe('pack-public-1')
    expect(overview.checkoutNotice).toMatchObject({ kind: 'success', title: 'Bono activado' })
  })

  it('shows honest empty commercial state for expired active records', () => {
    const now = new Date('2026-03-20T09:00:00.000Z')
    const overview = buildMemberAccountOverview({
      authContext: buildAuthenticatedContext(),
      memberships: [{
        id: 'membership-expired',
        memberId: 'member-1',
        membershipPlanId: 'plan-1',
        status: 'ACTIVE',
        startsAt: new Date('2026-02-20T09:00:00.000Z'),
        endsAt: now,
        autoRenews: false,
        providerSubscriptionId: null,
        paymentId: null,
        createdAt: new Date('2026-02-20T09:00:00.000Z'),
        updatedAt: new Date('2026-02-20T09:00:00.000Z'),
        membershipPlan: { name: 'Plan vencido' },
      }],
      creditAccounts: [{
        id: 'credit-expired',
        memberId: 'member-1',
        creditPackId: 'pack-1',
        status: 'ACTIVE',
        openedAt: new Date('2026-02-20T09:00:00.000Z'),
        expiresAt: now,
        paymentId: null,
        createdAt: new Date('2026-02-20T09:00:00.000Z'),
        updatedAt: new Date('2026-02-20T09:00:00.000Z'),
        creditPack: { name: 'Bono vencido', creditsTotal: 8 },
        ledgerEntries: [{ balanceAfter: 5 }],
      }],
      cards: [],
      payments: [],
      now,
    })

    expect(overview.highlights.plan.title).toBe('Sin plan activo')
    expect(overview.highlights.credits).toMatchObject({
      title: 'Sin créditos activos',
      description: 'Compra un bono más abajo cuando quieras más reservas.',
    })
    expect(overview.alerts.map((alert) => alert.kind)).toContain('no-entitlement')
  })
})
