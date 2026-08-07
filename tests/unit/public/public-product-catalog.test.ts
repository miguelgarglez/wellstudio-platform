import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  buildPublicProductCatalog,
  mapPublicCreditPack,
  mapPublicMembershipPlan,
} from '@/modules/public/server/public-product-catalog'

describe('public product catalog', () => {
  it('maps periodic membership policy and minor-unit pricing', () => {
    const plan = mapPublicMembershipPlan(planRecord({
      priceAmount: 8950,
      bookingPolicy: {
        policyType: 'PERIODIC_ALLOWANCE',
        periodType: 'CALENDAR_WEEK',
        allowanceCount: 3,
      },
    }))

    expect(plan).toMatchObject({
      priceLabel: '89,50 €',
      billingLabel: 'al mes',
      bookingLabel: '3 reservas por semana',
    })
  })

  it('maps unlimited plans and optional included credits honestly', () => {
    const plan = mapPublicMembershipPlan(planRecord({
      includedCredits: 2,
      bookingPolicy: { policyType: 'UNLIMITED', periodType: null, allowanceCount: null },
    }))

    expect(plan.bookingLabel).toBe('Reservas ilimitadas')
    expect(plan.supportingLabel).toBe('2 créditos incluidos')
  })

  it('maps credit count and validity', () => {
    expect(mapPublicCreditPack(packRecord({ creditsTotal: 5, expiresAfterDays: 90 }))).toMatchObject({
      priceLabel: '65,00 €',
      creditsLabel: '5 reservas',
      validityLabel: 'Válido durante 90 días desde la activación',
    })
    expect(mapPublicCreditPack(packRecord({ creditsTotal: 1, expiresAfterDays: null }))).toMatchObject({
      creditsLabel: '1 reserva',
      validityLabel: 'Sin caducidad configurada',
    })
  })

  it('excludes draft, archived and private products and sorts by actual price', () => {
    const catalog = buildPublicProductCatalog({
      plans: [
        planRecord({ id: 'expensive', name: 'Plan B', priceAmount: 12000 }),
        planRecord({ id: 'cheap', name: 'Plan A', priceAmount: 8000 }),
        planRecord({ id: 'draft', status: 'DRAFT' }),
        planRecord({ id: 'private', isPublic: false }),
      ],
      creditPacks: [
        packRecord({ id: 'public-pack' }),
        packRecord({ id: 'archived-pack', status: 'ARCHIVED' }),
      ],
    })

    expect(catalog.plans.map((plan) => plan.id)).toEqual(['cheap', 'expensive'])
    expect(catalog.creditPacks.map((pack) => pack.id)).toEqual(['public-pack'])
    expect(catalog.productCount).toBe(3)
  })
})

function planRecord(overrides: Partial<Parameters<typeof mapPublicMembershipPlan>[0]> = {}): Parameters<typeof mapPublicMembershipPlan>[0] {
  return {
    id: 'plan-1',
    name: 'Plan Fuerza',
    slug: 'plan-fuerza',
    description: 'Continuidad semanal.',
    priceAmount: 7900,
    currency: 'EUR',
    billingInterval: 'MONTH',
    bookingPolicyType: null,
    includedCredits: null,
    status: 'ACTIVE',
    isPublic: true,
    bookingPolicy: { policyType: 'UNLIMITED', periodType: null, allowanceCount: null },
    ...overrides,
  }
}

function packRecord(overrides: Partial<Parameters<typeof mapPublicCreditPack>[0]> = {}): Parameters<typeof mapPublicCreditPack>[0] {
  return {
    id: 'pack-1',
    name: 'Bono Flexible',
    slug: 'bono-flexible',
    description: 'Sesiones a tu ritmo.',
    creditsTotal: 5,
    priceAmount: 6500,
    currency: 'EUR',
    expiresAfterDays: 90,
    status: 'ACTIVE',
    isPublic: true,
    ...overrides,
  }
}
