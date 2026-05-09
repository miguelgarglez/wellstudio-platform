import { cache } from 'react'
import type {
  Card,
  MemberCreditAccount,
  MemberMembership,
  Reservation,
  WaitlistEntry,
} from '@prisma/client'

import type { AuthContext } from '@/modules/auth/server/identity'
import {
  buildMemberShellSummary,
  type MemberShellSummary,
} from '@/modules/members/server/member-shell-summary'
import {
  buildPlanWindowLabel,
  calculateCreditsRemaining,
  formatCardLabel,
  selectCurrentMembership,
  selectPendingMembership,
  selectPrimaryCard,
} from '@/modules/members/server/member-commercial'

type ReservationWithSession = Reservation & {
  classSession: {
    startsAt: Date
    endsAt: Date
    locationLabel: string | null
    capacity: number
    reservedCount: number
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
  }
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

export type UpcomingReservationItem = {
  id: string
  className: string
  coachName: string | null
  dateLabel: string
  timeLabel: string
  locationLabel: string | null
  availabilityLabel: string
}

export type WaitlistSnapshotItem = UpcomingReservationItem & {
  positionLabel: string | null
}

export type MemberCommercialSnapshot = {
  currentPlanName: string | null
  currentPlanWindowLabel: string | null
  pendingPlanName: string | null
  creditsRemaining: number
  creditsLabel: string
  creditsPackNames: string[]
  hasLinkedCard: boolean
  linkedCardLabel: string
}

export type MemberHomeAlert = {
  kind: 'no-entitlement' | 'active-waitlist' | 'no-card'
  title: string
  description: string
}

export type MemberHomeOverview = {
  summary: MemberShellSummary
  introTitle: string
  introDescription: string
  activitySummaryLabel: string
  primaryActionLabel: string
  primaryActionHref: '/app/reservations'
  upcomingReservations: UpcomingReservationItem[]
  waitlists: WaitlistSnapshotItem[]
  commercial: MemberCommercialSnapshot
  alerts: MemberHomeAlert[]
}

export const getMemberHomeOverview = cache(async (): Promise<MemberHomeOverview> => {
  const { requireAuthenticatedContext } = await import('@/modules/auth/server/identity')
  const authContext = await requireAuthenticatedContext()
  const { prisma } = await import('@/lib/db/prisma')
  const memberId = authContext.member?.id

  if (!memberId) {
    throw new Error('Authenticated member required for member home overview')
  }

  const now = new Date()

  const [upcomingReservations, waitlists, memberships, creditAccounts, cards] =
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
        take: 2,
      }),
      prisma.memberMembership.findMany({
        where: {
          memberId,
          status: {
            in: ['ACTIVE', 'PENDING_ACTIVATION'],
          },
        },
        include: {
          membershipPlan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startsAt: 'desc',
        },
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
      prisma.card.findMany({
        where: {
          memberId,
          status: 'ACTIVE',
        },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      }),
    ])

  return buildMemberHomeOverview({
    authContext,
    upcomingReservations,
    waitlists,
    memberships,
    creditAccounts,
    cards,
    now,
  })
})

type BuildMemberHomeOverviewInput = {
  authContext: Extract<AuthContext, { isAuthenticated: true }>
  upcomingReservations: ReservationWithSession[]
  waitlists: WaitlistWithSession[]
  memberships: MembershipWithPlan[]
  creditAccounts: CreditAccountWithSnapshot[]
  cards: Card[]
  now: Date
}

