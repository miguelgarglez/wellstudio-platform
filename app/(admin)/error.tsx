'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { AdminUnavailablePanel } from '@/modules/admin/ui/admin-unavailable-panel'
import { cn } from '@/lib/utils'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin route error boundary', error)
  }, [error])

  return (
    <AdminUnavailablePanel
      actions={(
        <>
          <Button
            size="lg"
            className="rounded-full px-6"
            onClick={() => reset()}
          >
            Reintentar
          </Button>
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-full px-6')}
          >
            Volver al resumen
          </Link>
        </>
      )}
    />
  )
}
