import { describe, expect, it } from 'vitest'

import {
  buildPlanWindowLabel,
  calculateCreditsRemaining,
  formatCardLabel,
  selectCurrentMembership,
  selectPendingMembership,
  selectPrimaryCard,
} from '@/modules/members/server/member-commercial'

describe('member commercial helpers', () => {
  it('selects current and pending memberships correctly', () => {
    const memberships = [
      {
        status: 'PENDING_ACTIVATION',
        startsAt: new Date('2026-03-28T09:00:00.000Z'),
        endsAt: new Date('2026-04-28T09:00:00.000Z'),
        membershipPlan: { name: 'Premium' },
      },
      {
        status: 'ACTIVE',
        startsAt: new Date('2026-03-01T09:00:00.000Z'),
        endsAt: new Date('2026-04-01T09:00:00.000Z'),
        membershipPlan: { name: 'Fuerza Base' },
      },
    ] as Parameters<typeof selectCurrentMembership>[0]

    expect(
      selectCurrentMembership(memberships, new Date('2026-03-20T09:00:00.000Z'))
        ?.membershipPlan.name,
    ).toBe('Fuerza Base')
    expect(selectPendingMembership(memberships)?.membershipPlan.name).toBe('Premium')
  })

  it('calculates remaining credits using latest balance or pack total fallback', () => {
    expect(
      calculateCreditsRemaining([
        {
          status: 'ACTIVE',
          openedAt: new Date('2026-03-01T08:00:00.000Z'),
          expiresAt: null,
          creditPack: { name: 'Pack 10', creditsTotal: 10 },
          ledgerEntries: [{ balanceAfter: 4 }],
        },
        {
          status: 'ACTIVE',
          openedAt: new Date('2026-03-02T08:00:00.000Z'),
          expiresAt: null,
          creditPack: { name: 'Pack 6', creditsTotal: 6 },
          ledgerEntries: [],
        },
      ], new Date('2026-03-20T09:00:00.000Z')),
    ).toBe(10)
  })

  it('excludes future or expired commercial state at the exact boundary', () => {
    const now = new Date('2026-03-20T09:00:00.000Z')
    const memberships = [
      {
        status: 'ACTIVE',
        startsAt: new Date('2026-03-21T09:00:00.000Z'),
        endsAt: null,
        membershipPlan: { name: 'Future' },
      },
      {
        status: 'ACTIVE',
        startsAt: new Date('2026-02-20T09:00:00.000Z'),
        endsAt: now,
        membershipPlan: { name: 'Expired now' },
      },
    ] as Parameters<typeof selectCurrentMembership>[0]

    expect(selectCurrentMembership(memberships, now)).toBeNull()
    expect(calculateCreditsRemaining([
      {
        status: 'ACTIVE',
        openedAt: new Date('2026-02-20T09:00:00.000Z'),
        expiresAt: now,
        creditPack: { name: 'Expired pack', creditsTotal: 10 },
        ledgerEntries: [{ balanceAfter: 7 }],
      },
      {
        status: 'ACTIVE',
        openedAt: new Date('2026-03-21T09:00:00.000Z'),
        expiresAt: null,
        creditPack: { name: 'Future pack', creditsTotal: 5 },
        ledgerEntries: [],
      },
    ], now)).toBe(0)
  })

  it('selects the default card before newer non-default cards', () => {
    const card = selectPrimaryCard([
      {
        brand: 'visa',
        last4: '1111',
        isDefault: false,
        updatedAt: new Date('2026-03-22T09:00:00.000Z'),
      },
      {
        brand: 'mastercard',
        last4: '2222',
        isDefault: true,
        updatedAt: new Date('2026-03-21T09:00:00.000Z'),
      },
    ])

    expect(card?.last4).toBe('2222')
  })

  it('formats plan windows and card labels for account-facing UI', () => {
    expect(
      buildPlanWindowLabel(
        {
          status: 'ACTIVE',
          startsAt: new Date('2026-03-01T09:00:00.000Z'),
          endsAt: new Date('2026-04-01T09:00:00.000Z'),
          membershipPlan: { name: 'Fuerza Base' },
        },
        new Date('2026-03-20T09:00:00.000Z'),
      ),
    ).toBe('1 mar – 1 abr')

    expect(formatCardLabel({ brand: 'visa', last4: '4242' })).toBe(
      'visa terminada en 4242',
    )
  })
})
