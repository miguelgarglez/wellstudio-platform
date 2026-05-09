import { cache } from 'react'
import type {
  ClassTypeEligibilityRule,
  ClassSession,
  MemberCreditAccount,
  MemberMembership,
  Reservation,
  WaitlistEntry,
} from '@prisma/client'
import {
  buildMembershipPolicyUsageSearchWindow,
  buildCancellationWindow,
  buildSchedulePrimaryAction,
  evaluateReservationEligibilityFromSnapshots,
  type CreditAccountEligibilitySnapshot,
  type MembershipEligibilitySnapshot,
  type ReservationSchedulePrimaryAction,
} from '@/modules/reservations/server/reservation-eligibility'
import {
  calculateCreditsRemaining,
  selectCurrentMembership,
  selectPendingMembership,
} from '@/modules/members/server/member-commercial'

type ReservationWithSession = Reservation & {
  classSession: {
    startsAt: Date
    endsAt: Date
    locationLabel: string | null
    capacity: number
    reservedCount: number
    waitlistEnabled: boolean
    classType: {
      name: string
    }
    coach: {
      displayName: string
    } | null
  }
}

type WaitlistWithSession = WaitlistEntry & {
  classSession: {
    startsAt: Date
    endsAt: Date
    locationLabel: string | null
    capacity: number
    reservedCount: number
    waitlistEnabled: boolean
    classType: {
      name: string
    }
    coach: {
      displayName: string
    } | null
  }
}

type MembershipWithPlan = MemberMembership & {
  membershipPlan: {
    name: string
    bookingPolicyType: string | null
    bookingPolicy: {
      policyType: 'UNLIMITED' | 'PERIODIC_ALLOWANCE'
      periodType: 'CALENDAR_WEEK' | 'CALENDAR_MONTH' | null
      allowanceCount: number | null
    } | null
  }
  bookingOverrides: MembershipEligibilitySnapshot['bookingOverrides']
  usages: MembershipEligibilitySnapshot['usages']
}

type CreditAccountWithSnapshot = MemberCreditAccount & {
  creditPack: {
    name: string
    creditsTotal: number
  }
  ledgerEntries: Array<{
    balanceAfter: number
  }>
}

type PublishedSession = Pick<
  ClassSession,
  | 'id'
  | 'startsAt'
  | 'endsAt'
  | 'locationLabel'
  | 'capacity'
  | 'reservedCount'
  | 'waitlistEnabled'
  | 'status'
> & {
  classType: {
    name: string
    eligibilityRules: Array<
      Pick<
        ClassTypeEligibilityRule,
        | 'id'
        | 'ruleType'
        | 'membershipPlanId'
        | 'creditCost'
        | 'priority'
        | 'createdAt'
        | 'isActive'
      >
    >
  }
  coach: {
    displayName: string
  } | null
}

export type ReservationActionTone = 'allowed' | 'blocked' | 'neutral'

export type MemberBookingStateReason = 'ready' | 'no-entitlement' | 'pending-plan'

export type MemberBookingState = {
  canBook: boolean
  reason: MemberBookingStateReason
  advisoryLabel: string
  description: string
}

export type UpcomingReservationRow = {
  id: string
  classSessionId: string
  className: string
  coachName: string | null
  dateLabel: string
  timeLabel: string
  locationLabel: string | null
  availabilityLabel: string
  cancellationLabel: string
  cancellationTone: ReservationActionTone
  canCancel: boolean
  confirmCopy: string
}

export type WaitlistReservationRow = {
  id: string
  classSessionId: string
  className: string
  coachName: string | null
  dateLabel: string
  timeLabel: string
  locationLabel: string | null
  availabilityLabel: string
  positionLabel: string | null
  canLeave: boolean
  confirmCopy: string
}

export type ReservationHistoryRow = {
  id: string
  className: string
  coachName: string | null
  dateLabel: string
  timeLabel: string
  locationLabel: string | null
  statusLabel: string
  statusTone: ReservationActionTone
}

export type SchedulePreviewSession = {
  id: string
  className: string
  coachName: string | null
  timeLabel: string
  locationLabel: string | null
  availabilityLabel: string
  framingLabel: string
  primaryAction: ReservationSchedulePrimaryAction
}

export type SchedulePreviewDay = {
  id: string
  dateLabel: string
  sessions: SchedulePreviewSession[]
}

