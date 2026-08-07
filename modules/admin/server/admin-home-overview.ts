import { prisma } from '@/lib/db/prisma'

const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'
const HOME_LIST_LIMIT = 4

type AdminHomeSessionRecord = {
  id: string
  startsAt: Date
  capacity: number
  reservedCount: number
  status: string
  classType: { name: string }
  coach: { displayName: string } | null
  _count: { reservations: number }
}

type AdminHomeLeadRecord = {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  createdAt: Date
}

export type AdminHomeOverview = Awaited<ReturnType<typeof getAdminHomeOverview>>

export async function getAdminHomeOverview(input: { now?: Date } = {}) {
  const now = input.now ?? new Date()
  const { start, end } = getBusinessDayRange(now)

  const [
    sessions,
    newLeadCount,
    pendingLeads,
    uncoveredMemberCount,
    blockedMemberCount,
    legacyRuleCount,
    activeExceptionCount,
  ] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        startsAt: { gte: start, lt: end },
        status: { not: 'CANCELED' },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        startsAt: true,
        capacity: true,
        reservedCount: true,
        status: true,
        classType: { select: { name: true } },
        coach: { select: { displayName: true } },
        _count: {
          select: {
            reservations: {
              where: {
                status: { in: ['BOOKED', 'ATTENDED', 'NO_SHOW'] },
                attendanceStatus: 'PENDING',
              },
            },
          },
        },
      },
    }),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.findMany({
      where: { status: 'NEW' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: HOME_LIST_LIMIT,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    }),
    prisma.member.count({
      where: {
        status: 'ACTIVE',
        memberships: {
          none: {
            status: 'ACTIVE',
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
        },
        creditAccounts: {
          none: {
            status: 'ACTIVE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    }),
    prisma.member.count({ where: { status: 'BLOCKED' } }),
    prisma.membershipPlan.count({
      where: {
        status: 'ACTIVE',
        bookingPolicy: null,
      },
    }),
    prisma.memberMembershipBookingOverride.count({
      where: {
        revokedAt: null,
        startsAt: { lte: now },
        expiresAt: { gt: now },
        memberMembership: {
          status: 'ACTIVE',
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      },
    }),
  ])

  return buildAdminHomeOverview({
    now,
    sessions,
    newLeadCount,
    pendingLeads,
    uncoveredMemberCount,
    blockedMemberCount,
    legacyRuleCount,
    activeExceptionCount,
  })
}

export function buildAdminHomeOverview(input: {
  now: Date
  sessions: AdminHomeSessionRecord[]
  newLeadCount: number
  pendingLeads: AdminHomeLeadRecord[]
  uncoveredMemberCount: number
  blockedMemberCount: number
  legacyRuleCount: number
  activeExceptionCount: number
}) {
  const reservedCount = input.sessions.reduce((total, session) => total + session.reservedCount, 0)
  const capacity = input.sessions.reduce((total, session) => total + session.capacity, 0)
  const pendingAttendanceCount = input.sessions.reduce(
    (total, session) => total + session._count.reservations,
    0,
  )

  return {
    dateLabel: capitalize(new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: WELLSTUDIO_TIME_ZONE,
    }).format(input.now)),
    sessionSummary: {
      sessionCount: input.sessions.length,
      reservedCount,
      capacity,
      occupancyPercent: capacity > 0 ? Math.round((reservedCount / capacity) * 100) : 0,
      pendingAttendanceCount,
    },
    sessions: input.sessions.slice(0, HOME_LIST_LIMIT).map((session) => ({
      id: session.id,
      name: session.classType.name,
      timeLabel: new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: WELLSTUDIO_TIME_ZONE,
      }).format(session.startsAt),
      coachLabel: session.coach?.displayName ?? 'Sin coach',
      occupancyLabel: `${session.reservedCount}/${session.capacity}`,
      occupancyPercent:
        session.capacity > 0 ? Math.min(100, Math.round((session.reservedCount / session.capacity) * 100)) : 0,
      statusLabel: formatSessionStatus(session.status),
    })),
    signals: {
      newLeadCount: input.newLeadCount,
      uncoveredMemberCount: input.uncoveredMemberCount,
      blockedMemberCount: input.blockedMemberCount,
      legacyRuleCount: input.legacyRuleCount,
      activeExceptionCount: input.activeExceptionCount,
    },
    pendingLeads: input.pendingLeads.map((lead) => ({
      id: lead.id,
      displayName:
        [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Solicitud sin nombre',
      phoneLabel: lead.phone ?? 'Sin teléfono',
      ageLabel: formatRelativeAge(lead.createdAt, input.now),
    })),
  }
}

function getBusinessDayRange(now: Date) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: WELLSTUDIO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now).map((part) => [part.type, part.value]),
  )
  const start = zonedStartOfDay(Number(values.year), Number(values.month), Number(values.day))
  const nextDay = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + 1))
  const end = zonedStartOfDay(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
  )

  return { start, end }
}

function zonedStartOfDay(year: number, month: number, day: number) {
  const utcGuess = Date.UTC(year, month - 1, day)
  const represented = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: WELLSTUDIO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(utcGuess)).map((part) => [part.type, part.value]),
  )
  const representedAsUtc = Date.UTC(
    Number(represented.year),
    Number(represented.month) - 1,
    Number(represented.day),
    Number(represented.hour),
    Number(represented.minute),
    Number(represented.second),
  )

  return new Date(utcGuess - (representedAsUtc - utcGuess))
}

function formatSessionStatus(status: string) {
  if (status === 'COMPLETED') return 'Completada'
  if (status === 'CLOSED') return 'Cerrada'
  if (status === 'DRAFT') return 'Borrador'
  return 'Publicada'
}

function formatRelativeAge(createdAt: Date, now: Date) {
  const hours = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 3_600_000))
  if (hours < 1) return 'Hace menos de 1 h'
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Hace 1 día' : `Hace ${days} días`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
