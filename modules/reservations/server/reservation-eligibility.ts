import type {
  ClassSession,
  ClassTypeEligibilityRule,
  MemberCreditAccount,
  MemberMembership,
  MemberMembershipBookingOverride,
  Reservation,
  ReservationEntitlementUsage,
} from '@prisma/client'
import {
  resolveEffectiveMembershipBookingPolicy,
  type MembershipBookingPolicySnapshot,
  type SupportedMembershipBookingPeriodType,
} from '@/modules/reservations/server/membership-booking-policy'

export const MEMBER_CANCELLATION_WINDOW_MINUTES = 120
export const WELLSTUDIO_BUSINESS_TIME_ZONE = 'Europe/Madrid'

const WEEKDAY_TO_MONDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

const BUSINESS_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: WELLSTUDIO_BUSINESS_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const BUSINESS_DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: WELLSTUDIO_BUSINESS_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export type SupportedEligibilityRuleType = 'MEMBERSHIP_PLAN' | 'CREDIT'
export type ReservationEligibilityCode =
  | 'ELIGIBLE'
  | 'MEMBER_NOT_ACTIVE'
  | 'NO_ACTIVE_RULE'
  | 'NO_ELIGIBLE_ENTITLEMENT'
  | 'MEMBERSHIP_ALLOWANCE_EXHAUSTED'

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

export type MembershipBookingOverrideSnapshot = Pick<
  MemberMembershipBookingOverride,
  'id' | 'overrideType' | 'classSessionId' | 'extraBookings' | 'startsAt' | 'expiresAt' | 'revokedAt'
>

export type MembershipUsageSnapshot = Pick<
  ReservationEntitlementUsage,
  'usageType' | 'bookingOverrideId'
> & {
  reservation: Pick<Reservation, 'status'> & {
    classSession: Pick<ClassSession, 'id' | 'startsAt'>
  }
}

export type MembershipEligibilitySnapshot = Pick<
  MemberMembership,
  'id' | 'membershipPlanId' | 'status' | 'startsAt' | 'endsAt'
