import { AdminMembersDashboardSkeleton } from '@/modules/admin/ui/admin-members-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminMembersLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Socios"
      title="Gestión de socios"
      description="Localiza un socio y reúne su cuenta, cobertura comercial y actividad reciente antes de operar en otros flujos."
    >
      <AdminMembersDashboardSkeleton />
    </AdminSectionShell>
  )
}
