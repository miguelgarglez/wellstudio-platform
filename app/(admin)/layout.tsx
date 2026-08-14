import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button-variants'
import { buildAdminShellSummary } from '@/modules/admin/server/admin-shell-summary'
import { resolveAdminAccess } from '@/modules/auth/server/identity'
import { AdminShell } from '@/modules/admin/ui/admin-shell'
import { AdminUnavailablePanel } from '@/modules/admin/ui/admin-unavailable-panel'
import { cn } from '@/lib/utils'

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

  if (access.kind === 'unavailable') {
    return (
      <AdminUnavailablePanel
        layout="page"
        actions={(
          <>
            <Link
              href="/admin"
              className={cn(buttonVariants({ size: 'lg' }), 'rounded-full px-6')}
            >
              Reintentar
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-full px-6')}
            >
              Inicio público
            </Link>
          </>
        )}
      />
    )
  }

  const summary = buildAdminShellSummary(access.context)

  return <AdminShell summary={summary}>{children}</AdminShell>
}
