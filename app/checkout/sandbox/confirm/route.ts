import { after } from 'next/server'

import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { dispatchNotificationJobSafely } from '@/modules/notifications/server/notification-outbox'
import { completeSandboxCheckout } from '@/modules/payments/server/sandbox-checkout'

export async function POST(request: Request) {
  const context = await requireAuthenticatedContext()
  const formData = await request.formData()
  const paymentId = read(formData, 'paymentId')

  if (!context.member || !paymentId) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/app/account?checkout=failed' },
    })
  }

  const result = await completeSandboxCheckout({ paymentId, memberId: context.member.id })
  if (result.success) {
    for (const jobId of result.notificationJobIds ?? []) {
      after(() => dispatchNotificationJobSafely(jobId))
    }
  }
  const checkout = result.success ? 'success' : 'failed'
  return new Response(null, {
    status: 303,
    headers: { Location: `/app/account?checkout=${checkout}&payment=${encodeURIComponent(paymentId)}` },
  })
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
