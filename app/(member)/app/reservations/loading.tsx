import { MemberReservationsHeroCard } from '@/modules/reservations/ui/member-reservations-dashboard'
import {
  MemberReservationsBookingStateSkeleton,
  MemberReservationsDashboardBodySkeleton,
  MemberReservationsSummaryPillsSkeleton,
} from '@/modules/reservations/ui/member-reservations-dashboard-skeleton'

export default function MemberReservationsLoading() {
  return (
    <section className="space-y-5 lg:space-y-6">
      <MemberReservationsHeroCard
        summaryContent={<MemberReservationsSummaryPillsSkeleton />}
        advisoryContent={<MemberReservationsBookingStateSkeleton />}
      />
      <MemberReservationsDashboardBodySkeleton />
    </section>
  )
}
