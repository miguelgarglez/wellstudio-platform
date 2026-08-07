import { prisma } from '@/lib/db/prisma'

const SESSION_WINDOW_DAYS = 45

export type AdminSessionOverview = Awaited<ReturnType<typeof getAdminSessionOverview>>

export async function getAdminSessionOverview(input: {
  selectedSessionId?: string | null
  from?: Date
}) {
  const now = input.from ?? new Date()
  const earliest = new Date(now.getTime() - 14 * 86_400_000)
  const until = new Date(now.getTime() + SESSION_WINDOW_DAYS * 86_400_000)

  const [sessions, classTypes, coaches] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        startsAt: { gte: earliest, lte: until },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        reservedCount: true,
        waitlistEnabled: true,
        locationLabel: true,
        status: true,
        classTypeId: true,
        coachId: true,
        classType: { select: { name: true } },
        coach: { select: { displayName: true } },
        reservations: {
          where: { status: { in: ['BOOKED', 'ATTENDED', 'NO_SHOW'] } },
          orderBy: [{ member: { firstName: 'asc' } }, { id: 'asc' }],
          select: {
            id: true,
            status: true,
            attendanceStatus: true,
            bookedAt: true,
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            waitlistEntries: { where: { status: { in: ['WAITING', 'NOTIFIED'] } } },
          },
        },
      },
    }),
    prisma.classType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        capacityDefault: true,
        waitlistEnabled: true,
      },
    }),
    prisma.coach.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayName: 'asc' },
      select: { id: true, displayName: true },
    }),
  ])

  const items = sessions.map((session) => ({
    id: session.id,
    classTypeId: session.classTypeId,
    classTypeName: session.classType.name,
    coachId: session.coachId,
    coachName: session.coach?.displayName ?? 'Sin coach',
    startsAtIso: session.startsAt.toISOString(),
    endsAtIso: session.endsAt.toISOString(),
    capacity: session.capacity,
    reservedCount: session.reservedCount,
    waitlistCount: session._count.waitlistEntries,
    waitlistEnabled: session.waitlistEnabled,
    locationLabel: session.locationLabel,
    status: session.status,
    roster: session.reservations.map((reservation) => ({
      reservationId: reservation.id,
      memberId: reservation.member.id,
      memberName: `${reservation.member.firstName} ${reservation.member.lastName}`.trim(),
      memberEmail: reservation.member.user.email,
      attendanceStatus: reservation.attendanceStatus,
      reservationStatus: reservation.status,
      bookedAtIso: reservation.bookedAt.toISOString(),
    })),
    attendance: {
      pending: session.reservations.filter((item) => item.attendanceStatus === 'PENDING').length,
      attended: session.reservations.filter((item) => item.attendanceStatus === 'ATTENDED').length,
      noShow: session.reservations.filter((item) => item.attendanceStatus === 'NO_SHOW').length,
    },
    isAttendanceOpen:
      now.getTime() >= session.startsAt.getTime() - 2 * 60 * 60 * 1000 &&
      session.status !== 'DRAFT' &&
      session.status !== 'CANCELED',
    hasEnded: session.endsAt <= now,
    isEditable:
      session.startsAt > now &&
      (session.status === 'DRAFT' || session.status === 'PUBLISHED' || session.status === 'CLOSED'),
  }))
  const selectedSession = input.selectedSessionId
    ? items.find((session) => session.id === input.selectedSessionId) ?? null
    : null

  return {
    sessions: items,
    selectedSession,
    classTypes,
    coaches,
    window: { fromIso: earliest.toISOString(), untilIso: until.toISOString() },
    todayKey: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(now),
    counts: {
      published: items.filter((item) => item.status === 'PUBLISHED').length,
      drafts: items.filter((item) => item.status === 'DRAFT').length,
      closed: items.filter((item) => item.status === 'CLOSED').length,
    },
  }
}
