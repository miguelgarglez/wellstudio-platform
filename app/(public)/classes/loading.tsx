import { PublicScheduleShell } from '@/modules/public/ui/schedule/public-schedule-shell'
import { PublicScheduleSkeleton } from '@/modules/public/ui/schedule/public-schedule-skeleton'

export default function ClassesLoading() {
  return (
    <PublicScheduleShell>
      <PublicScheduleSkeleton />
    </PublicScheduleShell>
  )
}
