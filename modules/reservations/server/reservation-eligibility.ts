import type {
  ClassTypeEligibilityRule,
  MemberCreditAccount,
  MemberMembership,
} from '@prisma/client'

export const MEMBER_CANCELLATION_WINDOW_MINUTES = 120

export type SupportedEligibilityRuleType = 'MEMBERSHIP_PLAN' | 'CREDIT'

export type ReservationEligibilityCode =
  | 'ELIGIBLE'
  | 'NO_ACTIVE_RULE'
  | 'NO_ELIGIBLE_ENTITLEMENT'

export type ReservationScheduleActionKind =
  | 'book'
  | 'join-waitlist'
  | 'blocked'
  | 'already-booked'
  | 'already-waitlisted'

export type EligibilityRuleSnapshot = Pick<
  ClassTypeEligibilityRule,
  'id' | 'ruleType' | 'membershipPlanId' | 'creditCost' | 'priority' | 'createdAt' | 'isActive'
>

export type MembershipEligibilitySnapshot = Pick<
  MemberMembership,
  'id' | 'membershipPlanId' | 'status' | 'startsAt' | 'endsAt'
>

export type CreditAccountEligibilitySnapshot = Pick<
  MemberCreditAccount,
  'id' | 'status' | 'openedAt' | 'expiresAt'
> & {
  creditPack: {
    creditsTotal: number
  }
  ledgerEntries: Array<{
    balanceAfter: number
  }>
}

export type ReservationEligibilityUsage =
  | {
      usageType: 'MEMBERSHIP'
      ruleId: string
      ruleType: 'MEMBERSHIP_PLAN'
      memberMembershipId: string
      memberCreditAccountId: null
      creditsUsed: null
    }
  | {
      usageType: 'CREDIT'
      ruleId: string
      ruleType: 'CREDIT'
      memberMembershipId: null
      memberCreditAccountId: string
      creditsUsed: number
    }

export type ReservationEligibilityResult =
  | {
      eligible: true
      code: 'ELIGIBLE'
      usage: ReservationEligibilityUsage
    }
  | {
      eligible: false
      code: Exclude<ReservationEligibilityCode, 'ELIGIBLE'>
    }

export type ReservationSchedulePrimaryAction = {
  kind: ReservationScheduleActionKind
  label: string
  description?: string
}

export function normalizeEligibilityRuleType(
  ruleType: string,
): SupportedEligibilityRuleType | null {
  const normalized = ruleType.trim().toUpperCase()

  switch (normalized) {
    case 'MEMBERSHIP_PLAN':
    case 'REQUIRES_SPECIFIC_PLAN':
    case 'REQUIRES_ACTIVE_MEMBERSHIP':
      return 'MEMBERSHIP_PLAN'
    case 'CREDIT':
    case 'ALLOWS_CREDIT_USAGE':
      return 'CREDIT'
    default:
      return null
  }
}

export function compareEligibilityRules(
  left: EligibilityRuleSnapshot,
  right: EligibilityRuleSnapshot,
) {
  if (left.priority !== right.priority) {
    return left.priority - right.priority
  }

  const leftWeight = normalizeEligibilityRuleType(left.ruleType) === 'MEMBERSHIP_PLAN' ? 0 : 1
  const rightWeight =
    normalizeEligibilityRuleType(right.ruleType) === 'MEMBERSHIP_PLAN' ? 0 : 1

  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight
  }

  return left.createdAt.getTime() - right.createdAt.getTime()
}

export function sortEligibilityRules(rules: EligibilityRuleSnapshot[]) {
  return [...rules].sort(compareEligibilityRules)
}

export function calculateCreditAccountBalance(
  account: Pick<CreditAccountEligibilitySnapshot, 'creditPack' | 'ledgerEntries'>,
) {
  return account.ledgerEntries[0]?.balanceAfter ?? account.creditPack.creditsTotal
}

export function selectEligibleMembershipForRule(
  memberships: MembershipEligibilitySnapshot[],
  rule: EligibilityRuleSnapshot,
  sessionStartsAt: Date,
) {
  return memberships.find((membership) => {
    if (membership.status !== 'ACTIVE') {
      return false
    }

    if (membership.startsAt.getTime() > sessionStartsAt.getTime()) {
      return false
    }

    if (membership.endsAt && membership.endsAt.getTime() < sessionStartsAt.getTime()) {
      return false
    }

    if (rule.membershipPlanId && membership.membershipPlanId !== rule.membershipPlanId) {
      return false
    }

    return true
  })
}

