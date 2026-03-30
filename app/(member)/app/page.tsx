import { getMemberHomeOverview } from '@/modules/members/server/member-home-overview'
import { MemberHomeDashboard } from '@/modules/members/ui/member-home-dashboard'

export default async function MemberAppPage() {
  const overview = await getMemberHomeOverview()

  return <MemberHomeDashboard overview={overview} />
}
