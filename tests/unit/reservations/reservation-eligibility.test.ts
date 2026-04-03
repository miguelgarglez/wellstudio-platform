import { describe, expect, it } from 'vitest'

import {
  buildCancellationWindow,
  buildSchedulePrimaryAction,
  compareEligibilityRules,
  evaluateReservationEligibilityFromSnapshots,
} from '@/modules/reservations/server/reservation-eligibility'

describe('reservation eligibility', () => {
  const baseMembership = {
    id: 'membership-1',
    membershipPlanId: 'plan-premium',
    status: 'ACTIVE' as const,
    startsAt: new Date('2026-04-01T00:00:00.000Z'),
    endsAt: null,
  }

  const baseCreditAccount = {
    id: 'credits-1',
    status: 'ACTIVE' as const,
    openedAt: new Date('2026-03-01T00:00:00.000Z'),
    expiresAt: new Date('2026-06-01T00:00:00.000Z'),
    creditPack: {
      creditsTotal: 10,
    },
    ledgerEntries: [{ balanceAfter: 3 }],
  }

  it('prefers membership rules over credit on equal priority', () => {
    const result = evaluateReservationEligibilityFromSnapshots({
      rules: [
        {
          id: 'credit-rule',
          ruleType: 'CREDIT',
          membershipPlanId: null,
          creditCost: 2,
          priority: 0,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        },
        {
          id: 'membership-rule',
          ruleType: 'MEMBERSHIP_PLAN',
          membershipPlanId: 'plan-premium',
          creditCost: null,
          priority: 0,
          createdAt: new Date('2026-03-02T00:00:00.000Z'),
          isActive: true,
        },
      ],
      memberships: [baseMembership],
      creditAccounts: [baseCreditAccount],
      sessionStartsAt: new Date('2026-04-03T18:00:00.000Z'),
    })

    expect(result).toMatchObject({
      eligible: true,
      code: 'ELIGIBLE',
      usage: {
        usageType: 'MEMBERSHIP',
        memberMembershipId: 'membership-1',
      },
    })
  })

  it('supports credit eligibility and picks the earliest expiring usable account', () => {
    const result = evaluateReservationEligibilityFromSnapshots({
      rules: [
        {
          id: 'credit-rule',
          ruleType: 'CREDIT',
          membershipPlanId: null,
          creditCost: 2,
          priority: 1,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        },
      ],
      memberships: [],
      creditAccounts: [
        {
          ...baseCreditAccount,
          id: 'credits-late',
          expiresAt: new Date('2026-07-01T00:00:00.000Z'),
        },
        {
          ...baseCreditAccount,
          id: 'credits-early',
          expiresAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      sessionStartsAt: new Date('2026-04-03T18:00:00.000Z'),
    })

    expect(result).toMatchObject({
      eligible: true,
      usage: {
        usageType: 'CREDIT',
        memberCreditAccountId: 'credits-early',
        creditsUsed: 2,
      },
    })
  })

  it('returns no active rule when no usable rule exists', () => {
    expect(
      evaluateReservationEligibilityFromSnapshots({
        rules: [],
        memberships: [baseMembership],
        creditAccounts: [baseCreditAccount],
        sessionStartsAt: new Date('2026-04-03T18:00:00.000Z'),
      }),
    ).toEqual({
      eligible: false,
      code: 'NO_ACTIVE_RULE',
    })
  })

  it('returns no eligible entitlement when rules exist but member cannot satisfy them', () => {
    expect(
      evaluateReservationEligibilityFromSnapshots({
        rules: [
          {
            id: 'credit-rule',
            ruleType: 'CREDIT',
            membershipPlanId: null,
            creditCost: 8,
            priority: 0,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            isActive: true,
          },
        ],
        memberships: [],
        creditAccounts: [baseCreditAccount],
        sessionStartsAt: new Date('2026-04-03T18:00:00.000Z'),
      }),
    ).toEqual({
      eligible: false,
      code: 'NO_ELIGIBLE_ENTITLEMENT',
    })
  })

  it('keeps deterministic ordering with createdAt tie-breaker after priority and rule weight', () => {
    const left = {
      id: 'a',
      ruleType: 'CREDIT',
      membershipPlanId: null,
      creditCost: 1,
      priority: 2,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      isActive: true,
    }
    const right = {
      id: 'b',
      ruleType: 'CREDIT',
      membershipPlanId: null,
      creditCost: 1,
      priority: 2,
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
      isActive: true,
    }

    expect(compareEligibilityRules(left, right)).toBeLessThan(0)
  })

  it('derives cancellation window and schedule actions for operational UI', () => {
    expect(
      buildCancellationWindow({
        startsAt: new Date('2026-04-03T18:00:00.000Z'),
        now: new Date('2026-04-03T14:45:00.000Z'),
      }).canCancel,
    ).toBe(true)

    expect(
      buildSchedulePrimaryAction({
        isAlreadyBooked: false,
        isAlreadyWaitlisted: false,
        isFull: true,
        waitlistEnabled: true,
        eligibility: {
          eligible: true,
          code: 'ELIGIBLE',
          usage: {
            usageType: 'CREDIT',
            ruleId: 'credit-rule',
            ruleType: 'CREDIT',
            memberMembershipId: null,
            memberCreditAccountId: 'credits-1',
            creditsUsed: 2,
          },
        },
      }),
    ).toMatchObject({
      kind: 'join-waitlist',
      label: 'Entrar en waitlist',
    })
  })
})
