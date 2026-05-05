import { AdminMembershipPoliciesDashboardSkeleton } from '@/modules/admin/ui/admin-membership-policies-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Reglas"
      title="Reglas de reserva"
      description="Define qué puede reservar cada membership plan sin tocar excepciones individuales ni mezclar esta superficie con el portal del socio."
    >
      <AdminMembershipPoliciesDashboardSkeleton />
    </AdminSectionShell>
  )
}
