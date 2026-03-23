import { MemberPortalShell } from '@/modules/members/ui/member-portal-shell'
import { getAuthenticatedMemberShellSummary } from '@/modules/members/server/member-shell-summary'

export default async function MemberAppLayout({
  children,
  params,
}: LayoutProps<'/app'>) {
  await params
  const summary = await getAuthenticatedMemberShellSummary()

  return <MemberPortalShell summary={summary}>{children}</MemberPortalShell>
}
