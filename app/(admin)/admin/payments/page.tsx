import { Suspense } from 'react'

import { getAdminPaymentsOverview } from '@/modules/admin/server/admin-payments-overview'
import { AdminPaymentsDashboard, AdminPaymentsDashboardSkeleton } from '@/modules/admin/ui/admin-payments-dashboard'
import { AdminSectionShell } from '@/modules/admin/ui/admin-section-shell'

type AdminPaymentsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; payment?: string }>
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const params = searchParams ? await searchParams : undefined

  return (
    <AdminSectionShell
      eyebrow="Admin · Comercio"
      title="Cobros"
      description="Supervisa pagos, localiza incidencias y comprueba la salud de sus eventos sin modificar el historial financiero."
    >
      <Suspense fallback={<AdminPaymentsDashboardSkeleton />}>
        <AdminPaymentsSection
          query={typeof params?.q === 'string' ? params.q : null}
          status={typeof params?.status === 'string' ? params.status : null}
          selectedPaymentId={typeof params?.payment === 'string' ? params.payment : null}
        />
      </Suspense>
    </AdminSectionShell>
  )
}

async function AdminPaymentsSection({ query, status, selectedPaymentId }: { query: string | null; status: string | null; selectedPaymentId: string | null }) {
  const overview = await getAdminPaymentsOverview({ query, status, selectedPaymentId })
  return <AdminPaymentsDashboard overview={overview} />
}
