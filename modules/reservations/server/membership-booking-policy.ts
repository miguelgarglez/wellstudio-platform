import type { MembershipBookingPolicy } from '@prisma/client'

export type SupportedMembershipBookingPolicyType = 'UNLIMITED' | 'PERIODIC_ALLOWANCE'
export type SupportedMembershipBookingPeriodType = 'CALENDAR_WEEK' | 'CALENDAR_MONTH'

export type MembershipBookingPolicySnapshot = Pick<
  MembershipBookingPolicy,
  'policyType' | 'periodType' | 'allowanceCount'
>

export type ResolvedMembershipBookingPolicy =
  | {
      policyType: 'UNLIMITED'
      periodType: null
      allowanceCount: null
      source: 'explicit' | 'legacy'
    }
  | {
      policyType: 'PERIODIC_ALLOWANCE'
      periodType: SupportedMembershipBookingPeriodType
      allowanceCount: number
      source: 'explicit'
    }

export function resolveEffectiveMembershipBookingPolicy(input: {
  explicitPolicy: MembershipBookingPolicySnapshot | null
  legacyPolicyType: string | null
}): ResolvedMembershipBookingPolicy {
  const explicitPolicy = input.explicitPolicy

  if (explicitPolicy?.policyType === 'PERIODIC_ALLOWANCE') {
    const periodType = normalizeMembershipBookingPeriodType(explicitPolicy.periodType)
    const allowanceCount = Math.max(explicitPolicy.allowanceCount ?? 0, 0)

    if (periodType && allowanceCount > 0) {
      return {
        policyType: 'PERIODIC_ALLOWANCE',
        periodType,
        allowanceCount,
        source: 'explicit',
      }
    }
  }

  if (explicitPolicy?.policyType === 'UNLIMITED') {
    return {
      policyType: 'UNLIMITED',
      periodType: null,
      allowanceCount: null,
      source: 'explicit',
    }
  }

  const legacyPolicyType = input.legacyPolicyType?.trim().toUpperCase()

  if (!legacyPolicyType || legacyPolicyType === 'UNLIMITED' || legacyPolicyType === 'OPEN_MEMBERSHIP_ACCESS') {
    return {
      policyType: 'UNLIMITED',
      periodType: null,
      allowanceCount: null,
      source: 'legacy',
    }
  }

  return {
    policyType: 'UNLIMITED',
    periodType: null,
    allowanceCount: null,
    source: 'legacy',
  }
}

export function normalizeMembershipBookingPeriodType(periodType: string | null | undefined) {
  const normalized = periodType?.trim().toUpperCase()

  switch (normalized) {
    case 'CALENDAR_WEEK':
    case 'CALENDAR_MONTH':
      return normalized
    default:
      return null
  }
}
