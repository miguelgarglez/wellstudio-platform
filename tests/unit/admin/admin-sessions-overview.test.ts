import { describe, expect, it, vi } from 'vitest'

const { classSessionFindManyMock, classSessionFindUniqueMock, reservationFindManyMock, classTypeFindManyMock, coachFindManyMock } =
  vi.hoisted(() => ({
    classSessionFindManyMock: vi.fn(),
    classSessionFindUniqueMock: vi.fn(),
    reservationFindManyMock: vi.fn(),
    classTypeFindManyMock: vi.fn(),
    coachFindManyMock: vi.fn(),
  }))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    classSession: {
      findMany: classSessionFindManyMock,
      findUnique: classSessionFindUniqueMock,
    },
    reservation: { findMany: reservationFindManyMock },
    classType: { findMany: classTypeFindManyMock },
    coach: { findMany: coachFindManyMock },
  },
}))

import {
  getAdminSessionOverview,
  mapAdminSessionItem,
} from '@/modules/admin/server/admin-sessions-overview'

const now = new Date('2026-08-07T10:00:00.000Z')

describe('admin sessions overview', () => {
  it('loads roster only for the selected session', async () => {
    classSessionFindManyMock.mockResolvedValue([
      {
        id: 'session-1',
        startsAt: new Date('2026-08-07T15:00:00.000Z'),
        endsAt: new Date('2026-08-07T16:00:00.000Z'),
        capacity: 8,
        reservedCount: 1,
        waitlistEnabled: true,
        locationLabel: 'Sala A',
        status: 'PUBLISHED',
        classTypeId: 'type-1',
        coachId: 'coach-1',
        updatedAt: now,
        classType: { name: 'Strength' },
        coach: { displayName: 'Marta' },
        _count: { waitlistEntries: 0 },
      },
      {
        id: 'session-2',
        startsAt: new Date('2026-08-08T15:00:00.000Z'),
        endsAt: new Date('2026-08-08T16:00:00.000Z'),
        capacity: 6,
        reservedCount: 2,
        waitlistEnabled: false,
        locationLabel: null,
        status: 'DRAFT',
        classTypeId: 'type-2',
        coachId: null,
        updatedAt: now,
        classType: { name: 'Mobility' },
        coach: null,
        _count: { waitlistEntries: 1 },
      },
    ])
    classTypeFindManyMock.mockResolvedValue([])
    coachFindManyMock.mockResolvedValue([])
    reservationFindManyMock.mockResolvedValue([
      {
        id: 'reservation-1',
        status: 'BOOKED',
        attendanceStatus: 'PENDING',
        bookedAt: now,
        member: {
          id: 'member-1',
          firstName: 'Ana',
          lastName: 'Socio',
          user: { email: 'ana@example.com' },
        },
      },
    ])

    const overview = await getAdminSessionOverview({
      selectedSessionId: 'session-1',
      from: now,
    })

    expect(reservationFindManyMock).toHaveBeenCalledTimes(1)
    expect(reservationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ classSessionId: 'session-1' }),
      }),
    )
    expect(overview.sessions[0]?.roster).toHaveLength(1)
    expect(overview.sessions[1]?.roster).toEqual([])
    expect(overview.selectedSession?.attendance).toEqual({
      pending: 1,
      attended: 0,
      noShow: 0,
    })
  })

  it('maps session rows without roster data for list rendering', () => {
    const item = mapAdminSessionItem(
      {
        id: 'session-1',
        startsAt: new Date('2026-08-07T15:00:00.000Z'),
        endsAt: new Date('2026-08-07T16:00:00.000Z'),
        capacity: 8,
        reservedCount: 3,
        waitlistEnabled: true,
        locationLabel: 'Sala A',
        status: 'PUBLISHED',
        classTypeId: 'type-1',
        coachId: null,
        updatedAt: now,
        classType: { name: 'Strength' },
        coach: null,
        _count: { waitlistEntries: 2 },
      },
      now,
      [],
    )

    expect(item).toMatchObject({
      classTypeName: 'Strength',
      coachName: 'Sin coach',
      roster: [],
      attendance: { pending: 0, attended: 0, noShow: 0 },
      waitlistCount: 2,
    })
  })

  it('loads a selected session even when it sits outside the agenda window', async () => {
    classSessionFindManyMock.mockResolvedValue([])
    classTypeFindManyMock.mockResolvedValue([])
    coachFindManyMock.mockResolvedValue([])
    classSessionFindUniqueMock.mockResolvedValue({
      id: 'session-old',
      startsAt: new Date('2026-06-01T15:00:00.000Z'),
      endsAt: new Date('2026-06-01T16:00:00.000Z'),
      capacity: 8,
      reservedCount: 1,
      waitlistEnabled: false,
      locationLabel: null,
      status: 'COMPLETED',
      classTypeId: 'type-1',
      coachId: null,
      updatedAt: now,
      classType: { name: 'Strength' },
      coach: null,
      _count: { waitlistEntries: 0 },
    })
    reservationFindManyMock.mockResolvedValue([])

    const overview = await getAdminSessionOverview({
      selectedSessionId: 'session-old',
      from: now,
    })

    expect(overview.sessions).toEqual([])
    expect(overview.selectedSession).toMatchObject({
      id: 'session-old',
      classTypeName: 'Strength',
      status: 'COMPLETED',
    })
  })

  it('keeps the agenda list when the selected session is missing', async () => {
    classSessionFindManyMock.mockResolvedValue([
      {
        id: 'session-1',
        startsAt: new Date('2026-08-07T15:00:00.000Z'),
        endsAt: new Date('2026-08-07T16:00:00.000Z'),
        capacity: 8,
        reservedCount: 0,
        waitlistEnabled: true,
        locationLabel: null,
        status: 'PUBLISHED',
        classTypeId: 'type-1',
        coachId: null,
        updatedAt: now,
        classType: { name: 'Strength' },
        coach: null,
        _count: { waitlistEntries: 0 },
      },
    ])
    classTypeFindManyMock.mockResolvedValue([])
    coachFindManyMock.mockResolvedValue([])
    classSessionFindUniqueMock.mockResolvedValue(null)
    reservationFindManyMock.mockResolvedValue([])

    const overview = await getAdminSessionOverview({
      selectedSessionId: 'missing-session',
      from: now,
    })

    expect(overview.sessions).toHaveLength(1)
    expect(overview.selectedSession).toBeNull()
  })

  it('does not fail the agenda when the selected session query throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    classSessionFindManyMock.mockResolvedValue([
      {
        id: 'session-1',
        startsAt: new Date('2026-08-07T15:00:00.000Z'),
        endsAt: new Date('2026-08-07T16:00:00.000Z'),
        capacity: 8,
        reservedCount: 0,
        waitlistEnabled: true,
        locationLabel: null,
        status: 'PUBLISHED',
        classTypeId: 'type-1',
        coachId: null,
        updatedAt: now,
        classType: { name: 'Strength' },
        coach: null,
        _count: { waitlistEntries: 0 },
      },
    ])
    classTypeFindManyMock.mockResolvedValue([])
    coachFindManyMock.mockResolvedValue([])
    classSessionFindUniqueMock.mockRejectedValue(new Error('db timeout'))
    reservationFindManyMock.mockRejectedValue(new Error('db timeout'))

    const overview = await getAdminSessionOverview({
      selectedSessionId: 'session-1',
      from: now,
    })

    expect(overview.sessions).toHaveLength(1)
    expect(overview.selectedSession).toMatchObject({ id: 'session-1', roster: [] })
    consoleError.mockRestore()
  })
})
