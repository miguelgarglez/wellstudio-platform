import { Suspense } from 'react'

import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import {
  AdminNotificationsDashboard,
  AdminNotificationsDashboardSkeleton,
} from '@/modules/admin/ui/admin-notifications-dashboard'
import { getAdminNotificationDeliveryOverview } from '@/modules/notifications/server/admin-notification-deliveries'

type AdminNotificationsPageProps = {
  searchParams?: Promise<{
    status?: string
    event?: string
    delivery?: string
    updated?: string
    notice?: string
  }>
}

export default async function AdminNotificationsPage({
  searchParams,
}: AdminNotificationsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const status = typeof params?.status === 'string' ? params.status : null
  const event = typeof params?.event === 'string' ? params.event : null
  const selectedJobId =
    typeof params?.delivery === 'string' ? params.delivery : null
  const updatedState = params?.updated === 'retry' ? 'retry' : null
  const noticeId = typeof params?.notice === 'string' ? params.notice : null

  return (
    <AdminSectionShell
      eyebrow="Admin · Comunicaciones"
      title="Entregas"
      description="Supervisa los emails transaccionales, localiza incidencias y recupera una entrega fallida sin perder su historial."
    >
      <Suspense fallback={<AdminNotificationsDashboardSkeleton />}>
        <AdminNotificationsSection
          status={status}
          event={event}
          selectedJobId={selectedJobId}
          updatedState={updatedState}
          noticeId={noticeId}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminNotificationsSection({
  status,
  event,
  selectedJobId,
  updatedState,
  noticeId,
}: {
  status: string | null
  event: string | null
  selectedJobId: string | null
  updatedState: 'retry' | null
  noticeId: string | null
}) {
  const overview = await getAdminNotificationDeliveryOverview({
    status,
    event,
    selectedJobId,
  })

  return (
    <AdminNotificationsDashboard
      overview={overview}
      updatedState={updatedState}
      noticeId={noticeId}
    />
  )
}
