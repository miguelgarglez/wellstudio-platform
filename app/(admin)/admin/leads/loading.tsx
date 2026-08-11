import { AdminLeadsDashboardSkeleton } from '@/modules/admin/ui/admin-leads-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLeadsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Solicitudes"
      title="Solicitudes de contacto"
      description="Revisa las solicitudes de la web, busca por contacto y actualiza su estado."
    >
      <AdminLeadsDashboardSkeleton />
    </AdminSectionShell>
  )
}
