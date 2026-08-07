import { AdminHomeDashboardSkeleton } from '@/modules/admin/ui/admin-home-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Resumen"
      title="Control de hoy"
      description="Una lectura breve de la jornada y de las señales que requieren una decisión. Cada bloque abre la superficie donde se resuelve."
    >
      <AdminHomeDashboardSkeleton />
    </AdminSectionShell>
  )
}
