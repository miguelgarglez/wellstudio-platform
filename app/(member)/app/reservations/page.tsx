import {
  cancelMemberReservationAction,
  joinSessionWaitlistAction,
  leaveSessionWaitlistAction,
  reservePublishedSessionAction,
} from '@/app/(member)/app/reservations/actions'
import { getMemberReservationsOverview } from '@/modules/reservations/server/member-reservations-overview'
import { MemberReservationsDashboard } from '@/modules/reservations/ui/member-reservations-dashboard'

export default async function MemberReservationsPage() {
  const overview = await getMemberReservationsOverview()

  return (
    <MemberReservationsDashboard
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
