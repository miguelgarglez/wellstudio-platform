import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'
import { AdminMemberOverridesDashboardSkeleton } from '@/modules/admin/ui/admin-member-overrides-dashboard'

export default function AdminOverridesLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Excepciones"
      title="Excepciones de reserva"
      description="Busca un socio, confirma la membership o sesión implicada y registra excepciones auditables sin tocar la política base."
    >
      <AdminMemberOverridesDashboardSkeleton />
    </AdminSectionShell>
  )
}
