import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminNotificationsDashboardSkeleton } from '@/modules/admin/ui/admin-notifications-dashboard'

export default function AdminNotificationsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Comunicaciones"
      title="Entregas"
      description="Supervisa los emails transaccionales, localiza incidencias y recupera una entrega fallida sin perder su historial."
    >
      <AdminNotificationsDashboardSkeleton />
    </AdminSectionShell>
  )
}
