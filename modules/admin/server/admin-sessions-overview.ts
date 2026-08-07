import { prisma } from '@/lib/db/prisma'

const SESSION_WINDOW_DAYS = 45

export type AdminSessionOverview = Awaited<ReturnType<typeof getAdminSessionOverview>>

export async function getAdminSessionOverview(input: {
  selectedSessionId?: string | null
  from?: Date
}) {
  const now = input.from ?? new Date()
  const until = new Date(now.getTime() + SESSION_WINDOW_DAYS * 86_400_000)

  const [sessions, classTypes, coaches] = await Promise.all([
    prisma.classSession.findMany({
      where: {
        startsAt: { gte: new Date(now.getTime() - 86_400_000), lte: until },
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
  }))
  const selectedSession = input.selectedSessionId
    ? items.find((session) => session.id === input.selectedSessionId) ?? null
    : null

  return {
    sessions: items,
    selectedSession,
    classTypes,
    coaches,
    window: { fromIso: now.toISOString(), untilIso: until.toISOString() },
    counts: {
      published: items.filter((item) => item.status === 'PUBLISHED').length,
      drafts: items.filter((item) => item.status === 'DRAFT').length,
      closed: items.filter((item) => item.status === 'CLOSED').length,
    },
  }
}
