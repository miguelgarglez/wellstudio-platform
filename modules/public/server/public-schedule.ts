import { cache } from 'react'

import { prisma } from '@/lib/db/prisma'

const PUBLIC_SCHEDULE_DAYS = 30

export type PublicSessionAvailability = 'available' | 'last-places' | 'waitlist' | 'full'

export type PublicScheduleSession = {
  id: string
  classTypeName: string
  classTypeSlug: string
  description: string | null
  category: string | null
  durationMinutes: number
  coachName: string
  locationLabel: string
  startsAtIso: string
  endsAtIso: string
  capacity: number
  availablePlaces: number
  availability: PublicSessionAvailability
  availabilityLabel: string
  waitlistEnabled: boolean
}

type PublicSessionRecord = {
  id: string
  startsAt: Date
  endsAt: Date
  capacity: number
  reservedCount: number
  waitlistEnabled: boolean
  locationLabel: string | null
  classType: {
    name: string
    slug: string
    description: string | null
    category: string | null
    durationMinutes: number
  }
  coach: { displayName: string } | null
}

export const getPublicSchedule = cache(async (now = new Date()) => {
  const until = new Date(now.getTime() + PUBLIC_SCHEDULE_DAYS * 86_400_000)
  const sessions = await prisma.classSession.findMany({
    where: {
      startsAt: { gt: now, lte: until },
      status: 'PUBLISHED',
      classType: { status: 'ACTIVE', isPublic: true },
    },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    select: publicSessionSelect,
  })

  return buildPublicSchedule(sessions, now, until)
})

export const getPublicSessionDetail = cache(async (sessionId: string, now = new Date()) => {
  if (!sessionId) return null

  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      startsAt: { gt: now },
      status: 'PUBLISHED',
      classType: { status: 'ACTIVE', isPublic: true },
    },
    select: publicSessionSelect,
  })

  return session ? mapPublicSession(session) : null
})

const publicSessionSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  capacity: true,
  reservedCount: true,
  waitlistEnabled: true,
  locationLabel: true,
  classType: {
    select: {
      name: true,
      slug: true,
      description: true,
      category: true,
      durationMinutes: true,
    },
  },
  coach: { select: { displayName: true } },
} as const

export function buildPublicSchedule(
  sessions: PublicSessionRecord[],
  now: Date,
  until: Date,
) {
  const items = sessions.map(mapPublicSession)
  const groups = new Map<string, PublicScheduleSession[]>()

  for (const session of items) {
    const key = formatDayKey(new Date(session.startsAtIso))
    groups.set(key, [...(groups.get(key) ?? []), session])
  }

  return {
    fromIso: now.toISOString(),
    untilIso: until.toISOString(),
    sessionCount: items.length,
    groups: Array.from(groups, ([key, groupedSessions]) => {
      const date = new Date(groupedSessions[0].startsAtIso)
      return {
        key,
        weekday: new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          timeZone: 'Europe/Madrid',
        }).format(date),
        dateLabel: new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          timeZone: 'Europe/Madrid',
        }).format(date),
        sessions: groupedSessions,
      }
    }),
  }
}

export function mapPublicSession(session: PublicSessionRecord): PublicScheduleSession {
  const availablePlaces = Math.max(session.capacity - session.reservedCount, 0)
  const availability = resolveAvailability({
    availablePlaces,
    capacity: session.capacity,
    waitlistEnabled: session.waitlistEnabled,
  })

  return {
    id: session.id,
    classTypeName: session.classType.name,
    classTypeSlug: session.classType.slug,
    description: session.classType.description,
    category: session.classType.category,
    durationMinutes: session.classType.durationMinutes,
    coachName: session.coach?.displayName ?? 'Equipo WellStudio',
    locationLabel: session.locationLabel ?? 'WellStudio Madrid',
    startsAtIso: session.startsAt.toISOString(),
    endsAtIso: session.endsAt.toISOString(),
    capacity: session.capacity,
    availablePlaces,
    availability,
    availabilityLabel: availabilityLabel(availability, availablePlaces),
    waitlistEnabled: session.waitlistEnabled,
  }
}

export function resolveAvailability(input: {
  availablePlaces: number
  capacity: number
  waitlistEnabled: boolean
}): PublicSessionAvailability {
  if (input.availablePlaces <= 0) return input.waitlistEnabled ? 'waitlist' : 'full'
  if (input.availablePlaces <= 2 || input.availablePlaces / input.capacity <= 0.25) {
    return 'last-places'
  }
  return 'available'
}

function availabilityLabel(
  availability: PublicSessionAvailability,
  availablePlaces: number,
) {
  if (availability === 'waitlist') return 'Lista de espera'
  if (availability === 'full') return 'Completa'
  if (availability === 'last-places') {
    return availablePlaces === 1 ? 'Última plaza' : `${availablePlaces} últimas plazas`
  }
  return `${availablePlaces} plazas disponibles`
}

function formatDayKey(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(date)
}
