import { cache } from 'react'

import { prisma } from '@/lib/db/prisma'
import {
  isSandboxFixtureProduct,
  withoutSandboxFixtureProducts,
} from '@/modules/public/server/sandbox-fixtures'
import {
  resolveEffectiveMembershipBookingPolicy,
  type MembershipBookingPolicySnapshot,
} from '@/modules/reservations/server/membership-booking-policy'

type PublicPlanRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  priceAmount: number
  currency: string
  billingInterval: string | null
  bookingPolicyType: string | null
  includedCredits: number | null
  status: string
  isPublic: boolean
  bookingPolicy: MembershipBookingPolicySnapshot | null
}

type PublicCreditPackRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  creditsTotal: number
  priceAmount: number
  currency: string
  expiresAfterDays: number | null
  status: string
  isPublic: boolean
}

export type PublicMembershipPlan = {
  id: string
  name: string
  slug: string
  description: string | null
  priceLabel: string
  billingLabel: string
  bookingLabel: string
  supportingLabel: string | null
}

export type PublicCreditPack = {
  id: string
  name: string
  slug: string
  description: string | null
  priceLabel: string
  creditsLabel: string
  validityLabel: string
}

export type PublicProductCatalog = {
  plans: PublicMembershipPlan[]
  creditPacks: PublicCreditPack[]
  productCount: number
}

export const getPublicProductCatalog = cache(async (includeSandboxFixtures = false) => {
  const commercialProductFilter = withoutSandboxFixtureProducts(includeSandboxFixtures)
  const [plans, creditPacks] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { status: 'ACTIVE', isPublic: true, ...commercialProductFilter },
      orderBy: [{ priceAmount: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceAmount: true,
        currency: true,
        billingInterval: true,
        bookingPolicyType: true,
        includedCredits: true,
        status: true,
        isPublic: true,
        bookingPolicy: {
          select: { policyType: true, periodType: true, allowanceCount: true },
        },
      },
    }),
    prisma.creditPack.findMany({
      where: { status: 'ACTIVE', isPublic: true, ...commercialProductFilter },
      orderBy: [{ priceAmount: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        creditsTotal: true,
        priceAmount: true,
        currency: true,
        expiresAfterDays: true,
        status: true,
        isPublic: true,
      },
    }),
  ])

  return buildPublicProductCatalog({ plans, creditPacks, includeSandboxFixtures })
})

export function buildPublicProductCatalog(input: {
  plans: PublicPlanRecord[]
  creditPacks: PublicCreditPackRecord[]
  includeSandboxFixtures?: boolean
}): PublicProductCatalog {
  const plans = input.plans
    .filter(isPublicActiveProduct)
    .filter((plan) => input.includeSandboxFixtures || !isSandboxFixtureProduct(plan))
    .sort(compareProductRecords)
    .map(mapPublicMembershipPlan)
  const creditPacks = input.creditPacks
    .filter(isPublicActiveProduct)
    .filter((pack) => input.includeSandboxFixtures || !isSandboxFixtureProduct(pack))
    .sort(compareProductRecords)
    .map(mapPublicCreditPack)

  return {
    plans,
    creditPacks,
    productCount: plans.length + creditPacks.length,
  }
}

export function mapPublicMembershipPlan(plan: PublicPlanRecord): PublicMembershipPlan {
  const policy = resolveEffectiveMembershipBookingPolicy({
    explicitPolicy: plan.bookingPolicy,
    legacyPolicyType: plan.bookingPolicyType,
  })

  const bookingLabel = policy.policyType === 'UNLIMITED'
    ? 'Reservas ilimitadas'
    : policy.periodType === 'CALENDAR_WEEK'
      ? `${policy.allowanceCount} reservas por semana`
      : `${policy.allowanceCount} reservas por mes`

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    priceLabel: formatMoney(plan.priceAmount, plan.currency),
    billingLabel: formatBillingInterval(plan.billingInterval),
    bookingLabel,
    supportingLabel: plan.includedCredits && plan.includedCredits > 0
      ? `${plan.includedCredits} créditos incluidos`
      : null,
  }
}

export function mapPublicCreditPack(pack: PublicCreditPackRecord): PublicCreditPack {
  return {
    id: pack.id,
    name: pack.name,
    slug: pack.slug,
    description: pack.description,
    priceLabel: formatMoney(pack.priceAmount, pack.currency),
    creditsLabel: pack.creditsTotal === 1 ? '1 reserva' : `${pack.creditsTotal} reservas`,
    validityLabel: pack.expiresAfterDays
      ? `Válido durante ${pack.expiresAfterDays} días desde la activación`
      : 'Sin caducidad configurada',
  }
}

function isPublicActiveProduct(product: { status: string; isPublic: boolean }) {
  return product.status === 'ACTIVE' && product.isPublic
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

function formatBillingInterval(interval: string | null) {
  switch (interval?.trim().toUpperCase()) {
    case 'WEEK':
    case 'WEEKLY':
      return 'por semana'
    case 'YEAR':
    case 'YEARLY':
      return 'por año'
    case 'MONTH':
    case 'MONTHLY':
      return 'al mes'
    default:
      return 'según acuerdo'
  }
}

function compareProductRecords<T extends { priceAmount: number; name: string }>(left: T, right: T) {
  return left.priceAmount - right.priceAmount || left.name.localeCompare(right.name, 'es')
}
