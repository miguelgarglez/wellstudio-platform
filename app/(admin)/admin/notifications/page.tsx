import { Suspense } from 'react'

import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminOverviewUnavailable } from '@/modules/admin/ui/admin-unavailable-panel'
import {
  AdminNotificationsDashboard,
  AdminNotificationsDashboardSkeleton,
} from '@/modules/admin/ui/admin-notifications-dashboard'
import { getAdminNotificationDeliveryOverview } from '@/modules/notifications/server/admin-notification-deliveries'
import { readAdminOverview } from '@/modules/admin/server/admin-overview-result'

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
  const overview = await readAdminOverview(() =>
    getAdminNotificationDeliveryOverview({
      status,
      event,
      selectedJobId,
    }),
  )
  if (!overview.ok) return <AdminOverviewUnavailable retryHref="/admin/notifications" />

  return (
    <AdminNotificationsDashboard
      overview={overview.data}
      updatedState={updatedState}
      noticeId={noticeId}
    />
  )
}
