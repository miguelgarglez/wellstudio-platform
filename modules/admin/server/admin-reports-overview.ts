import { prisma } from '@/lib/db/prisma'

const WELLSTUDIO_TIME_ZONE = 'Europe/Madrid'
const REPORT_WINDOWS = {
  '7d': { days: 7, label: '7 días' },
  '28d': { days: 28, label: '28 días' },
  '90d': { days: 90, label: '90 días' },
} as const

export type AdminReportWindow = keyof typeof REPORT_WINDOWS

type ReportSessionRecord = {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
  status: string
  classType: { id: string; name: string }
}

type ReservationAggregate = {
  classSessionId: string
  status: string
  attendanceStatus: string
  _count: { _all: number }
}

type LeadRecord = {
  convertedMemberId: string | null
  source: string | null
  utmSource: string | null
}

export type AdminReportsOverview = Awaited<ReturnType<typeof getAdminReportsOverview>>

export async function getAdminReportsOverview(input: {
  window?: string | null
  now?: Date
} = {}) {
  const now = input.now ?? new Date()
  const reportWindow = parseAdminReportWindow(input.window)
  const range = getAdminReportDateRange(reportWindow, now)

  const [sessions, leads] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        startsAt: { gte: range.start, lte: range.end },
        status: { in: ['PUBLISHED', 'CLOSED', 'COMPLETED'] },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        status: true,
        classType: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: range.start, lte: range.end } },
      select: { convertedMemberId: true, source: true, utmSource: true },
    }),
  ])

  const reservationAggregates = sessions.length > 0
    ? await prisma.reservation.groupBy({
        by: ['classSessionId', 'status', 'attendanceStatus'],
        where: { classSessionId: { in: sessions.map((session) => session.id) } },
        _count: { _all: true },
      })
    : []

  return buildAdminReportsOverview({
    now,
    reportWindow,
    range,
    sessions,
    reservationAggregates,
    leads,
  })
}

export function buildAdminReportsOverview(input: {
  now: Date
  reportWindow: AdminReportWindow
  range: { start: Date; end: Date }
  sessions: ReportSessionRecord[]
  reservationAggregates: ReservationAggregate[]
  leads: LeadRecord[]
}) {
  const sessionsById = new Map(input.sessions.map((session) => [session.id, session]))
  const classTypes = new Map<string, {
    id: string
    name: string
    sessionCount: number
    capacity: number
    retainedReservations: number
  }>()

  for (const session of input.sessions) {
    const current = classTypes.get(session.classType.id) ?? {
      id: session.classType.id,
      name: session.classType.name,
      sessionCount: 0,
      capacity: 0,
      retainedReservations: 0,
    }
    current.sessionCount += 1
    current.capacity += Math.max(0, session.capacity)
    classTypes.set(session.classType.id, current)
  }

  let reservationCount = 0
  let canceledCount = 0
  let retainedCount = 0
  let attendedCount = 0
  let noShowCount = 0
  let pendingAttendanceCount = 0

  for (const aggregate of input.reservationAggregates) {
    const count = aggregate._count._all
    const session = sessionsById.get(aggregate.classSessionId)
    if (!session) continue

    reservationCount += count
    if (aggregate.status === 'CANCELED') {
      canceledCount += count
      continue
    }

    retainedCount += count
    const classType = classTypes.get(session.classType.id)
    if (classType) classType.retainedReservations += count

    if (aggregate.attendanceStatus === 'ATTENDED') attendedCount += count
    if (aggregate.attendanceStatus === 'NO_SHOW') noShowCount += count
    if (session.endsAt <= input.now && aggregate.attendanceStatus === 'PENDING') {
      pendingAttendanceCount += count
    }
  }

  const finalizedAttendanceCount = attendedCount + noShowCount
  const totalCapacity = input.sessions.reduce(
    (total, session) => total + Math.max(0, session.capacity),
    0,
  )
  const convertedLeadCount = input.leads.filter((lead) => lead.convertedMemberId).length
  const staleSessionCount = input.sessions.filter(
    (session) => session.endsAt <= input.now && session.status !== 'COMPLETED',
  ).length
  const sourceCounts = new Map<string, number>()

  for (const lead of input.leads) {
    const label = formatLeadSource(lead.utmSource ?? lead.source)
    sourceCounts.set(label, (sourceCounts.get(label) ?? 0) + 1)
  }

  return {
    filters: {
      window: input.reportWindow,
      windowLabel: REPORT_WINDOWS[input.reportWindow].label,
      rangeLabel: formatRangeLabel(input.range.start, input.range.end),
    },
    summary: {
      sessionCount: input.sessions.length,
      totalCapacity,
      retainedReservationCount: retainedCount,
      occupancyPercent: percentage(retainedCount, totalCapacity),
      reservationCount,
      canceledCount,
      cancellationPercent: percentage(canceledCount, reservationCount),
      finalizedAttendanceCount,
      attendedCount,
      noShowCount,
      attendancePercent: percentage(attendedCount, finalizedAttendanceCount),
      leadCount: input.leads.length,
      convertedLeadCount,
      leadConversionPercent: percentage(convertedLeadCount, input.leads.length),
    },
    classTypes: [...classTypes.values()]
      .map((classType) => ({
        ...classType,
        occupancyPercent: percentage(classType.retainedReservations, classType.capacity),
      }))
      .sort((left, right) =>
        right.occupancyPercent - left.occupancyPercent
        || right.sessionCount - left.sessionCount
        || left.name.localeCompare(right.name, 'es'),
      ),
    leadSources: [...sourceCounts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        sharePercent: percentage(count, input.leads.length),
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'es')),
    dataQuality: {
      staleSessionCount,
      pendingAttendanceCount,
      hasIssues: staleSessionCount > 0 || pendingAttendanceCount > 0,
    },
  }
}

export function parseAdminReportWindow(value?: string | null): AdminReportWindow {
  return value === '7d' || value === '90d' ? value : '28d'
}

export function getAdminReportDateRange(reportWindow: AdminReportWindow, now: Date) {
  const parts = getCalendarParts(now)
  const firstCalendarDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - (REPORT_WINDOWS[reportWindow].days - 1)))

  return {
    start: zonedStartOfDay(
      firstCalendarDay.getUTCFullYear(),
      firstCalendarDay.getUTCMonth() + 1,
      firstCalendarDay.getUTCDate(),
    ),
    end: now,
  }
}

function getCalendarParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: WELLSTUDIO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date).map((part) => [part.type, part.value]),
  )

  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) }
}

function zonedStartOfDay(year: number, month: number, day: number) {
  const desiredUtc = Date.UTC(year, month - 1, day)
  let candidate = desiredUtc

  for (let index = 0; index < 2; index += 1) {
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
      }).formatToParts(new Date(candidate)).map((part) => [part.type, part.value]),
    )
    const representedUtc = Date.UTC(
      Number(represented.year),
      Number(represented.month) - 1,
      Number(represented.day),
      Number(represented.hour),
      Number(represented.minute),
      Number(represented.second),
    )
    candidate -= representedUtc - desiredUtc
  }

  return new Date(candidate)
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)))
}

function formatLeadSource(value: string | null) {
  const normalized = value?.trim().toLocaleLowerCase('es')
  if (!normalized) return 'No indicado'
  if (normalized === 'public_home') return 'Web pública'
  return value!.trim()
}

function formatRangeLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: WELLSTUDIO_TIME_ZONE,
  })
  return `${formatter.format(start)} – ${formatter.format(end)}`
}