export function selectEligibleCreditAccountForRule(
  creditAccounts: CreditAccountEligibilitySnapshot[],
  rule: EligibilityRuleSnapshot,
  sessionStartsAt: Date,
) {
  const requiredCredits = Math.max(rule.creditCost ?? 0, 0)

  if (requiredCredits <= 0) {
    return null
  }

  const eligibleAccounts = creditAccounts.filter((account) => {
    if (account.status !== 'ACTIVE') {
      return false
    }

    if (account.expiresAt && account.expiresAt.getTime() < sessionStartsAt.getTime()) {
      return false
    }

    return calculateCreditAccountBalance(account) >= requiredCredits
  })

  return eligibleAccounts.sort((left, right) => {
    const leftExpiry = left.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY
    const rightExpiry = right.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY

    if (leftExpiry !== rightExpiry) {
      return leftExpiry - rightExpiry
    }

    return left.openedAt.getTime() - right.openedAt.getTime()
  })[0] ?? null
}

export function evaluateReservationEligibilityFromSnapshots({
  rules,
  memberships,
  creditAccounts,
  sessionStartsAt,
}: {
  rules: EligibilityRuleSnapshot[]
  memberships: MembershipEligibilitySnapshot[]
  creditAccounts: CreditAccountEligibilitySnapshot[]
  sessionStartsAt: Date
}): ReservationEligibilityResult {
  const activeRules = sortEligibilityRules(rules.filter((rule) => rule.isActive))

  if (activeRules.length === 0) {
    return {
      eligible: false,
      code: 'NO_ACTIVE_RULE',
    }
  }

  for (const rule of activeRules) {
    const normalizedRuleType = normalizeEligibilityRuleType(rule.ruleType)

    if (normalizedRuleType === 'MEMBERSHIP_PLAN') {
      const membership = selectEligibleMembershipForRule(
        memberships,
        rule,
        sessionStartsAt,
      )

      if (membership) {
        return {
          eligible: true,
          code: 'ELIGIBLE',
          usage: {
            usageType: 'MEMBERSHIP',
            ruleId: rule.id,
            ruleType: 'MEMBERSHIP_PLAN',
            memberMembershipId: membership.id,
            memberCreditAccountId: null,
            creditsUsed: null,
          },
        }
      }

      continue
    }

    if (normalizedRuleType === 'CREDIT') {
      const creditAccount = selectEligibleCreditAccountForRule(
        creditAccounts,
        rule,
        sessionStartsAt,
      )

      if (creditAccount) {
        return {
          eligible: true,
          code: 'ELIGIBLE',
          usage: {
            usageType: 'CREDIT',
            ruleId: rule.id,
            ruleType: 'CREDIT',
            memberMembershipId: null,
            memberCreditAccountId: creditAccount.id,
            creditsUsed: Math.max(rule.creditCost ?? 0, 0),
          },
        }
      }
    }
  }

  return {
    eligible: false,
    code: 'NO_ELIGIBLE_ENTITLEMENT',
  }
}

export function buildCancellationWindow({
  startsAt,
  now,
}: {
  startsAt: Date
  now: Date
}) {
  const cutoffAt = new Date(
    startsAt.getTime() - MEMBER_CANCELLATION_WINDOW_MINUTES * 60 * 1000,
  )

  return {
    canCancel: cutoffAt.getTime() > now.getTime(),
    cutoffAt,
  }
}

export function buildSchedulePrimaryAction({
  isAlreadyBooked,
  isAlreadyWaitlisted,
  isFull,
  waitlistEnabled,
  eligibility,
}: {
  isAlreadyBooked: boolean
  isAlreadyWaitlisted: boolean
  isFull: boolean
  waitlistEnabled: boolean
  eligibility: ReservationEligibilityResult
}): ReservationSchedulePrimaryAction {
  if (isAlreadyBooked) {
    return {
      kind: 'already-booked',
      label: 'Ya reservada',
    }
  }

  if (isAlreadyWaitlisted) {
    return {
      kind: 'already-waitlisted',
      label: 'En waitlist',
    }
  }

  if (!eligibility.eligible) {
    return {
      kind: 'blocked',
      label:
        eligibility.code === 'NO_ACTIVE_RULE'
          ? 'Sin regla activa'
          : 'No puedes reservar ahora',
      description:
        eligibility.code === 'NO_ACTIVE_RULE'
          ? 'La clase todavía no tiene una regla de elegibilidad activa.'
          : 'Necesitas una membresía válida o créditos suficientes para esta sesión.',
    }
  }

  if (!isFull) {
    return {
      kind: 'book',
      label: 'Reservar',
      description: 'Confirmarás la plaza desde este mismo panel.',
    }
  }

  if (waitlistEnabled) {
    return {
      kind: 'join-waitlist',
      label: 'Entrar en waitlist',
      description: 'Si se libera una plaza, el sistema intentará promocionarte.',
    }
  }

  return {
    kind: 'blocked',
    label: 'Clase completa',
    description: 'No quedan plazas y esta sesión no admite waitlist.',
  }
}
