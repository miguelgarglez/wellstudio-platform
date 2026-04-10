import { MemberHomeHeroCard } from '@/modules/members/ui/member-home-dashboard'
import {
  MemberHomeDashboardBodySkeleton,
  MemberHomeHeroMetaSkeleton,
} from '@/modules/members/ui/member-home-dashboard-skeleton'

export default function MemberAppLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.88fr)] lg:gap-5">
      <MemberHomeHeroCard
        activitySummaryContent={<MemberHomeHeroMetaSkeleton />}
        footerMetaContent={null}
      />
      <MemberHomeDashboardBodySkeleton />
    </div>
  )
}
