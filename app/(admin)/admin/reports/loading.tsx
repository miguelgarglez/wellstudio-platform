import { AdminReportsDashboardSkeleton } from '@/modules/admin/ui/admin-reports-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminReportsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Rendimiento"
      title="Informes"
      description="Lee actividad, ocupación y captación con ventanas y denominadores explícitos. Sin mezclar datos sandbox con ingresos ni presentar estimaciones como hechos."
    >
      <AdminReportsDashboardSkeleton />
    </AdminSectionShell>
  )
}
