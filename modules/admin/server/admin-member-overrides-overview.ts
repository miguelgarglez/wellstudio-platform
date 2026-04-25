import { prisma } from '@/lib/db/prisma'
import { normalizeEmail } from '@/modules/auth/lib/normalize-email'
import { buildPlanWindowLabel } from '@/modules/members/server/member-commercial'
import { resolveEffectiveMembershipBookingPolicy } from '@/modules/reservations/server/membership-booking-policy'

const SEARCH_RESULTS_LIMIT = 12
const DEFAULT_MEMBER_RESULTS_LIMIT = 12
const OVERRIDE_HISTORY_LIMIT = 12
const SESSION_CANDIDATES_LIMIT = 8

type SearchMemberRecord = {
  id: string
  firstName: string
  lastName: string
  status: string
  user: {
    email: string
  }
  memberships: Array<{
    id: string
  }>
}

type MembershipRecord = {
  id: string
  status: string
  startsAt: Date
  endsAt: Date | null
  membershipPlan: {
    name: string
    bookingPolicyType: string | null
    bookingPolicy: {
      policyType: 'UNLIMITED' | 'PERIODIC_ALLOWANCE'
      periodType: 'CALENDAR_WEEK' | 'CALENDAR_MONTH' | null
      allowanceCount: number | null
    } | null
  }
}

type OverrideRecord = {
  id: string
  overrideType: 'EXTRA_ALLOWANCE' | 'SESSION_ACCESS'
  extraBookings: number | null
  startsAt: Date
  expiresAt: Date
  reason: string
  revokedAt: Date | null
  createdAt: Date
  memberMembership: {
    id: string
    membershipPlan: {
      name: string
    }
  }
  grantedByUser: ActorRecord
  revokedByUser: ActorRecord | null
  classSession: {
    id: string
    startsAt: Date
    endsAt: Date
    locationLabel: string | null
    classType: {
      name: string
    }
  } | null
}

type ActorRecord = {
  email: string
  member: {
    firstName: string
    lastName: string
  } | null
}

type SessionCandidateRecord = {
  id: string
  startsAt: Date
  endsAt: Date
  locationLabel: string | null
  classType: {
    name: string
  }
}

type RecentOverrideMemberRecord = {
  memberMembership: {
    member: SearchMemberRecord
  }
}

export type AdminMemberSearchResult = {
  id: string
  displayName: string
  email: string
  statusLabel: string
  activeMembershipCount: number
  contextLabel?: string
}

export type AdminMemberMembershipSummary = {
  id: string
  planName: string
  statusLabel: string
  windowLabel: string
  policySummaryLabel: string
  extraAllowanceEnabled: boolean
  extraAllowanceHint: string
}

export type AdminBookingOverrideItem = {
  id: string
  typeLabel: string
  typeTone: 'extra' | 'session'
  statusLabel: string
  statusTone: 'active' | 'revoked' | 'expired'
  summaryLabel: string
  reason: string
  membershipPlanName: string
  grantedAtLabel: string
  grantedByLabel: string
  windowLabel: string
  revokedAtLabel: string | null
  revokedByLabel: string | null
  canRevoke: boolean
}

export type AdminSessionAccessCandidate = {
  id: string
  label: string
  detailLabel: string
  className: string
  dateLabel: string
  timeLabel: string
  locationLabel: string
}

export type AdminSelectedMemberOverrideContext = {
  id: string
  displayName: string
  email: string
  statusLabel: string
  activeMembershipCount: number
  activeMemberships: AdminMemberMembershipSummary[]
  overrides: AdminBookingOverrideItem[]
  sessionCandidates: AdminSessionAccessCandidate[]
}

export type AdminMemberOverrideOverview = {
  query: string
  searchResults: AdminMemberSearchResult[]
  selectedMemberId: string | null
  selectedMembershipId: string | null
  selectedSessionId: string | null
  selectedMember: AdminSelectedMemberOverrideContext | null
  selectedMembership: AdminMemberMembershipSummary | null
  selectedSession: AdminSessionAccessCandidate | null
}

