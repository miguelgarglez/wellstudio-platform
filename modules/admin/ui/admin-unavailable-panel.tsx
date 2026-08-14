import type { ReactNode } from 'react'
import Link from 'next/link'
import { CircleAlert } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

type AdminUnavailablePanelProps = {
  actions: ReactNode
  layout?: 'page' | 'section'
}

export function AdminUnavailablePanel({
  actions,
  layout = 'section',
}: AdminUnavailablePanelProps) {
  return (
    <div
      className={cn(
        'grid place-items-center text-center',
        layout === 'page' ? 'min-h-[70vh] px-5 py-12' : 'min-h-[24rem] p-6',
      )}
    >
      <section
        className={cn(
          'max-w-lg',
          layout === 'page' &&
            'rounded-[1.65rem] border border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] bg-[color:color-mix(in_srgb,var(--card)_90%,white)] px-6 py-8 shadow-[0_18px_42px_rgba(18,20,24,0.06)] sm:px-8',
        )}
      >
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
          <CircleAlert aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--wellstudio-blue-deep)]">
          Panel no disponible
        </p>
        <h2 className="mt-2 text-xl font-medium text-[var(--wellstudio-ink)]">
          No hemos podido cargar esta vista
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          La sesión sigue activa. Vuelve a intentarlo en unos segundos; si persiste, el origen
          suele ser una saturación temporal del entorno.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions}
        </div>
      </section>
    </div>
  )
}

export function AdminOverviewUnavailable({ retryHref }: { retryHref: string }) {
  return (
    <AdminUnavailablePanel
      actions={(
        <>
          <Link
            href={retryHref}
            className={cn(buttonVariants({ size: 'lg' }), 'rounded-full px-6')}
          >
            Reintentar
          </Link>
          {retryHref === '/admin' ? null : (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-full px-6')}
            >
              Volver al resumen
            </Link>
          )}
        </>
      )}
    />
  )
}
