import { describe, expect, it } from 'vitest'

import {
  buildMemberHomeAlerts,
  buildMemberHomeOverview,
} from '@/modules/members/server/member-home-overview'
import type { AuthContext } from '@/modules/auth/server/identity'

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

describe('member home overview helpers', () => {
  it('builds alerts for no entitlement, waitlist activity and missing card', () => {
    expect(
      buildMemberHomeAlerts({
        hasActiveEntitlement: false,
        hasActiveWaitlist: true,
        hasLinkedCard: false,
      }).map((alert) => alert.kind),
    ).toEqual(['no-entitlement', 'active-waitlist', 'no-card'])
  })
})

describe('buildMemberHomeOverview', () => {
  it('maps reservations, waitlists and snapshot data into a dashboard overview', () => {
    const overview = buildMemberHomeOverview({
      authContext: buildAuthenticatedContext(),
      upcomingReservations: [
        {
          id: 'reservation-1',
          memberId: 'member-1',
          classSessionId: 'session-1',
          status: 'BOOKED',
          bookedAt: new Date('2026-03-24T08:00:00.000Z'),
          canceledAt: null,
          canceledByUserId: null,
          cancellationReason: null,
          attendanceStatus: 'PENDING',
          source: 'MEMBER_APP',
          createdAt: new Date('2026-03-24T08:00:00.000Z'),
          updatedAt: new Date('2026-03-24T08:00:00.000Z'),
          classSession: {
            startsAt: new Date('2026-03-24T18:45:00.000Z'),
            endsAt: new Date('2026-03-24T19:30:00.000Z'),
            locationLabel: 'Sala principal',
            capacity: 10,
            reservedCount: 7,
            classType: {
              name: 'Grupo Dinámico',
            },
            coach: {
              displayName: 'Pablo García',
            },
          },
        },
      ],
      waitlists: [
        {
          id: 'waitlist-1',
          memberId: 'member-1',
          classSessionId: 'session-2',
          position: 2,
          status: 'WAITING',
          joinedAt: new Date('2026-03-24T09:00:00.000Z'),
          notifiedAt: null,
          promotedAt: null,
          expiredAt: null,
          classSession: {
            startsAt: new Date('2026-03-25T18:45:00.000Z'),
            endsAt: new Date('2026-03-25T19:30:00.000Z'),
            locationLabel: 'Sala premium',
            capacity: 4,
            reservedCount: 4,
            classType: {
              name: 'Grupo Premium',
            },
            coach: {
              displayName: 'Gabriel Mozos',
            },
          },
        },
      ],
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
          id: 'card-1',
          memberId: 'member-1',
          provider: 'stripe',
          providerCustomerId: null,
          providerPaymentMethodId: 'pm_1',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2027,
          isDefault: true,
          status: 'ACTIVE',
          createdAt: new Date('2026-03-01T09:00:00.000Z'),
          updatedAt: new Date('2026-03-05T09:00:00.000Z'),
        },
      ],
      now: new Date('2026-03-24T09:00:00.000Z'),
    })

    expect(overview.summary.displayName).toBe('María WellStudio')
    expect(overview.upcomingReservations).toHaveLength(1)
    expect(overview.waitlists).toHaveLength(1)
    expect(overview.commercial.currentPlanName).toBe('Fuerza Base')
    expect(overview.commercial.pendingPlanName).toBeNull()
    expect(overview.commercial.creditsRemaining).toBe(6)
    expect(overview.commercial.linkedCardLabel).toContain('4242')
    expect(overview.activitySummaryLabel).toBe('1 reserva próxima · 1 waitlist activa')
  })

  it('surfaces a pending membership as secondary commercial state', () => {
    const overview = buildMemberHomeOverview({
      authContext: buildAuthenticatedContext(),
      upcomingReservations: [],
      waitlists: [],
      memberships: [
        {
          id: 'membership-2',
          memberId: 'member-1',
          membershipPlanId: 'plan-2',
          status: 'PENDING_ACTIVATION',
          startsAt: new Date('2026-03-26T09:00:00.000Z'),
          endsAt: new Date('2026-04-26T09:00:00.000Z'),
          autoRenews: false,
          providerSubscriptionId: null,
          paymentId: null,
          createdAt: new Date('2026-03-24T09:00:00.000Z'),
          updatedAt: new Date('2026-03-24T09:00:00.000Z'),
          membershipPlan: {
            name: 'Plan Boutique',
          },
        },
      ],
      creditAccounts: [],
      cards: [],
      now: new Date('2026-03-24T09:00:00.000Z'),
    })

    expect(overview.commercial.currentPlanName).toBeNull()
    expect(overview.commercial.pendingPlanName).toBe('Plan Boutique')
  })

  it('does not present physically active but expired entitlements as current', () => {
    const now = new Date('2026-03-24T09:00:00.000Z')
    const overview = buildMemberHomeOverview({
      authContext: buildAuthenticatedContext(),
      upcomingReservations: [],
      waitlists: [],
      memberships: [{
        id: 'membership-expired',
        memberId: 'member-1',
        membershipPlanId: 'plan-1',
        status: 'ACTIVE',
        startsAt: new Date('2026-02-24T09:00:00.000Z'),
        endsAt: now,
        autoRenews: false,
        providerSubscriptionId: null,
        paymentId: null,
        createdAt: new Date('2026-02-24T09:00:00.000Z'),
        updatedAt: new Date('2026-02-24T09:00:00.000Z'),
        membershipPlan: { name: 'Plan vencido' },
      }],
      creditAccounts: [{
        id: 'credit-expired',
        memberId: 'member-1',
        creditPackId: 'pack-1',
        status: 'ACTIVE',
        openedAt: new Date('2026-02-24T09:00:00.000Z'),
        expiresAt: now,
        paymentId: null,
        createdAt: new Date('2026-02-24T09:00:00.000Z'),
        updatedAt: new Date('2026-02-24T09:00:00.000Z'),
        creditPack: { name: 'Bono vencido', creditsTotal: 8 },
        ledgerEntries: [{ balanceAfter: 5 }],
      }],
      cards: [],
      now,
    })

    expect(overview.commercial).toMatchObject({
      currentPlanName: null,
      creditsRemaining: 0,
      creditsPackNames: [],
    })
    expect(overview.alerts.map((alert) => alert.kind)).toContain('no-entitlement')
  })
})
