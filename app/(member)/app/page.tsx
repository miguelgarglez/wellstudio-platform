import { Suspense } from 'react'

import { getMemberHomeOverview } from '@/modules/members/server/member-home-overview'
import {
  MemberHomeDashboardBody,
  MemberHomeHeroCard,
} from '@/modules/members/ui/member-home-dashboard'
import {
  MemberHomeDashboardBodySkeleton,
  MemberHomeFooterMetaSkeleton,
  MemberHomeSummaryPillsSkeleton,
} from '@/modules/members/ui/member-home-dashboard-skeleton'

export default function MemberAppPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.88fr)] lg:gap-5">
      <MemberHomeHeroCard
        activitySummaryContent={
          <Suspense fallback={<MemberHomeSummaryPillsSkeleton />}>
            <MemberHomeSummaryPills />
          </Suspense>
        }
        footerMetaContent={
          <Suspense fallback={<MemberHomeFooterMetaSkeleton />}>
            <MemberHomeFooterMeta />
          </Suspense>
        }
      />
      <Suspense fallback={<MemberHomeDashboardBodySkeleton />}>
        <MemberHomeBody />
      </Suspense>
    </div>
  )
}

async function MemberHomeSummaryPills() {
  const overview = await getMemberHomeOverview()

  return (
    <>
      <span className="rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white/72 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        {overview.summary.memberStatusLabel}
      </span>
      <span className="rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-white/72 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        {overview.activitySummaryLabel}
      </span>
    </>
  )
}

async function MemberHomeFooterMeta() {
  const overview = await getMemberHomeOverview()

  return (
    <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
      {overview.summary.displayName} · {overview.summary.email}
    </p>
  )
}

async function MemberHomeBody() {
  const overview = await getMemberHomeOverview()

  return <MemberHomeDashboardBody overview={overview} />
}
