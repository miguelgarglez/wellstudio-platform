import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminMemberOverridesDashboardSkeleton } from '@/modules/admin/ui/admin-member-overrides-dashboard'

export default function AdminOverridesLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Overrides"
      title="Overrides por socio"
      description="Busca un socio, revisa sus memberships activas y concede excepciones auditables sin salir de una workspace operativa y trazable."
    >
      <AdminMemberOverridesDashboardSkeleton />
    </AdminSectionShell>
  )
}
