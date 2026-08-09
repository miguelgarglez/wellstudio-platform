import { NextResponse } from 'next/server'

import { dispatchDueNotificationJobs } from '@/modules/notifications/server/notification-outbox'
import { scheduleNextDayReservationReminders } from '@/modules/notifications/server/reservation-reminders'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Notification recovery is not configured.' }, { status: 503 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const reminders = await scheduleNextDayReservationReminders()
  const delivery = await dispatchDueNotificationJobs({ limit: 100 })
  return NextResponse.json({ reminders, delivery })
}
