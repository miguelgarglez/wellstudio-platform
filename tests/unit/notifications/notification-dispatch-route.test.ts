import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { dispatchDueNotificationJobsMock, scheduleNextDayReservationRemindersMock } = vi.hoisted(() => ({
  dispatchDueNotificationJobsMock: vi.fn(),
  scheduleNextDayReservationRemindersMock: vi.fn(),
}))

vi.mock('@/modules/notifications/server/notification-outbox', () => ({
  dispatchDueNotificationJobs: dispatchDueNotificationJobsMock,
}))
vi.mock('@/modules/notifications/server/reservation-reminders', () => ({
  scheduleNextDayReservationReminders: scheduleNextDayReservationRemindersMock,
}))

import { GET } from '@/app/api/internal/notifications/dispatch/route'

describe('notification recovery route', () => {
  const previousSecret = process.env.CRON_SECRET

  beforeEach(() => {
    dispatchDueNotificationJobsMock.mockReset()
    scheduleNextDayReservationRemindersMock.mockReset()
    process.env.CRON_SECRET = 'cron-secret'
  })

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previousSecret
  })

  it('rejects requests without the cron bearer token', async () => {
    const response = await GET(new Request('http://localhost/api/internal/notifications/dispatch'))

    expect(response.status).toBe(401)
    expect(dispatchDueNotificationJobsMock).not.toHaveBeenCalled()
    expect(scheduleNextDayReservationRemindersMock).not.toHaveBeenCalled()
  })

  it('drains due jobs for an authenticated cron request', async () => {
    scheduleNextDayReservationRemindersMock.mockResolvedValue({
      windowStart: new Date('2026-08-10T22:00:00.000Z'),
      windowEnd: new Date('2026-08-11T22:00:00.000Z'),
      examined: 2,
      scheduled: 1,
    })
    dispatchDueNotificationJobsMock.mockResolvedValue({
      examined: 2,
      sent: 1,
      failed: 1,
      skipped: 0,
      canceled: 0,
    })
    const response = await GET(
      new Request('http://localhost/api/internal/notifications/dispatch', {
        headers: { Authorization: 'Bearer cron-secret' },
      }),
    )

    expect(response.status).toBe(200)
    expect(dispatchDueNotificationJobsMock).toHaveBeenCalledWith({ limit: 100 })
    await expect(response.json()).resolves.toEqual({
      reminders: {
        windowStart: '2026-08-10T22:00:00.000Z',
        windowEnd: '2026-08-11T22:00:00.000Z',
        examined: 2,
        scheduled: 1,
      },
      delivery: {
        examined: 2,
        sent: 1,
        failed: 1,
        skipped: 0,
        canceled: 0,
      },
    })
  })
})
