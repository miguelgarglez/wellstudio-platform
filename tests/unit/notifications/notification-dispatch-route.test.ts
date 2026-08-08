import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { dispatchDueNotificationJobsMock } = vi.hoisted(() => ({
  dispatchDueNotificationJobsMock: vi.fn(),
}))

vi.mock('@/modules/notifications/server/notification-outbox', () => ({
  dispatchDueNotificationJobs: dispatchDueNotificationJobsMock,
}))

import { GET } from '@/app/api/internal/notifications/dispatch/route'

describe('notification recovery route', () => {
  const previousSecret = process.env.CRON_SECRET

  beforeEach(() => {
    dispatchDueNotificationJobsMock.mockReset()
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
  })

  it('drains due jobs for an authenticated cron request', async () => {
    dispatchDueNotificationJobsMock.mockResolvedValue({
      examined: 2,
      sent: 1,
      failed: 1,
      skipped: 0,
    })
    const response = await GET(
      new Request('http://localhost/api/internal/notifications/dispatch', {
        headers: { Authorization: 'Bearer cron-secret' },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      examined: 2,
      sent: 1,
      failed: 1,
      skipped: 0,
    })
  })
})
