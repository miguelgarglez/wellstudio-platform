'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminOperationToastState =
  | 'extra'
  | 'session'
  | 'revoked'
  | 'revoke-error'
  | 'policy-saved'
  | null

type AdminOperationToastProps = {
  state: AdminOperationToastState
  variant?: 'fixed' | 'inline'
}

const TOAST_COPY: Record<
  Exclude<AdminOperationToastState, null>,
  {
    tone: 'success' | 'error'
    title: string
    description: string
  }
> = {
  extra: {
    tone: 'success',
    title: 'Reservas extra concedidas',
    description: 'La excepción ya está registrada y aparece en el historial del socio.',
  },
  session: {
    tone: 'success',
    title: 'Acceso puntual concedido',
    description: 'El socio ya puede acceder a esa sesión mediante una excepción auditable.',
  },
  revoked: {
    tone: 'success',
    title: 'Excepción revocada',
    description: 'La revocación queda persistida sin borrar la trazabilidad previa.',
  },
  'revoke-error': {
    tone: 'error',
    title: 'No hemos podido revocar la excepción',
    description: 'Recarga la vista y vuelve a intentarlo en unos segundos.',
  },
  'policy-saved': {
    tone: 'success',
    title: 'Política guardada',
    description: 'La política explícita ya está persistida y la vista se ha recargado con el estado actualizado.',
  },
}

export function AdminOperationToast({
  state,
  variant = 'fixed',
}: AdminOperationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!state) {
      return
    }

    const timeout = window.setTimeout(() => {
      setIsVisible(false)
    }, 5200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state])

  if (!state || !isVisible) {
    return null
  }

  const copy = TOAST_COPY[state]
  const Icon = copy.tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      role={copy.tone === 'error' ? 'alert' : 'status'}
      aria-live={copy.tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        variant === 'fixed'
          ? 'pointer-events-none fixed inset-x-3 top-3 z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:block'
          : 'pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center',
      )}
    >
      <div
        className={cn(
          'wellstudio-admin-toast pointer-events-auto w-full max-w-[24rem] rounded-[1.2rem] border bg-white/96 p-3.5 shadow-[0_18px_52px_rgba(18,20,24,0.16)] backdrop-blur-xl',
          copy.tone === 'success'
            ? 'border-[color:color-mix(in_srgb,#5ba774_34%,white)]'
            : 'border-[color:color-mix(in_srgb,var(--destructive)_34%,white)]',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
              copy.tone === 'success'
                ? 'bg-[color:color-mix(in_srgb,#5ba774_14%,white)] text-[#3f7d57]'
                : 'bg-[color:color-mix(in_srgb,var(--destructive)_10%,white)] text-destructive',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--wellstudio-ink)]">{copy.title}</p>
            <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_72%,white)]">
              {copy.description}
            </p>
            {copy.tone === 'success' && state !== 'policy-saved' ? (
              <a
                href="#admin-override-history"
                className="mt-2 inline-flex text-xs font-medium uppercase tracking-[0.16em] text-[var(--wellstudio-blue-deep)] underline-offset-4 hover:underline"
              >
                Ver historial
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-mr-1 -mt-1 shrink-0 rounded-full"
            onClick={() => setIsVisible(false)}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Cerrar notificación</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
