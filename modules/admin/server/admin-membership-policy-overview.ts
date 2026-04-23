import { prisma } from '@/lib/db/prisma'
import {
  resolveEffectiveMembershipBookingPolicy,
  type MembershipBookingPolicySnapshot,
} from '@/modules/reservations/server/membership-booking-policy'

export type AdminMembershipPolicyMode = 'UNLIMITED' | 'CALENDAR_WEEK' | 'CALENDAR_MONTH'

export type AdminMembershipPolicyPlanItem = {
  id: string
  name: string
  slug: string
  description: string | null
  statusLabel: string
  billingSummary: string
  policySummaryLabel: string
  policySourceLabel: string
  policySourceTone: 'explicit' | 'legacy'
  editMode: AdminMembershipPolicyMode
  allowanceCount: string
}

export type AdminMembershipPolicyOverview = {
  plans: AdminMembershipPolicyPlanItem[]
  selectedPlan: AdminMembershipPolicyPlanItem | null
  selectedPlanId: string | null
}

export async function getAdminMembershipPolicyOverview(selectedPlanId: string | null) {
  const plans = await prisma.membershipPlan.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceAmount: true,
      currency: true,
      billingInterval: true,
      bookingPolicyType: true,
      status: true,
      bookingPolicy: {
        select: {
          policyType: true,
          periodType: true,
          allowanceCount: true,
        },
      },
    },
  })

  const items = plans
    .map((plan) => buildAdminMembershipPolicyPlanItem(plan))
    .sort(compareAdminMembershipPolicyPlans)
  const selectedPlan = items.find((plan) => plan.id === selectedPlanId) ?? null

  return {
    plans: items,
    selectedPlan,
    selectedPlanId: selectedPlan?.id ?? null,
  } satisfies AdminMembershipPolicyOverview
}

export function buildAdminMembershipPolicyPlanItem(plan: {
  id: string
  name: string
  slug: string
  description: string | null
  priceAmount: number
  currency: string
  billingInterval: string | null
  bookingPolicyType: string | null
  status: string
  bookingPolicy: MembershipBookingPolicySnapshot | null
}) {
  const resolvedPolicy = resolveEffectiveMembershipBookingPolicy({
    explicitPolicy: plan.bookingPolicy,
    legacyPolicyType: plan.bookingPolicyType,
  })

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    statusLabel: formatPlanStatusLabel(plan.status),
    billingSummary: buildBillingSummary({
      amount: plan.priceAmount,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
    }),
    policySummaryLabel: formatPolicySummaryLabel(resolvedPolicy),
    policySourceLabel: resolvedPolicy.source === 'explicit' ? 'Política explícita' : 'Fallback legacy',
    policySourceTone: resolvedPolicy.source,
    editMode:
      resolvedPolicy.policyType === 'PERIODIC_ALLOWANCE'
        ? resolvedPolicy.periodType
        : 'UNLIMITED',
    allowanceCount:
      resolvedPolicy.policyType === 'PERIODIC_ALLOWANCE'
        ? String(resolvedPolicy.allowanceCount)
        : '',
  } satisfies AdminMembershipPolicyPlanItem
}

function buildBillingSummary(input: {
  amount: number
  currency: string
  billingInterval: string | null
}) {
  const amountLabel = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: input.currency,
  }).format(input.amount / 100)

  const billingInterval = input.billingInterval?.trim().toUpperCase()

  switch (billingInterval) {
    case 'MONTH':
      return `${amountLabel} / mes`
    case 'YEAR':
      return `${amountLabel} / año`
    case 'WEEK':
      return `${amountLabel} / semana`
    default:
      return amountLabel
  }
}

function compareAdminMembershipPolicyPlans(
  left: AdminMembershipPolicyPlanItem,
  right: AdminMembershipPolicyPlanItem,
) {
  const order = {
    Activo: 0,
    Borrador: 1,
    Archivado: 2,
  } as const

  const statusWeight = (order[left.statusLabel as keyof typeof order] ?? 9) - (order[right.statusLabel as keyof typeof order] ?? 9)

  if (statusWeight !== 0) {
    return statusWeight
  }

  return left.name.localeCompare(right.name, 'es')
}

function formatPlanStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Activo'
    case 'DRAFT':
      return 'Borrador'
    case 'ARCHIVED':
      return 'Archivado'
    default:
      return 'Plan'
  }
}

function formatPolicySummaryLabel(policy: ReturnType<typeof resolveEffectiveMembershipBookingPolicy>) {
  if (policy.policyType === 'UNLIMITED') {
    return 'Ilimitada'
  }

  return policy.periodType === 'CALENDAR_WEEK'
    ? `${policy.allowanceCount} / semana`
    : `${policy.allowanceCount} / mes`
}
