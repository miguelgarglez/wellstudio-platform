import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {},
}))

import { buildAdminMembershipPolicyPlanItem } from '@/modules/admin/server/admin-membership-policy-overview'

describe('buildAdminMembershipPolicyPlanItem', () => {
  it('maps explicit periodic policies into admin-friendly summary and edit state', () => {
    const item = buildAdminMembershipPolicyPlanItem({
      id: 'plan-1',
      name: 'Fuerza Base',
      slug: 'fuerza-base',
      description: 'Plan recurrente base',
      priceAmount: 8900,
      currency: 'EUR',
      billingInterval: 'MONTH',
      bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
      status: 'ACTIVE',
      bookingPolicy: {
        policyType: 'PERIODIC_ALLOWANCE',
        periodType: 'CALENDAR_WEEK',
        allowanceCount: 3,
      },
    })

    expect(item.policySummaryLabel).toBe('3 / semana')
    expect(item.policySourceLabel).toBe('Regla explícita')
    expect(item.policySourceTone).toBe('explicit')
    expect(item.editMode).toBe('CALENDAR_WEEK')
    expect(item.allowanceCount).toBe('3')
  })

  it('falls back to legacy unlimited semantics when no explicit policy exists', () => {
    const item = buildAdminMembershipPolicyPlanItem({
      id: 'plan-2',
      name: 'Fuerza Open',
      slug: 'fuerza-open',
      description: null,
      priceAmount: 9900,
      currency: 'EUR',
      billingInterval: 'MONTH',
      bookingPolicyType: 'OPEN_MEMBERSHIP_ACCESS',
      status: 'ACTIVE',
      bookingPolicy: null,
    })

    expect(item.policySummaryLabel).toBe('Ilimitada')
    expect(item.policySourceTone).toBe('legacy')
    expect(item.editMode).toBe('UNLIMITED')
    expect(item.allowanceCount).toBe('')
  })
})
