import { AdminMembersDashboardSkeleton } from '@/modules/admin/ui/admin-members-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminMembersLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Socios"
      title="Gestión de socios"
      description="Busca un socio y revisa su cuenta, plan, créditos y actividad reciente."
    >
      <AdminMembersDashboardSkeleton />
    </AdminSectionShell>
  )
}
