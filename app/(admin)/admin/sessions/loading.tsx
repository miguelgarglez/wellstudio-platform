import { AdminSessionsDashboardSkeleton } from '@/modules/admin/ui/admin-sessions-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminSessionsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Agenda"
      title="Agenda de sesiones"
      description="Programa, publica y opera las sesiones del estudio con capacidad, coach y trazabilidad en un único espacio."
    >
      <AdminSessionsDashboardSkeleton />
    </AdminSectionShell>
  )
}
