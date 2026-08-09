import { NextResponse } from 'next/server'

import { authorizeCronRequest } from '@/lib/server/cron-request'
import { dispatchDueNotificationJobs } from '@/modules/notifications/server/notification-outbox'
import { scheduleNextDayReservationReminders } from '@/modules/notifications/server/reservation-reminders'

export async function GET(request: Request) {
  const authorization = authorizeCronRequest(request)
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: authorization.message },
      { status: authorization.status },
    )
  }

  const reminders = await scheduleNextDayReservationReminders()
  const delivery = await dispatchDueNotificationJobs({ limit: 100 })
  return NextResponse.json({ reminders, delivery })
}
