import { Suspense } from 'react'

import { readIncludeSandboxFixtures } from '@/lib/sandbox-fixture-request'
import {
  cancelMemberReservationAction,
  joinSessionWaitlistAction,
  leaveSessionWaitlistAction,
  reservePublishedSessionAction,
} from '@/app/(member)/app/reservations/actions'
import { getMemberReservationsOverview } from '@/modules/reservations/server/member-reservations-overview'
import {
  MemberReservationsDashboardBody,
  MemberReservationsHeroCard,
} from '@/modules/reservations/ui/member-reservations-dashboard'
import {
  MemberReservationsDashboardBodySkeleton,
  MemberReservationsBookingStateSkeleton,
  MemberReservationsSummaryPillsSkeleton,
} from '@/modules/reservations/ui/member-reservations-dashboard-skeleton'

export default function MemberReservationsPage() {
  return (
    <section className="space-y-5 lg:space-y-6">
      <MemberReservationsHeroCard
        summaryContent={
          <Suspense fallback={<MemberReservationsSummaryPillsSkeleton />}>
            <MemberReservationsSummaryLabels />
          </Suspense>
        }
        advisoryContent={
          <Suspense fallback={<MemberReservationsBookingStateSkeleton />}>
            <MemberReservationsHeroAdvisory />
          </Suspense>
        }
      />
      <Suspense fallback={<MemberReservationsDashboardBodySkeleton />}>
        <MemberReservationsBody />
      </Suspense>
    </section>
  )
}

async function MemberReservationsSummaryLabels() {
  const overview = await getMemberReservationsOverview(await readIncludeSandboxFixtures())

  return (
    <>
      {overview.summaryLabels.map((label, index) => (
        <span
          key={label}
          className={
            [
              'inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_16%,white)] bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]',
              index > 0 ? 'hidden sm:inline-flex' : '',
            ].join(' ')
          }
        >
          {label}
        </span>
      ))}

    </>
  )
}

async function MemberReservationsHeroAdvisory() {
  const overview = await getMemberReservationsOverview(await readIncludeSandboxFixtures())

  if (overview.bookingState.canBook) {
    return null
  }

  return (
    <div className="hidden rounded-[1.6rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_18%,white)] bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_8%,white)] px-5 py-4 sm:block sm:px-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--wellstudio-blue-deep)]">
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--wellstudio-ink)]">
            {overview.bookingState.advisoryLabel}
          </p>
          <p className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
            {overview.bookingState.description}
          </p>
        </div>
      </div>
    </div>
  )
}

async function MemberReservationsBody() {
  const overview = await getMemberReservationsOverview(await readIncludeSandboxFixtures())

  return (
    <MemberReservationsDashboardBody
      overview={overview}
      actions={{
        reserve: reservePublishedSessionAction,
        cancel: cancelMemberReservationAction,
        joinWaitlist: joinSessionWaitlistAction,
        leaveWaitlist: leaveSessionWaitlistAction,
      }}
    />
  )
}