export type MemberReservationsOverview = {
  introTitle: string
  introDescription: string
  summaryLabels: string[]
  bookingState: MemberBookingState
  upcomingReservations: UpcomingReservationRow[]
  activeWaitlists: WaitlistReservationRow[]
  recentHistory: ReservationHistoryRow[]
  schedulePreview: SchedulePreviewDay[]
}

export const getMemberReservationsOverview = cache(
  async (): Promise<MemberReservationsOverview> => {
    const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
    const authContext = await requireAuthenticatedContext()
    const { prisma } = await import('@/lib/db/prisma')
    const memberId = authContext.member?.id

    if (!memberId) {
      throw new Error('Authenticated member required for reservations overview')
    }

    const now = new Date()

    const [upcomingReservations, activeWaitlists, recentHistory, publishedSessions, creditAccounts] =
      await prisma.$transaction([
      prisma.reservation.findMany({
        where: {
          memberId,
          status: 'BOOKED',
          classSession: {
            startsAt: {
              gte: now,
            },
          },
        },
        include: {
          classSession: {
            select: {
              startsAt: true,
              endsAt: true,
              locationLabel: true,
              capacity: true,
              reservedCount: true,
              waitlistEnabled: true,
              classType: {
                select: {
                  name: true,
                },
              },
              coach: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          classSession: {
            startsAt: 'asc',
          },
        },
        take: 6,
      }),
      prisma.waitlistEntry.findMany({
        where: {
          memberId,
          status: {
            in: ['WAITING', 'NOTIFIED'],
          },
          classSession: {
            startsAt: {
              gte: now,
            },
          },
        },
        include: {
          classSession: {
            select: {
              startsAt: true,
              endsAt: true,
              locationLabel: true,
              capacity: true,
              reservedCount: true,
              waitlistEnabled: true,
              classType: {
                select: {
                  name: true,
                },
              },
              coach: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          classSession: {
            startsAt: 'asc',
          },
        },
        take: 3,
      }),
      prisma.reservation.findMany({
        where: {
          memberId,
          status: {
            in: ['ATTENDED', 'CANCELED', 'NO_SHOW'],
          },
        },
        include: {
          classSession: {
            select: {
              startsAt: true,
              endsAt: true,
              locationLabel: true,
              capacity: true,
              reservedCount: true,
              waitlistEnabled: true,
              classType: {
                select: {
                  name: true,
                },
              },
              coach: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 6,
      }),
      prisma.classSession.findMany({
        where: {
          status: 'PUBLISHED',
          startsAt: {
            gte: now,
          },
        },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          locationLabel: true,
          capacity: true,
          reservedCount: true,
          waitlistEnabled: true,
          status: true,
          classType: {
            select: {
              name: true,
              eligibilityRules: {
                where: {
                  isActive: true,
                },
                select: {
                  id: true,
                  ruleType: true,
                  membershipPlanId: true,
                  creditCost: true,
                  priority: true,
                  createdAt: true,
                  isActive: true,
                },
              },
            },
          },
          coach: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
        take: 8,
      }),
      prisma.memberCreditAccount.findMany({
        where: {
          memberId,
          status: 'ACTIVE',
        },
        include: {
          creditPack: {
            select: {
              name: true,
              creditsTotal: true,
            },
          },
          ledgerEntries: {
            select: {
              balanceAfter: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          openedAt: 'desc',
        },
      }),
    ])

    const membershipUsageWindow = buildMembershipPolicyUsageSearchWindow({
      earliestSessionStartsAt: publishedSessions[0]?.startsAt ?? now,
      latestSessionStartsAt:
        publishedSessions[publishedSessions.length - 1]?.startsAt ?? now,
    })

    const memberships = await prisma.memberMembership.findMany({
      where: {
        memberId,
        status: {
          in: ['ACTIVE', 'PENDING_ACTIVATION'],
        },
      },
      select: {
        id: true,
        memberId: true,
        membershipPlanId: true,
        status: true,
        startsAt: true,
        endsAt: true,
        autoRenews: true,
        providerSubscriptionId: true,
        paymentId: true,
        createdAt: true,
        updatedAt: true,
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
        bookingOverrides: {
          where: {
            revokedAt: null,
            expiresAt: {
              gte: membershipUsageWindow.startsAtGte,
            },
            startsAt: {
              lte: membershipUsageWindow.startsAtLte,
            },
          },
          select: {
            id: true,
            overrideType: true,
            classSessionId: true,
            extraBookings: true,
            startsAt: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
        usages: {
          where: {
            usageType: {
              in: ['MEMBERSHIP', 'MANUAL_OVERRIDE'],
            },
            reservation: {
              classSession: {
                startsAt: {
                  gte: membershipUsageWindow.startsAtGte,
                  lte: membershipUsageWindow.startsAtLte,
                },
              },
            },
          },
          select: {
            usageType: true,
            bookingOverrideId: true,
            reservation: {
              select: {
                status: true,
                classSession: {
                  select: {
                    id: true,
                    startsAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    })

    return buildMemberReservationsOverview({
      upcomingReservations,
      activeWaitlists,
      recentHistory,
      publishedSessions,
      memberships,
      creditAccounts,
      now,
    })
  },
)

type BuildMemberReservationsOverviewInput = {
  upcomingReservations: ReservationWithSession[]
  activeWaitlists: WaitlistWithSession[]
  recentHistory: ReservationWithSession[]
  publishedSessions: PublishedSession[]
  memberships: MembershipWithPlan[]
  creditAccounts: CreditAccountWithSnapshot[]
  now: Date
}

export function buildMemberReservationsOverview({
  upcomingReservations,
  activeWaitlists,
  recentHistory,
  publishedSessions,
  memberships,
  creditAccounts,
  now,
}: BuildMemberReservationsOverviewInput): MemberReservationsOverview {
  const currentMembership = selectCurrentMembership(memberships)
  const pendingMembership = selectPendingMembership(memberships)
  const creditsRemaining = calculateCreditsRemaining(creditAccounts)
  const bookingState = buildMemberBookingState({
    currentMembershipName: currentMembership?.membershipPlan.name ?? null,
    pendingMembershipName: pendingMembership?.membershipPlan.name ?? null,
    creditsRemaining,
  })

  const bookedSessionIds = new Set(upcomingReservations.map((reservation) => reservation.classSessionId))
  const waitlistedSessionIds = new Set(activeWaitlists.map((entry) => entry.classSessionId))

  const upcomingRows = upcomingReservations.map((reservation) => mapUpcomingReservationRow(reservation, now))

  const waitlistRows = activeWaitlists.map((entry) => mapWaitlistRow(entry, now))
  const historyRows = recentHistory.map((reservation) => mapHistoryRow(reservation, now))
  const scheduleDays = groupSchedulePreviewByDay(
    publishedSessions,
    {
      memberships,
      creditAccounts,
      bookedSessionIds,
      waitlistedSessionIds,
    },
    now,
  )

  return {
    introTitle: 'Centro operativo',
    introDescription:
      'Aquí se concentra tu movimiento real dentro de la agenda: reservas confirmadas, waitlists activas, sesiones publicadas e historial reciente, todo ya preparado para actuar desde el portal.',
    summaryLabels: buildSummaryLabels({
      upcomingCount: upcomingRows.length,
      waitlistCount: waitlistRows.length,
      scheduleCount: publishedSessions.length,
    }),
    bookingState,
    upcomingReservations: upcomingRows,
    activeWaitlists: waitlistRows,
    recentHistory: historyRows,
    schedulePreview: scheduleDays,
  }
}

export function buildMemberBookingState({
  currentMembershipName,
  pendingMembershipName,
  creditsRemaining,
}: {
  currentMembershipName: string | null
  pendingMembershipName: string | null
  creditsRemaining: number
}): MemberBookingState {
  if (currentMembershipName || creditsRemaining > 0) {
    return {
      canBook: true,
      reason: 'ready',
      advisoryLabel: 'Con capacidad operativa para reservar',
      description:
        currentMembershipName && creditsRemaining > 0
          ? `Tienes ${currentMembershipName} activo y ${creditsRemaining} créditos disponibles como respaldo.`
          : currentMembershipName
            ? `Tu plan ${currentMembershipName} ya está activo para moverte por la agenda.`
            : `Tienes ${creditsRemaining} créditos disponibles para cuando entren las acciones reales de reserva.`,
    }
  }

  if (pendingMembershipName) {
    return {
      canBook: false,
      reason: 'pending-plan',
      advisoryLabel: 'Plan pendiente de activación',
      description: `${pendingMembershipName} todavía no está activo. En cuanto se active, esta agenda pasará de seguimiento a operativa.`,
    }
  }

  return {
    canBook: false,
    reason: 'no-entitlement',
    advisoryLabel: 'Sin plan ni créditos activos',
    description:
      'Puedes consultar la agenda y tu actividad reciente, pero para reservar necesitarás una membresía activa o créditos disponibles.',
  }
}

export function buildCancellationStatus(startsAt: Date, now: Date): {
  label: string
  tone: ReservationActionTone
} {
  const { canCancel, cutoffAt } = buildCancellationWindow({
    startsAt,
    now,
  })
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  if (canCancel) {
    const sameDay = startsAt.toDateString() === cutoffAt.toDateString()
    return {
      label: sameDay
        ? `Cancelable hasta las ${timeFormatter.format(cutoffAt)}`
        : `Cancelable hasta ${dateFormatter.format(cutoffAt)} · ${timeFormatter.format(cutoffAt)}`,
      tone: 'allowed',
    }
  }

  return {
    label: 'Fuera de ventana de cancelación',
    tone: 'blocked',
  }
}

export function buildScheduleAvailability({
  capacity,
  reservedCount,
  waitlistEnabled,
}: {
  capacity: number
  reservedCount: number
  waitlistEnabled: boolean
}) {
  const remaining = Math.max(capacity - reservedCount, 0)

  if (remaining > 0) {
    return {
      availabilityLabel:
        remaining === 1 ? '1 plaza libre' : `${remaining} plazas libres`,
      framingLabel: 'Reserva próximamente',
    }
  }

  if (waitlistEnabled) {
    return {
      availabilityLabel: 'Clase completa',
      framingLabel: 'Waitlist disponible si se llena',
    }
  }

  return {
    availabilityLabel: 'Clase completa',
    framingLabel: 'Sin waitlist disponible',
  }
}

export function buildHistoryStatus(status: Reservation['status']): {
  label: string
  tone: ReservationActionTone
} {
  switch (status) {
    case 'ATTENDED':
      return {
        label: 'Asistida',
        tone: 'allowed',
      }
    case 'NO_SHOW':
      return {
        label: 'No asististe',
        tone: 'blocked',
      }
    case 'CANCELED':
    default:
      return {
        label: 'Cancelada',
        tone: 'neutral',
      }
  }
}

function buildSummaryLabels({
  upcomingCount,
  waitlistCount,
  scheduleCount,
}: {
  upcomingCount: number
  waitlistCount: number
  scheduleCount: number
}) {
  const labels = [
    upcomingCount === 0
      ? 'Sin reservas próximas'
      : upcomingCount === 1
        ? '1 reserva próxima'
        : `${upcomingCount} reservas próximas`,
    scheduleCount === 0
      ? 'Sin sesiones publicadas'
      : scheduleCount === 1
        ? '1 sesión publicada'
        : `${scheduleCount} sesiones publicadas`,
  ]

  if (waitlistCount > 0) {
    labels.push(waitlistCount === 1 ? '1 waitlist activa' : `${waitlistCount} waitlists activas`)
  }

  return labels
}

function mapUpcomingReservationRow(
  reservation: ReservationWithSession,
  now: Date,
): UpcomingReservationRow {
  const sessionSnapshot = mapSessionTiming(reservation.classSession, now)
  const cancellation = buildCancellationStatus(reservation.classSession.startsAt, now)
  const { canCancel } = buildCancellationWindow({
    startsAt: reservation.classSession.startsAt,
    now,
  })

  return {
    id: reservation.id,
    classSessionId: reservation.classSessionId,
    className: reservation.classSession.classType.name,
    coachName: reservation.classSession.coach?.displayName ?? null,
    dateLabel: sessionSnapshot.dateLabel,
    timeLabel: sessionSnapshot.timeLabel,
    locationLabel: reservation.classSession.locationLabel,
    availabilityLabel: buildScheduleAvailability({
      capacity: reservation.classSession.capacity,
      reservedCount: reservation.classSession.reservedCount,
      waitlistEnabled: reservation.classSession.waitlistEnabled,
    }).availabilityLabel,
    cancellationLabel: cancellation.label,
    cancellationTone: cancellation.tone,
    canCancel,
    confirmCopy: canCancel
      ? `Cancelarás tu reserva de ${reservation.classSession.classType.name} del ${sessionSnapshot.dateLabel.toLowerCase()} a las ${sessionSnapshot.timeLabel.split(' – ')[0]}.`
      : 'La ventana de cancelación ya está cerrada para esta reserva.',
  }
}

function mapWaitlistRow(
  entry: WaitlistWithSession,
  now: Date,
): WaitlistReservationRow {
  const sessionSnapshot = mapSessionTiming(entry.classSession, now)
  const availability = buildScheduleAvailability({
    capacity: entry.classSession.capacity,
    reservedCount: entry.classSession.reservedCount,
    waitlistEnabled: entry.classSession.waitlistEnabled,
  })

  return {
    id: entry.id,
    classSessionId: entry.classSessionId,
    className: entry.classSession.classType.name,
    coachName: entry.classSession.coach?.displayName ?? null,
    dateLabel: sessionSnapshot.dateLabel,
    timeLabel: sessionSnapshot.timeLabel,
    locationLabel: entry.classSession.locationLabel,
    availabilityLabel: availability.framingLabel,
    positionLabel: entry.position ? `Posición ${entry.position}` : null,
    canLeave: true,
    confirmCopy: `Saldrás de la waitlist de ${entry.classSession.classType.name} del ${sessionSnapshot.dateLabel.toLowerCase()} a las ${sessionSnapshot.timeLabel.split(' – ')[0]}.`,
  }
}

function mapHistoryRow(
  reservation: ReservationWithSession,
  now: Date,
): ReservationHistoryRow {
  const sessionSnapshot = mapSessionTiming(reservation.classSession, now)
  const history = buildHistoryStatus(reservation.status)

  return {
    id: reservation.id,
    className: reservation.classSession.classType.name,
    coachName: reservation.classSession.coach?.displayName ?? null,
    dateLabel: sessionSnapshot.dateLabel,
    timeLabel: sessionSnapshot.timeLabel,
    locationLabel: reservation.classSession.locationLabel,
    statusLabel: history.label,
    statusTone: history.tone,
  }
}

function groupSchedulePreviewByDay(
  sessions: PublishedSession[],
  eligibilityContext: {
    memberships: MembershipEligibilitySnapshot[]
    creditAccounts: CreditAccountEligibilitySnapshot[]
    bookedSessionIds: Set<string>
    waitlistedSessionIds: Set<string>
  },
  now: Date,
): SchedulePreviewDay[] {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const groups = new Map<string, SchedulePreviewDay>()

  for (const session of sessions) {
    const dateLabel = buildRelativeDateLabel(session.startsAt, now, formatter)
    const dayKey = `${session.startsAt.toISOString().slice(0, 10)}:${dateLabel}`
    const availability = buildScheduleAvailability({
      capacity: session.capacity,
      reservedCount: session.reservedCount,
      waitlistEnabled: session.waitlistEnabled,
    })
    const eligibility = evaluateReservationEligibilityFromSnapshots({
      rules: session.classType.eligibilityRules,
      memberships: eligibilityContext.memberships,
      creditAccounts: eligibilityContext.creditAccounts,
      sessionStartsAt: session.startsAt,
      classSessionId: session.id,
    })
    const primaryAction = buildSchedulePrimaryAction({
      isAlreadyBooked: eligibilityContext.bookedSessionIds.has(session.id),
      isAlreadyWaitlisted: eligibilityContext.waitlistedSessionIds.has(session.id),
      isFull: session.reservedCount >= session.capacity,
      waitlistEnabled: session.waitlistEnabled,
      eligibility,
    })

    if (!groups.has(dayKey)) {
      groups.set(dayKey, {
        id: dayKey,
        dateLabel,
        sessions: [],
      })
    }

    groups.get(dayKey)?.sessions.push({
      id: session.id,
      className: session.classType.name,
      coachName: session.coach?.displayName ?? null,
      timeLabel: `${timeFormatter.format(session.startsAt)} – ${timeFormatter.format(session.endsAt)}`,
      locationLabel: session.locationLabel,
      availabilityLabel: availability.availabilityLabel,
      framingLabel: availability.framingLabel,
      primaryAction,
    })
  }

  return [...groups.values()]
}

function mapSessionTiming(
  session: Pick<PublishedSession, 'startsAt' | 'endsAt'>,
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

  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) {
    return 'Hoy'
  }

  if (diffDays === 1) {
    return 'Mañana'
  }

  return formatter.format(startsAt)
}
