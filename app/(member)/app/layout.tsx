import { MemberPortalShell } from '@/modules/members/ui/member-portal-shell'
import { getAuthenticatedMemberShellSummary } from '@/modules/members/server/member-shell-summary'

type MemberAppLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default async function MemberAppLayout({
  children,
}: MemberAppLayoutProps) {
  const summary = await getAuthenticatedMemberShellSummary()

  return <MemberPortalShell summary={summary}>{children}</MemberPortalShell>
}