export async function getAdminMemberOverrideOverview(input: {
  query: string | null
  selectedMemberId: string | null
  selectedMembershipId: string | null
  selectedSessionId: string | null
}) {
  const now = new Date()
  const query = normalizeQuery(input.query)
  const searchResultsPromise = query
    ? getAdminMemberSearchResults(query)
    : getDefaultAdminMemberSearchResults()

  const selectedMemberPromise = input.selectedMemberId
    ? prisma.member.findUnique({
        where: {
          id: input.selectedMemberId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          user: {
            select: {
              email: true,
            },
          },
          memberships: {
            where: {
              status: 'ACTIVE',
            },
            orderBy: {
              startsAt: 'desc',
            },
            select: {
              id: true,
              status: true,
              startsAt: true,
              endsAt: true,
              membershipPlan: {
                select: {
                  name: true,
                  bookingPolicyType: true,
                  bookingPolicy: {
                    select: {
                      policyType: true,
                      periodType: true,
                      allowanceCount: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : Promise.resolve(null)

  const [searchResultRecords, selectedMemberRecord] = await Promise.all([
    searchResultsPromise,
    selectedMemberPromise,
  ])

  const searchResults = searchResultRecords.map(({ member, contextLabel }) =>
    buildAdminMemberSearchResult(member, contextLabel),
  )

  if (!selectedMemberRecord) {
    return {
      query,
      searchResults,
      selectedMemberId: null,
      selectedMembershipId: null,
      selectedSessionId: null,
      selectedMember: null,
      selectedMembership: null,
      selectedSession: null,
    } satisfies AdminMemberOverrideOverview
  }

  const [overrideRecords, sessionCandidateRecords] = await Promise.all([
    prisma.memberMembershipBookingOverride.findMany({
      where: {
        memberMembership: {
          memberId: selectedMemberRecord.id,
          status: 'ACTIVE',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: OVERRIDE_HISTORY_LIMIT,
      select: {
        id: true,
        overrideType: true,
        extraBookings: true,
        startsAt: true,
        expiresAt: true,
        reason: true,
        revokedAt: true,
        createdAt: true,
        memberMembership: {
          select: {
            id: true,
            membershipPlan: {
              select: {
                name: true,
              },
            },
          },
        },
        grantedByUser: {
          select: {
            email: true,
            member: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        revokedByUser: {
          select: {
            email: true,
            member: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        classSession: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            locationLabel: true,
            classType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    selectedMemberRecord.memberships.length > 0
      ? prisma.classSession.findMany({
          where: {
            status: 'PUBLISHED',
            publishedAt: {
              not: null,
            },
            startsAt: {
              gt: now,
            },
          },
          orderBy: {
            startsAt: 'asc',
          },
          take: SESSION_CANDIDATES_LIMIT,
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            locationLabel: true,
            classType: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const activeMemberships = selectedMemberRecord.memberships.map((membership) =>
    buildAdminMemberMembershipSummary(membership, now),
  )
  const overrides = overrideRecords.map((override) => buildAdminBookingOverrideItem(override, now))
  const sessionCandidates = sessionCandidateRecords.map((session) =>
    buildAdminSessionAccessCandidate(session, now),
  )
  const selectedMembership =
    activeMemberships.find((membership) => membership.id === input.selectedMembershipId) ?? null
  const selectedSession =
    sessionCandidates.find((session) => session.id === input.selectedSessionId) ?? null

  return {
    query,
    searchResults,
    selectedMemberId: selectedMemberRecord.id,
    selectedMembershipId: selectedMembership?.id ?? null,
    selectedSessionId: selectedSession?.id ?? null,
    selectedMember: {
      id: selectedMemberRecord.id,
      displayName: buildMemberDisplayName({
        firstName: selectedMemberRecord.firstName,
        lastName: selectedMemberRecord.lastName,
        email: selectedMemberRecord.user.email,
      }),
      email: selectedMemberRecord.user.email,
      statusLabel: formatMemberStatusLabel(selectedMemberRecord.status),
      activeMembershipCount: activeMemberships.length,
      activeMemberships,
      overrides,
      sessionCandidates,
    },
    selectedMembership,
    selectedSession,
  } satisfies AdminMemberOverrideOverview
}

type AdminMemberResultSource = {
  member: SearchMemberRecord
  contextLabel?: string
}

async function getAdminMemberSearchResults(query: string): Promise<AdminMemberResultSource[]> {
  const members = (await prisma.member.findMany({
    where: {
      OR: [
        {
          firstName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            normalizedEmail: {
              contains: normalizeEmail(query),
            },
          },
        },
      ],
    },
    take: SEARCH_RESULTS_LIMIT,
    orderBy: [
      {
        firstName: 'asc',
      },
      {
        lastName: 'asc',
      },
    ],
    select: adminMemberSearchResultSelect,
  })) as SearchMemberRecord[]

  return members.map((member) => ({ member }))
}

async function getDefaultAdminMemberSearchResults(): Promise<AdminMemberResultSource[]> {
  const [recentOverrides, activeMembers, recentlyUpdatedMembers] = await Promise.all([
    prisma.memberMembershipBookingOverride.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: DEFAULT_MEMBER_RESULTS_LIMIT,
      select: {
        memberMembership: {
          select: {
            member: {
              select: adminMemberSearchResultSelect,
            },
          },
        },
      },
    }) as Promise<RecentOverrideMemberRecord[]>,
    prisma.member.findMany({
      where: {
        memberships: {
          some: {
            status: 'ACTIVE',
          },
        },
      },
      take: DEFAULT_MEMBER_RESULTS_LIMIT,
      orderBy: {
        updatedAt: 'desc',
      },
      select: adminMemberSearchResultSelect,
    }) as Promise<SearchMemberRecord[]>,
    prisma.member.findMany({
      take: DEFAULT_MEMBER_RESULTS_LIMIT,
      orderBy: {
        updatedAt: 'desc',
      },
      select: adminMemberSearchResultSelect,
    }) as Promise<SearchMemberRecord[]>,
  ])

  return mergeDefaultMemberResultSources(
    recentOverrides,
    activeMembers,
    recentlyUpdatedMembers,
  )
}

export function mergeDefaultMemberResultSources(
  recentOverrides: RecentOverrideMemberRecord[],
  activeMembers: SearchMemberRecord[],
  recentlyUpdatedMembers: SearchMemberRecord[],
) {
  const results: AdminMemberResultSource[] = []
  const seenMemberIds = new Set<string>()

  function add(member: SearchMemberRecord, contextLabel: string) {
    if (seenMemberIds.has(member.id) || results.length >= DEFAULT_MEMBER_RESULTS_LIMIT) {
      return
    }

    seenMemberIds.add(member.id)
    results.push({ member, contextLabel })
  }

  for (const override of recentOverrides) {
    add(override.memberMembership.member, 'Excepción reciente')
  }

  for (const member of activeMembers) {
    add(member, 'Membership activa')
  }

  for (const member of recentlyUpdatedMembers) {
    add(member, 'Actividad reciente')
  }

  return results
}

const adminMemberSearchResultSelect = {
  id: true,
  firstName: true,
  lastName: true,
  status: true,
  user: {
    select: {
      email: true,
    },
  },
  memberships: {
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  },
} as const

export function buildAdminMemberSearchResult(
  member: SearchMemberRecord,
  contextLabel?: string,
) {
  return {
    id: member.id,
    displayName: buildMemberDisplayName({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.user.email,
    }),
    email: member.user.email,
    statusLabel: formatMemberStatusLabel(member.status),
    activeMembershipCount: member.memberships.length,
    contextLabel,
  } satisfies AdminMemberSearchResult
}

export function buildAdminMemberMembershipSummary(
  membership: MembershipRecord,
  now: Date,
) {
  const policy = resolveEffectiveMembershipBookingPolicy({
    explicitPolicy: membership.membershipPlan.bookingPolicy,
    legacyPolicyType: membership.membershipPlan.bookingPolicyType,
  })
  const extraAllowanceEnabled = policy.policyType === 'PERIODIC_ALLOWANCE'

  return {
    id: membership.id,
    planName: membership.membershipPlan.name,
    statusLabel: formatMembershipStatusLabel(membership.status),
    windowLabel: buildPlanWindowLabel(
      {
        status: membership.status as 'ACTIVE',
        startsAt: membership.startsAt,
        endsAt: membership.endsAt,
        membershipPlan: {
          name: membership.membershipPlan.name,
        },
      },
      now,
    ),
    policySummaryLabel: formatPolicySummaryLabel(policy),
    extraAllowanceEnabled,
    extraAllowanceHint: extraAllowanceEnabled
      ? 'La membership admite reservas extra dentro del periodo natural vigente.'
      : 'Esta membership no tiene política periódica. Desde aquí solo admite acceso puntual a sesión.',
  } satisfies AdminMemberMembershipSummary
}

export function buildAdminBookingOverrideItem(
  override: OverrideRecord,
  now: Date,
) {
  const isRevoked = Boolean(override.revokedAt)
  const isExpired = !isRevoked && override.expiresAt.getTime() < now.getTime()
  const statusTone = isRevoked ? 'revoked' : isExpired ? 'expired' : 'active'
  const dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    id: override.id,
    typeLabel: override.overrideType === 'EXTRA_ALLOWANCE' ? 'Reservas extra' : 'Acceso puntual',
    typeTone: override.overrideType === 'EXTRA_ALLOWANCE' ? 'extra' : 'session',
    statusLabel: isRevoked ? 'Revocado' : isExpired ? 'Expirado' : 'Vigente',
    statusTone,
    summaryLabel:
      override.overrideType === 'EXTRA_ALLOWANCE'
        ? `+${override.extraBookings ?? 0} reservas en el periodo actual`
        : override.classSession
          ? buildAdminSessionAccessCandidate(override.classSession, now).label
          : 'Sesión vinculada no disponible',
    reason: override.reason,
    membershipPlanName: override.memberMembership.membershipPlan.name,
    grantedAtLabel: dateTimeFormatter.format(override.createdAt),
    grantedByLabel: buildActorLabel(override.grantedByUser),
    windowLabel: `${dateTimeFormatter.format(override.startsAt)} → ${dateTimeFormatter.format(override.expiresAt)}`,
    revokedAtLabel: override.revokedAt ? dateTimeFormatter.format(override.revokedAt) : null,
    revokedByLabel: override.revokedByUser ? buildActorLabel(override.revokedByUser) : null,
    canRevoke: !isRevoked && !isExpired,
  } satisfies AdminBookingOverrideItem
}

export function buildAdminSessionAccessCandidate(
  session: SessionCandidateRecord,
  now: Date,
) {
  const timing = buildSessionTimingLabels(session, now)

  return {
    id: session.id,
    label: `${session.classType.name} · ${timing.dateLabel} · ${timing.timeLabel}`,
    detailLabel: session.locationLabel ?? 'Ubicación por confirmar',
    className: session.classType.name,
    dateLabel: timing.dateLabel,
    timeLabel: timing.timeLabel,
    locationLabel: session.locationLabel ?? 'Ubicación por confirmar',
  } satisfies AdminSessionAccessCandidate
}

function buildMemberDisplayName(input: {
  firstName: string
  lastName: string
  email: string
}) {
  return `${input.firstName} ${input.lastName}`.trim() || input.email
}

function buildActorLabel(actor: ActorRecord) {
  const displayName = actor.member
    ? `${actor.member.firstName} ${actor.member.lastName}`.trim()
    : ''

  return displayName || actor.email
}

function buildSessionTimingLabels(
  session: Pick<SessionCandidateRecord, 'startsAt' | 'endsAt'>,
  now: Date,
) {
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    dateLabel: buildRelativeDateLabel(session.startsAt, now, dateFormatter),
    timeLabel: `${timeFormatter.format(session.startsAt)} – ${timeFormatter.format(session.endsAt)}`,
  }
}

function buildRelativeDateLabel(
  startsAt: Date,
  now: Date,
  formatter: Intl.DateTimeFormat,
) {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfTarget = new Date(startsAt)
  startOfTarget.setHours(0, 0, 0, 0)

  const differenceInDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (differenceInDays === 0) {
    return 'Hoy'
  }

  if (differenceInDays === 1) {
    return 'Mañana'
  }

  return capitalizeLabel(formatter.format(startsAt))
}

function formatMemberStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Activo'
    case 'INACTIVE':
      return 'Inactivo'
    case 'BLOCKED':
      return 'Bloqueado'
    case 'LEAD_CONVERTED':
      return 'Lead convertido'
    default:
      return 'Socio'
  }
}

function formatMembershipStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Activa'
    case 'PENDING_ACTIVATION':
      return 'Pendiente'
    case 'PAUSED':
      return 'Pausada'
    case 'EXPIRED':
      return 'Expirada'
    case 'CANCELED':
      return 'Cancelada'
    default:
      return 'Membership'
  }
}

function formatPolicySummaryLabel(
  policy: ReturnType<typeof resolveEffectiveMembershipBookingPolicy>,
) {
  if (policy.policyType === 'UNLIMITED') {
    return 'Ilimitada'
  }

  return policy.periodType === 'CALENDAR_WEEK'
    ? `${policy.allowanceCount} / semana`
    : `${policy.allowanceCount} / mes`
}

function normalizeQuery(query: string | null) {
  return query?.trim() ?? ''
}

function capitalizeLabel(value: string) {
  if (value.length === 0) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}
