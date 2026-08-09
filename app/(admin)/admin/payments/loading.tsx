import { AdminPaymentsDashboardSkeleton } from '@/modules/admin/ui/admin-payments-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

export default function AdminPaymentsLoading() {
  return (
    <AdminSectionShell
      eyebrow="Admin · Comercio"
      title="Cobros"
      description="Supervisa pagos, localiza incidencias y comprueba la salud de sus eventos sin modificar el historial financiero."
    >
      <AdminPaymentsDashboardSkeleton />
    </AdminSectionShell>
  )
}
