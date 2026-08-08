import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({ prisma: {} }))

import {
  buildPublicSchedule,
  mapPublicSession,
  resolveAvailability,
} from '@/modules/public/server/public-schedule'
import {
  buildPublicScheduleFilterOptions,
  filterPublicScheduleGroups,
  normalizePublicScheduleFilters,
} from '@/modules/public/lib/public-schedule-filters'

describe('public schedule', () => {
  it.each([
    [{ availablePlaces: 8, capacity: 10, waitlistEnabled: true }, 'available'],
    [{ availablePlaces: 2, capacity: 10, waitlistEnabled: true }, 'last-places'],
    [{ availablePlaces: 0, capacity: 10, waitlistEnabled: true }, 'waitlist'],
    [{ availablePlaces: 0, capacity: 10, waitlistEnabled: false }, 'full'],
  ] as const)('resolves availability from real capacity signals', (input, expected) => {
    expect(resolveAvailability(input)).toBe(expected)
  })

  it('never exposes a negative number of places', () => {
    const session = mapPublicSession(
      sessionRecord({ capacity: 6, reservedCount: 8, waitlistEnabled: false }),
    )

    expect(session.availablePlaces).toBe(0)
    expect(session.availability).toBe('full')
    expect(session.availabilityLabel).toBe('Completa')
  })

  it('groups sessions by the local Madrid calendar day', () => {
    const schedule = buildPublicSchedule(
      [
        sessionRecord({ id: 'late', startsAt: new Date('2026-08-08T21:30:00.000Z') }),
        sessionRecord({ id: 'next', startsAt: new Date('2026-08-08T22:30:00.000Z') }),
      ],
      new Date('2026-08-08T10:00:00.000Z'),
      new Date('2026-09-07T10:00:00.000Z'),
    )

    expect(schedule.groups).toHaveLength(2)
    expect(schedule.groups.map((group) => group.key)).toEqual(['2026-08-08', '2026-08-09'])
    expect(schedule.groups.map((group) => group.sessions[0].id)).toEqual(['late', 'next'])
  })

  it('derives sorted filter options with session counts', () => {
    const groups = buildPublicSchedule(
      [
        sessionRecord({ id: 'strength-1' }),
        sessionRecord({ id: 'strength-2' }),
        sessionRecord({
          id: 'mobility',
          classType: {
            name: 'Movilidad',
            slug: 'movilidad',
            description: null,
            category: 'Mobility',
            durationMinutes: 45,
          },
          coach: { id: 'coach-leo', displayName: 'Leo' },
        }),
      ],
      new Date('2026-08-08T10:00:00.000Z'),
      new Date('2026-09-07T10:00:00.000Z'),
    ).groups

    expect(buildPublicScheduleFilterOptions(groups)).toEqual({
      classTypes: [
        { value: 'fuerza', label: 'Fuerza', sessionCount: 2 },
        { value: 'movilidad', label: 'Movilidad', sessionCount: 1 },
      ],
      coaches: [
        { value: 'coach-leo', label: 'Leo', sessionCount: 1 },
        { value: 'coach-marta', label: 'Marta', sessionCount: 2 },
      ],
    })
  })

  it('combines class and coach filters while removing empty day groups', () => {
    const schedule = buildPublicSchedule(
      [
        sessionRecord({ id: 'matching', startsAt: new Date('2026-08-08T16:00:00.000Z') }),
        sessionRecord({
          id: 'other-coach',
          startsAt: new Date('2026-08-09T16:00:00.000Z'),
          coach: { id: 'coach-leo', displayName: 'Leo' },
        }),
      ],
      new Date('2026-08-08T10:00:00.000Z'),
      new Date('2026-09-07T10:00:00.000Z'),
    )

    const filtered = filterPublicScheduleGroups(schedule.groups, {
      classType: 'fuerza',
      coach: 'coach-marta',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].sessions.map((session) => session.id)).toEqual(['matching'])
  })

  it('drops manipulated filter values that are not present in the schedule', () => {
    const schedule = buildPublicSchedule(
      [sessionRecord()],
      new Date('2026-08-08T10:00:00.000Z'),
      new Date('2026-09-07T10:00:00.000Z'),
    )
    const options = buildPublicScheduleFilterOptions(schedule.groups)

    expect(
      normalizePublicScheduleFilters(
        { classType: 'not-public', coach: 'unknown-coach' },
        options,
      ),
    ).toEqual({ classType: null, coach: null })
  })
})

function sessionRecord(
  overrides: Partial<Parameters<typeof mapPublicSession>[0]> = {},
): Parameters<typeof mapPublicSession>[0] {
  return {
    id: 'session-1',
    startsAt: new Date('2026-08-08T16:00:00.000Z'),
    endsAt: new Date('2026-08-08T17:00:00.000Z'),
    capacity: 10,
    reservedCount: 2,
    waitlistEnabled: true,
    locationLabel: 'Sala Norte',
    classType: {
      name: 'Fuerza',
      slug: 'fuerza',
      description: 'Entrenamiento guiado.',
      category: 'Strength',
      durationMinutes: 60,
    },
    coach: { id: 'coach-marta', displayName: 'Marta' },
    ...overrides,
  }
}
