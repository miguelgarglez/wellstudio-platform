import { AdminHomeDashboardSkeleton } from '@/modules/admin/ui/admin-home-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Resumen"
      title="Control de hoy"
      description="Resumen de la jornada y lo que necesita atención. Cada bloque abre la pantalla donde se resuelve."
    >
      <AdminHomeDashboardSkeleton />
    </AdminSectionShell>
  )
}
