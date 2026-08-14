import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'

import { buildAdminShellSummary } from '@/modules/admin/server/admin-shell-summary'
import { resolveAdminAccess } from '@/modules/auth/server/identity'
import { AdminShell } from '@/modules/admin/ui/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const access = await resolveAdminAccess()

  if (access.kind === 'unauthenticated') {
    redirect('/login?redirectTo=/admin')
  }

  if (access.kind === 'forbidden') {
    notFound()
  }

  const summary = buildAdminShellSummary(access.context)

  return <AdminShell summary={summary}>{children}</AdminShell>
}