> & {
  membershipPlan: {
    bookingPolicyType: string | null
    bookingPolicy: MembershipBookingPolicySnapshot | null
  }
  bookingOverrides: MembershipBookingOverrideSnapshot[]
  usages: MembershipUsageSnapshot[]
}

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
      bookingOverrideId: null
      creditsUsed: null
    }
  | {
      usageType: 'MANUAL_OVERRIDE'
      ruleId: string
      ruleType: 'MEMBERSHIP_PLAN'
      memberMembershipId: string
      memberCreditAccountId: null
      bookingOverrideId: string
      creditsUsed: null
    }
  | {
      usageType: 'CREDIT'
      ruleId: string
      ruleType: 'CREDIT'
      memberMembershipId: null
      memberCreditAccountId: string
      bookingOverrideId: null
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

export function buildMembershipPolicyUsageSearchWindow(input: {
  earliestSessionStartsAt: Date
  latestSessionStartsAt: Date
}) {
  const earliestWindow = buildBusinessPeriodWindow(
    input.earliestSessionStartsAt,
    'CALENDAR_MONTH',
  )
  const latestWindow = buildBusinessPeriodWindow(
    input.latestSessionStartsAt,
    'CALENDAR_MONTH',
  )

  return {
    startsAtGte: earliestWindow.startsAt,
    startsAtLte: latestWindow.endsAt,
  }
}

export function buildMembershipBookingPeriodKey(
  date: Date,
  periodType: SupportedMembershipBookingPeriodType,
) {
  const businessDate = getBusinessDateParts(date)

  if (periodType === 'CALENDAR_MONTH') {
    return `${businessDate.year}-${padTwoDigits(businessDate.month)}`
  }

  const mondayDate = getBusinessWeekMondayDate(date)

  return `${mondayDate.getUTCFullYear()}-${padTwoDigits(mondayDate.getUTCMonth() + 1)}-${padTwoDigits(
    mondayDate.getUTCDate(),
  )}`
}

export function buildBusinessPeriodWindow(
  date: Date,
  periodType: SupportedMembershipBookingPeriodType,
) {
  const businessDate = getBusinessDateParts(date)

  if (periodType === 'CALENDAR_MONTH') {
    const startsAt = buildBusinessDateTime(
      businessDate.year,
      businessDate.month,
      1,
      0,
      0,
      0,
    )
    const nextMonthStartsAt = buildBusinessDateTime(
      businessDate.month === 12 ? businessDate.year + 1 : businessDate.year,
      businessDate.month === 12 ? 1 : businessDate.month + 1,
      1,
      0,
      0,
      0,
    )

    return {
      startsAt,
      endsAt: new Date(nextMonthStartsAt.getTime() - 1),
    }
  }

  const mondayDate = getBusinessWeekMondayDate(date)
  const nextMondayDate = new Date(mondayDate)
  nextMondayDate.setUTCDate(mondayDate.getUTCDate() + 7)

  const startsAt = buildBusinessDateTime(
    mondayDate.getUTCFullYear(),
    mondayDate.getUTCMonth() + 1,
    mondayDate.getUTCDate(),
    0,
    0,
    0,
  )
  const nextWeekStartsAt = buildBusinessDateTime(
    nextMondayDate.getUTCFullYear(),
    nextMondayDate.getUTCMonth() + 1,
    nextMondayDate.getUTCDate(),
    0,
    0,
    0,
  )

  return {
    startsAt,
    endsAt: new Date(nextWeekStartsAt.getTime() - 1),
  }
}

export function selectEligibleMembershipsForRule(
  memberships: MembershipEligibilitySnapshot[],
  rule: EligibilityRuleSnapshot,
  sessionStartsAt: Date,
) {
  return memberships.filter((membership) => {
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
  classSessionId,
}: {
  rules: EligibilityRuleSnapshot[]
  memberships: MembershipEligibilitySnapshot[]
  creditAccounts: CreditAccountEligibilitySnapshot[]
  sessionStartsAt: Date
  classSessionId: string
}): ReservationEligibilityResult {
  const activeRules = sortEligibilityRules(rules.filter((rule) => rule.isActive))

  if (activeRules.length === 0) {
    return {
      eligible: false,
      code: 'NO_ACTIVE_RULE',
    }
  }

  let sawMembershipAllowanceExhausted = false

  for (const rule of activeRules) {
    const normalizedRuleType = normalizeEligibilityRuleType(rule.ruleType)

    if (normalizedRuleType === 'MEMBERSHIP_PLAN') {
      const candidateMemberships = selectEligibleMembershipsForRule(
        memberships,
        rule,
        sessionStartsAt,
      )

      for (const membership of candidateMemberships) {
        const membershipUsage = resolveMembershipUsageForSession({
          membership,
          rule,
          sessionStartsAt,
          classSessionId,
        })

        if (membershipUsage) {
          return {
            eligible: true,
            code: 'ELIGIBLE',
            usage: membershipUsage,
          }
        }

        if (hasPeriodicAllowancePolicy(membership)) {
          sawMembershipAllowanceExhausted = true
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
            bookingOverrideId: null,
            creditsUsed: Math.max(rule.creditCost ?? 0, 0),
          },
        }
      }
    }
  }

  return {
    eligible: false,
    code: sawMembershipAllowanceExhausted
      ? 'MEMBERSHIP_ALLOWANCE_EXHAUSTED'
      : 'NO_ELIGIBLE_ENTITLEMENT',
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
          : eligibility.code === 'MEMBERSHIP_ALLOWANCE_EXHAUSTED'
            ? 'Cupo agotado'
            : 'No puedes reservar ahora',
      description:
        eligibility.code === 'NO_ACTIVE_RULE'
          ? 'La clase todavía no tiene una regla de elegibilidad activa.'
          : eligibility.code === 'MEMBERSHIP_ALLOWANCE_EXHAUSTED'
            ? 'Has agotado el cupo de tu membresía para este periodo.'
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

function resolveMembershipUsageForSession({
  membership,
  rule,
  sessionStartsAt,
  classSessionId,
}: {
  membership: MembershipEligibilitySnapshot
  rule: EligibilityRuleSnapshot
  sessionStartsAt: Date
  classSessionId: string
}): ReservationEligibilityUsage | null {
  const policy = resolveMembershipBookingPolicy(membership)

  if (policy.policyType === 'UNLIMITED') {
    return {
      usageType: 'MEMBERSHIP',
      ruleId: rule.id,
      ruleType: 'MEMBERSHIP_PLAN',
      memberMembershipId: membership.id,
      memberCreditAccountId: null,
      bookingOverrideId: null,
      creditsUsed: null,
    }
  }

  const periodKey = buildMembershipBookingPeriodKey(sessionStartsAt, policy.periodType)
  const usedBookingsCount = membership.usages.filter((usage) => {
    if (usage.usageType !== 'MEMBERSHIP') {
      return false
    }

    if (!countsTowardMembershipAllowance(usage.reservation.status)) {
      return false
    }

    return (
      buildMembershipBookingPeriodKey(usage.reservation.classSession.startsAt, policy.periodType) ===
      periodKey
    )
  }).length

  const extraAllowance = membership.bookingOverrides.reduce((total, override) => {
    if (override.overrideType !== 'EXTRA_ALLOWANCE') {
      return total
    }

    if (!isActiveOverrideForSession(override, sessionStartsAt)) {
      return total
    }

    return total + Math.max(override.extraBookings ?? 0, 0)
  }, 0)

  if (usedBookingsCount < policy.allowanceCount + extraAllowance) {
    return {
      usageType: 'MEMBERSHIP',
      ruleId: rule.id,
      ruleType: 'MEMBERSHIP_PLAN',
      memberMembershipId: membership.id,
      memberCreditAccountId: null,
      bookingOverrideId: null,
      creditsUsed: null,
    }
  }

  const sessionOverride = membership.bookingOverrides.find((override) => {
    return (
      override.overrideType === 'SESSION_ACCESS' &&
      override.classSessionId === classSessionId &&
      isActiveOverrideForSession(override, sessionStartsAt)
    )
  })

  if (!sessionOverride) {
    return null
  }

  return {
    usageType: 'MANUAL_OVERRIDE',
    ruleId: rule.id,
    ruleType: 'MEMBERSHIP_PLAN',
    memberMembershipId: membership.id,
    memberCreditAccountId: null,
    bookingOverrideId: sessionOverride.id,
    creditsUsed: null,
  }
}

function hasPeriodicAllowancePolicy(membership: MembershipEligibilitySnapshot) {
  return resolveMembershipBookingPolicy(membership).policyType === 'PERIODIC_ALLOWANCE'
}

function resolveMembershipBookingPolicy(
  membership: MembershipEligibilitySnapshot,
){
  return resolveEffectiveMembershipBookingPolicy({
    explicitPolicy: membership.membershipPlan.bookingPolicy,
    legacyPolicyType: membership.membershipPlan.bookingPolicyType,
  })
}

function countsTowardMembershipAllowance(status: Reservation['status']) {
  return status === 'BOOKED' || status === 'ATTENDED' || status === 'NO_SHOW'
}

function isActiveOverrideForSession(
  override: MembershipBookingOverrideSnapshot,
  sessionStartsAt: Date,
) {
  if (override.revokedAt) {
    return false
  }

  return (
    override.startsAt.getTime() <= sessionStartsAt.getTime() &&
    override.expiresAt.getTime() >= sessionStartsAt.getTime()
  )
}

function getBusinessWeekMondayDate(date: Date) {
  const businessDate = getBusinessDateParts(date)
  const mondayDate = new Date(
    Date.UTC(businessDate.year, businessDate.month - 1, businessDate.day, 12, 0, 0),
  )
  const mondayIndex = WEEKDAY_TO_MONDAY_INDEX[businessDate.weekday] ?? 0
  mondayDate.setUTCDate(mondayDate.getUTCDate() - mondayIndex)
  return mondayDate
}

function getBusinessDateParts(date: Date) {
  const parts = mapParts(BUSINESS_DATE_PARTS_FORMATTER.formatToParts(date))

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
  }
}

function buildBusinessDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0))
  const firstOffset = getBusinessTimeZoneOffset(utcGuess)
  let actualDate = new Date(utcGuess.getTime() - firstOffset)
  const correctedOffset = getBusinessTimeZoneOffset(actualDate)

  if (correctedOffset !== firstOffset) {
    actualDate = new Date(utcGuess.getTime() - correctedOffset)
  }

  return actualDate
}

function getBusinessTimeZoneOffset(date: Date) {
  const parts = mapParts(BUSINESS_DATE_TIME_PARTS_FORMATTER.formatToParts(date))

  const asUtcTimestamp = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    0,
  )

  return asUtcTimestamp - date.getTime()
}

function mapParts(parts: Intl.DateTimeFormatPart[]) {
  return parts.reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value
    }

    return result
  }, {})
}

function padTwoDigits(value: number) {
  return String(value).padStart(2, '0')
}
