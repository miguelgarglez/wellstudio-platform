import { describe, expect, it } from 'vitest'

import type { AuthContext } from '@/modules/auth/server/identity'
import {
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
    expect(
      buildMemberAccountAlerts({
        currentPlanName: null,
        pendingPlanName: 'Premium',
        creditsRemaining: 0,
        hasLinkedCard: false,
      }).map((alert) => alert.kind),
    ).toEqual(['no-entitlement', 'pending-plan', 'no-card'])
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
})
