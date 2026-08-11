import { AdminSessionsDashboardSkeleton } from '@/modules/admin/ui/admin-sessions-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminSessionsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Agenda"
      title="Agenda de sesiones"
      description="Programa y publica sesiones: capacidad, coach y estado en un solo sitio."
    >
      <AdminSessionsDashboardSkeleton />
    </AdminSectionShell>
  )
}