export function buildMemberHomeOverview({
  authContext,
  upcomingReservations,
  waitlists,
  memberships,
  creditAccounts,
  cards,
  now,
}: BuildMemberHomeOverviewInput): MemberHomeOverview {
  const summary = buildMemberShellSummary(authContext)
  const currentPlan = selectCurrentMembership(memberships)
  const pendingPlan = selectPendingMembership(memberships)
  const creditsRemaining = calculateCreditsRemaining(creditAccounts)
  const primaryCard = selectPrimaryCard(cards)
  const alerts = buildMemberHomeAlerts({
    hasActiveEntitlement: Boolean(currentPlan) || creditsRemaining > 0,
    hasActiveWaitlist: waitlists.length > 0,
    hasLinkedCard: Boolean(primaryCard),
  })

  return {
    summary,
    introTitle: 'Bienvenido de nuevo',
    introDescription:
      upcomingReservations.length > 0
        ? 'Tu home privada ya prioriza lo importante: próximas sesiones, waitlists activas y el estado comercial básico para que recuperes contexto rápido.'
        : 'Tu home privada ya prioriza reservas y estado comercial básico. Cuando empieces a moverte por la agenda, aquí tendrás el resumen más útil para volver rápido a tu rutina.',
    activitySummaryLabel: buildActivitySummaryLabel({
      reservationsCount: upcomingReservations.length,
      waitlistsCount: waitlists.length,
    }),
    primaryActionLabel: upcomingReservations.length > 0 ? 'Ver agenda privada' : 'Explorar reservas',
    primaryActionHref: '/app/reservations',
    upcomingReservations: upcomingReservations.map((reservation) =>
      mapSessionSnapshot(reservation, now),
    ),
    waitlists: waitlists.map((entry) => ({
      ...mapSessionSnapshot(entry, now),
      positionLabel: entry.position ? `Posición ${entry.position}` : null,
    })),
    commercial: {
      currentPlanName: currentPlan?.membershipPlan.name ?? null,
      currentPlanWindowLabel: currentPlan ? buildPlanWindowLabel(currentPlan, now) : null,
      pendingPlanName: pendingPlan?.membershipPlan.name ?? null,
      creditsRemaining,
      creditsLabel: creditsRemaining > 0 ? `${creditsRemaining} créditos disponibles` : 'Sin créditos disponibles',
      creditsPackNames: [...new Set(creditAccounts.map((account) => account.creditPack.name))],
      hasLinkedCard: Boolean(primaryCard),
      linkedCardLabel: primaryCard ? formatCardLabel(primaryCard) : 'Sin tarjeta vinculada',
    },
    alerts,
  }
}

export function buildMemberHomeAlerts({
  hasActiveEntitlement,
  hasActiveWaitlist,
  hasLinkedCard,
}: {
  hasActiveEntitlement: boolean
  hasActiveWaitlist: boolean
  hasLinkedCard: boolean
}): MemberHomeAlert[] {
  const alerts: MemberHomeAlert[] = []

  if (!hasActiveEntitlement) {
    alerts.push({
      kind: 'no-entitlement',
      title: 'Sin plan ni créditos activos',
      description:
        'Tu cuenta ya está lista, pero ahora mismo no detectamos membresía activa ni créditos disponibles para reservar con normalidad.',
    })
  }

  if (hasActiveWaitlist) {
    alerts.push({
      kind: 'active-waitlist',
      title: 'Tienes una waitlist en seguimiento',
      description:
        'Mantén vigiladas tus próximas clases: si se libera una plaza, esta home te ayudará a recuperar contexto rápido.',
    })
  }

  if (!hasLinkedCard) {
    alerts.push({
      kind: 'no-card',
      title: 'Aún no hay tarjeta vinculada',
      description:
        'Cuando activemos la capa comercial completa, aquí podrás revisar el estado de tu método de pago sin salir del portal.',
    })
  }

  return alerts
}

function buildActivitySummaryLabel({
  reservationsCount,
  waitlistsCount,
}: {
  reservationsCount: number
  waitlistsCount: number
}) {
  const reservationsLabel =
    reservationsCount === 0
      ? 'Sin reservas próximas'
      : reservationsCount === 1
        ? '1 reserva próxima'
        : `${reservationsCount} reservas próximas`

  if (waitlistsCount === 0) {
    return reservationsLabel
  }

  const waitlistLabel =
    waitlistsCount === 1 ? '1 waitlist activa' : `${waitlistsCount} waitlists activas`

  return `${reservationsLabel} · ${waitlistLabel}`
}

function mapSessionSnapshot(
  entry: ReservationWithSession | WaitlistWithSession,
  now: Date,
): UpcomingReservationItem {
  const startsAt = entry.classSession.startsAt
  const endsAt = entry.classSession.endsAt
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
    id: entry.id,
    className: entry.classSession.classType.name,
    coachName: entry.classSession.coach?.displayName ?? null,
    dateLabel: buildRelativeDateLabel(startsAt, now, dateFormatter),
    timeLabel: `${timeFormatter.format(startsAt)} – ${timeFormatter.format(endsAt)}`,
    locationLabel: entry.classSession.locationLabel,
    availabilityLabel: buildAvailabilityLabel(
      entry.classSession.capacity,
      entry.classSession.reservedCount,
    ),
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

function buildAvailabilityLabel(capacity: number, reservedCount: number) {
  const remaining = Math.max(capacity - reservedCount, 0)
  return `${remaining} plazas disponibles`
}
