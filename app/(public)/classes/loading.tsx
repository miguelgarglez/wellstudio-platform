import { PublicContentShell } from '@/modules/public/ui/public-content-shell'
import { PublicScheduleSkeleton } from '@/modules/public/ui/schedule/public-schedule-skeleton'

export default function ClassesLoading() {
  return (
    <PublicContentShell>
      <PublicScheduleSkeleton />
    </PublicContentShell>
  )
}
