import { AdminClassCatalogDashboardSkeleton } from '@/modules/admin/ui/admin-class-catalog-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminClassCatalogLoading() {
  return <AdminSectionShell eyebrow="Admin · Agenda · Catálogo" title="Catálogo de clases" description="Mantén los tipos de clase y el equipo que Agenda necesita para programar sesiones reales."><AdminClassCatalogDashboardSkeleton /></AdminSectionShell>
}
