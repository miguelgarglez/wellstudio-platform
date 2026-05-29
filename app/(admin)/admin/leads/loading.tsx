import { AdminLeadsDashboardSkeleton } from '@/modules/admin/ui/admin-leads-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLeadsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Solicitudes"
      title="Solicitudes de contacto"
      description="Revisa las solicitudes captadas desde la web, busca por datos de contacto y mantén su estado operativo al día."
    >
      <AdminLeadsDashboardSkeleton />
    </AdminSectionShell>
  )
}
