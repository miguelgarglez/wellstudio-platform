'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import { requestAdminNotificationRetry } from '@/modules/notifications/server/admin-notification-operations'
import { dispatchNotificationJobSafely } from '@/modules/notifications/server/notification-outbox'

export type AdminNotificationRetryActionState = {
  message: string
} | null

export async function retryAdminNotificationAction(
  _previousState: AdminNotificationRetryActionState,
  formData: FormData,
): Promise<AdminNotificationRetryActionState> {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    return { message: 'Necesitamos una sesión admin o staff válida.' }
  }

  const result = await requestAdminNotificationRetry({
    jobId: readField(formData, 'jobId') ?? '',
    expectedUpdatedAt: readField(formData, 'expectedUpdatedAt') ?? '',
    actor: {
      userId: authContext.localUser.id,
      displayName: getActorDisplayName(authContext),
    },
  })

  if (!result.success) {
    return { message: result.message }
  }

  after(() =>
    dispatchNotificationJobSafely(result.jobId, {
      allowExhaustedAttempts: true,
    }),
  )

  revalidatePath('/admin/notifications')
  redirect(appendUpdatedParam(normalizeReturnTo(readField(formData, 'returnTo'))))
}

function getActorDisplayName(
  authContext: NonNullable<Awaited<ReturnType<typeof requireAdminOrStaffContext>>>,
) {
  const memberName = authContext.member
    ? [authContext.member.firstName, authContext.member.lastName]
        .filter(Boolean)
        .join(' ')
        .trim()
    : ''

  return memberName || authContext.localUser.email
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

function normalizeReturnTo(href: string | null) {
  if (!href) return '/admin/notifications'

  const url = new URL(href, 'http://wellstudio.local')
  return url.pathname === '/admin/notifications'
    ? `${url.pathname}${url.search}`
    : '/admin/notifications'
}

function appendUpdatedParam(href: string) {
  const url = new URL(href, 'http://wellstudio.local')
  url.searchParams.set('updated', 'retry')
  url.searchParams.set('notice', Date.now().toString(36))
  return `${url.pathname}${url.search}`
}
