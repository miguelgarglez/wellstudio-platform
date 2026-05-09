import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { MemberAccountDashboardSkeletonBody } from '@/modules/members/ui/member-account-dashboard'
import { MemberProfileDashboardSkeletonBody } from '@/modules/members/ui/member-profile-dashboard'

type MemberPortalSectionSkeletonProps = {
  eyebrow: string
  content: ReactNode
}

export function MemberPortalSectionSkeleton({
  eyebrow,
  content,
}: MemberPortalSectionSkeletonProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--wellstudio-blue-deep)]">
          {eyebrow}
        </p>
        <div className="space-y-3">
          <Skeleton className="h-11 w-full max-w-[18rem] rounded-[1rem] sm:h-14 sm:max-w-[22rem] lg:max-w-[26rem]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-3xl rounded-full" />
            <Skeleton className="h-4 w-full max-w-[34rem] rounded-full" />
            <Skeleton className="h-4 w-3/4 max-w-[26rem] rounded-full" />
          </div>
        </div>
      </header>
      {content}
    </section>
  )
}

export function MemberProfileSectionSkeleton() {
  return (
    <MemberPortalSectionSkeleton
      eyebrow="Perfil"
      content={<MemberProfileDashboardSkeletonBody />}
    />
  )
}

export function MemberAccountSectionSkeleton() {
  return (
    <MemberPortalSectionSkeleton
      eyebrow="Cuenta"
      content={<MemberAccountDashboardSkeletonBody />}
    />
  )
}
