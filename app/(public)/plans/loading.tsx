import { PublicContentShell } from '@/modules/public/ui/public-content-shell'
import { PublicPlansSkeleton } from '@/modules/public/ui/plans/public-plans-skeleton'

export default function PlansLoading() {
  return (
    <PublicContentShell>
      <PublicPlansSkeleton />
    </PublicContentShell>
  )
}
