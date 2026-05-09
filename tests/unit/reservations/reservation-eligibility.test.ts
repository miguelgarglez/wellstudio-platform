import { describe, expect, it } from 'vitest'

import {
  buildBusinessPeriodWindow,
  buildCancellationWindow,
  buildMembershipBookingPeriodKey,
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
    membershipPlan: {
      bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
      bookingPolicy: null,
    },
    bookingOverrides: [],
    usages: [],
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
      classSessionId: 'session-1',
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
      classSessionId: 'session-1',
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
        classSessionId: 'session-1',
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
        classSessionId: 'session-1',
      }),
    ).toEqual({
      eligible: false,
      code: 'NO_ELIGIBLE_ENTITLEMENT',
    })
  })

  it('reports exhausted membership allowance when a periodic policy is full', () => {
    const result = evaluateReservationEligibilityFromSnapshots({
      rules: [
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
      memberships: [
        {
          ...baseMembership,
          membershipPlan: {
            bookingPolicyType: null,
            bookingPolicy: {
              policyType: 'PERIODIC_ALLOWANCE',
              periodType: 'CALENDAR_WEEK',
              allowanceCount: 2,
            },
          },
          usages: [
            {
              usageType: 'MEMBERSHIP',
              bookingOverrideId: null,
              reservation: {
                status: 'BOOKED',
                classSession: {
                  id: 'session-booked-1',
                  startsAt: new Date('2026-04-06T18:00:00.000Z'),
                },
              },
            },
            {
              usageType: 'MEMBERSHIP',
              bookingOverrideId: null,
              reservation: {
                status: 'ATTENDED',
                classSession: {
                  id: 'session-booked-2',
                  startsAt: new Date('2026-04-08T18:00:00.000Z'),
                },
              },
            },
          ],
        },
      ],
      creditAccounts: [],
      sessionStartsAt: new Date('2026-04-10T18:00:00.000Z'),
      classSessionId: 'session-3',
    })

    expect(result).toEqual({
      eligible: false,
      code: 'MEMBERSHIP_ALLOWANCE_EXHAUSTED',
    })
  })

  it('uses a session-specific override when the periodic allowance is exhausted', () => {
    const result = evaluateReservationEligibilityFromSnapshots({
      rules: [
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
      memberships: [
        {
          ...baseMembership,
          membershipPlan: {
            bookingPolicyType: null,
            bookingPolicy: {
              policyType: 'PERIODIC_ALLOWANCE',
              periodType: 'CALENDAR_WEEK',
              allowanceCount: 1,
            },
          },
          bookingOverrides: [
            {
              id: 'override-session',
              overrideType: 'SESSION_ACCESS',
              classSessionId: 'session-override',
              extraBookings: null,
              startsAt: new Date('2026-04-07T00:00:00.000Z'),
              expiresAt: new Date('2026-04-13T23:59:59.000Z'),
              revokedAt: null,
            },
          ],
          usages: [
            {
              usageType: 'MEMBERSHIP',
              bookingOverrideId: null,
              reservation: {
                status: 'BOOKED',
                classSession: {
                  id: 'session-booked-1',
                  startsAt: new Date('2026-04-07T18:00:00.000Z'),
                },
              },
            },
          ],
        },
      ],
      creditAccounts: [],
      sessionStartsAt: new Date('2026-04-10T18:00:00.000Z'),
      classSessionId: 'session-override',
    })

    expect(result).toMatchObject({
      eligible: true,
      usage: {
        usageType: 'MANUAL_OVERRIDE',
        bookingOverrideId: 'override-session',
      },
    })
  })

  it('falls back to credit when membership allowance is exhausted but a credit rule also exists', () => {
    const result = evaluateReservationEligibilityFromSnapshots({
      rules: [
        {
          id: 'membership-rule',
          ruleType: 'MEMBERSHIP_PLAN',
          membershipPlanId: 'plan-premium',
          creditCost: null,
          priority: 0,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          isActive: true,
        },
        {
          id: 'credit-rule',
          ruleType: 'CREDIT',
          membershipPlanId: null,
          creditCost: 2,
          priority: 1,
          createdAt: new Date('2026-03-02T00:00:00.000Z'),
          isActive: true,
        },
      ],
      memberships: [
        {
          ...baseMembership,
          membershipPlan: {
            bookingPolicyType: null,
            bookingPolicy: {
              policyType: 'PERIODIC_ALLOWANCE',
              periodType: 'CALENDAR_WEEK',
              allowanceCount: 1,
            },
          },
          usages: [
            {
              usageType: 'MEMBERSHIP',
              bookingOverrideId: null,
              reservation: {
                status: 'BOOKED',
                classSession: {
                  id: 'session-booked-1',
                  startsAt: new Date('2026-04-07T18:00:00.000Z'),
                },
              },
            },
          ],
        },
      ],
      creditAccounts: [baseCreditAccount],
      sessionStartsAt: new Date('2026-04-10T18:00:00.000Z'),
      classSessionId: 'session-credit-fallback',
    })

    expect(result).toMatchObject({
      eligible: true,
      usage: {
        usageType: 'CREDIT',
        memberCreditAccountId: 'credits-1',
      },
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

  it('builds calendar period keys and windows in business time', () => {
    expect(
      buildMembershipBookingPeriodKey(
        new Date('2026-04-12T20:30:00.000Z'),
        'CALENDAR_WEEK',
      ),
    ).toBe('2026-04-06')

    expect(
      buildMembershipBookingPeriodKey(
        new Date('2026-04-12T22:30:00.000Z'),
        'CALENDAR_MONTH',
      ),
    ).toBe('2026-04')

    const monthWindow = buildBusinessPeriodWindow(
      new Date('2026-04-12T22:30:00.000Z'),
      'CALENDAR_MONTH',
    )

    expect(monthWindow.startsAt.toISOString()).toBe('2026-03-31T22:00:00.000Z')
    expect(monthWindow.endsAt.toISOString()).toBe('2026-04-30T21:59:59.999Z')
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
            bookingOverrideId: null,
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
