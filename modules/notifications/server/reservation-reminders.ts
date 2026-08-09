import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type { ReservationNotificationPayload } from '@/modules/notifications/server/reservation-email'

export const RESERVATION_REMINDER_TIME_ZONE = 'Europe/Madrid'

type ReminderRepository = {
  findReservations(input: { startsAt: Date; endsAt: Date }): Promise<Array<{
    id: string
    member: {
      firstName: string | null
      lastName: string | null
      user: { email: string }
    }
    classSession: {
      startsAt: Date
      endsAt: Date
      locationLabel: string | null
      classType: { name: string }
      coach: { displayName: string } | null
    }
  }>>
  enqueue(input: {
    reservationId: string
    recipient: string
    payload: ReservationNotificationPayload
    availableAt: Date
  }): Promise<{ created: boolean }>
}

const repository: ReminderRepository = {
  findReservations({ startsAt, endsAt }) {
    return prisma.reservation.findMany({
      where: {
        status: 'BOOKED',
        classSession: {
          startsAt: { gte: startsAt, lt: endsAt },
          status: { in: ['PUBLISHED', 'CLOSED'] },
        },
      },
      select: {
        id: true,
        member: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        classSession: {
          select: {
            startsAt: true,
            endsAt: true,
            locationLabel: true,
            classType: { select: { name: true } },
            coach: { select: { displayName: true } },
          },
        },
      },
      orderBy: [{ classSession: { startsAt: 'asc' } }, { id: 'asc' }],
    })
  },
  async enqueue({ reservationId, recipient, payload, availableAt }) {
    const idempotencyKey = `reservation_reminder/${reservationId}`
    const result = await prisma.notificationJob.createMany({
      data: [{
        eventType: 'RESERVATION_REMINDER',
        recipient,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey,
        referenceType: 'reservation',
        referenceId: reservationId,
        availableAt,
      }],
      skipDuplicates: true,
    })
    return { created: result.count === 1 }
  },
}

export async function scheduleNextDayReservationReminders(
  input: { now?: Date } = {},
  reminderRepository: ReminderRepository = repository,
) {
  const now = input.now ?? new Date()
  const window = getNextMadridDayWindow(now)
  const reservations = await reminderRepository.findReservations(window)
  let scheduled = 0

  for (const reservation of reservations) {
    const session = reservation.classSession
    const result = await reminderRepository.enqueue({
      reservationId: reservation.id,
      recipient: reservation.member.user.email,
      availableAt: now,
      payload: {
        reservationId: reservation.id,
        memberName:
          [reservation.member.firstName, reservation.member.lastName].filter(Boolean).join(' ') ||
          'socio',
        className: session.classType.name,
        coachName: session.coach?.displayName ?? null,
        locationLabel: session.locationLabel,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
      },
    })
    if (result.created) scheduled += 1
  }

  return {
    windowStart: window.startsAt,
    windowEnd: window.endsAt,
    examined: reservations.length,
    scheduled,
  }
}

export function getNextMadridDayWindow(now: Date) {
  const current = getZonedDateParts(now, RESERVATION_REMINDER_TIME_ZONE)
  const nextDate = new Date(Date.UTC(current.year, current.month - 1, current.day + 1))
  const afterNextDate = new Date(Date.UTC(current.year, current.month - 1, current.day + 2))

  return {
    startsAt: zonedMidnightToUtc(nextDate, RESERVATION_REMINDER_TIME_ZONE),
    endsAt: zonedMidnightToUtc(afterNextDate, RESERVATION_REMINDER_TIME_ZONE),
  }
}

function zonedMidnightToUtc(date: Date, timeZone: string) {
  const localTimestamp = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  )
  let candidate = localTimestamp

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = getZonedDateParts(new Date(candidate), timeZone)
    const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
    candidate -= representedAsUtc - localTimestamp
  }

  return new Date(candidate)
}

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  }
}
