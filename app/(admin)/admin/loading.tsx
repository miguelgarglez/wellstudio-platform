import { AdminMembershipPoliciesDashboardSkeleton } from '@/modules/admin/ui/admin-membership-policies-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Memberships"
      title="Políticas de reserva"
      description="Configura la política efectiva de cada membership plan sin tocar overrides individuales ni mezclar esta superficie con el portal del socio."
    >
      <AdminMembershipPoliciesDashboardSkeleton />
    </AdminSectionShell>
  )
}
