import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    reservation: { findMany: vi.fn() },
    notificationJob: { createMany: vi.fn() },
  },
}))

import {
  getNextMadridDayWindow,
  scheduleNextDayReservationReminders,
} from '@/modules/notifications/server/reservation-reminders'

describe('next-day reservation reminders', () => {
  it('uses Madrid calendar days across the spring DST change', () => {
    const window = getNextMadridDayWindow(new Date('2026-03-28T12:00:00.000Z'))

    expect(window).toEqual({
      startsAt: new Date('2026-03-28T23:00:00.000Z'),
      endsAt: new Date('2026-03-29T22:00:00.000Z'),
    })
  })

  it('uses Madrid calendar days across the autumn DST change', () => {
    const window = getNextMadridDayWindow(new Date('2026-10-24T12:00:00.000Z'))

    expect(window).toEqual({
      startsAt: new Date('2026-10-24T22:00:00.000Z'),
      endsAt: new Date('2026-10-25T23:00:00.000Z'),
    })
  })

  it('enqueues one immutable reminder per eligible reservation', async () => {
    const now = new Date('2026-08-09T10:00:00.000Z')
    const repository = {
      findReservations: vi.fn().mockResolvedValue([
        {
          id: 'reservation-1',
          member: {
            firstName: 'Ana',
            lastName: 'Socio',
            user: { email: 'ana@example.com' },
          },
          classSession: {
            startsAt: new Date('2026-08-10T16:00:00.000Z'),
            endsAt: new Date('2026-08-10T16:50:00.000Z'),
            locationLabel: 'Sala 1',
            classType: { name: 'Fuerza Total' },
            coach: { displayName: 'Marta Coach' },
          },
        },
      ]),
      enqueue: vi.fn().mockResolvedValue({ created: true }),
    }

    await expect(
      scheduleNextDayReservationReminders({ now }, repository),
    ).resolves.toEqual({
      windowStart: new Date('2026-08-09T22:00:00.000Z'),
      windowEnd: new Date('2026-08-10T22:00:00.000Z'),
      examined: 1,
      scheduled: 1,
    })

    expect(repository.findReservations).toHaveBeenCalledWith({
      startsAt: new Date('2026-08-09T22:00:00.000Z'),
      endsAt: new Date('2026-08-10T22:00:00.000Z'),
    })
    expect(repository.enqueue).toHaveBeenCalledWith({
      reservationId: 'reservation-1',
      recipient: 'ana@example.com',
      availableAt: now,
      payload: {
        reservationId: 'reservation-1',
        memberName: 'Ana Socio',
        className: 'Fuerza Total',
        coachName: 'Marta Coach',
        locationLabel: 'Sala 1',
        startsAt: '2026-08-10T16:00:00.000Z',
        endsAt: '2026-08-10T16:50:00.000Z',
      },
    })
  })

  it('reports duplicate reminders without counting them as scheduled', async () => {
    const repository = {
      findReservations: vi.fn().mockResolvedValue([
        {
          id: 'reservation-1',
          member: {
            firstName: null,
            lastName: null,
            user: { email: 'member@example.com' },
          },
          classSession: {
            startsAt: new Date('2026-08-10T16:00:00.000Z'),
            endsAt: new Date('2026-08-10T16:50:00.000Z'),
            locationLabel: null,
            classType: { name: 'Fuerza Total' },
            coach: null,
          },
        },
      ]),
      enqueue: vi.fn().mockResolvedValue({ created: false }),
    }

    const result = await scheduleNextDayReservationReminders(
      { now: new Date('2026-08-09T10:00:00.000Z') },
      repository,
    )

    expect(result.scheduled).toBe(0)
    expect(repository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ memberName: 'socio' }) }),
    )
  })
})
