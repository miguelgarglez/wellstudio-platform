import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

import { requireAdminOrStaffContext } from '@/modules/auth/server/identity'
import { getAuthenticatedAdminShellSummary } from '@/modules/admin/server/admin-shell-summary'
import { AdminShell } from '@/modules/admin/ui/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const authContext = await requireAdminOrStaffContext()

  if (!authContext) {
    notFound()
  }

  const summary = await getAuthenticatedAdminShellSummary()

  return <AdminShell summary={summary}>{children}</AdminShell>
}
