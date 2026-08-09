'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function OperationToast({
  title,
  description,
  duration = 5_000,
  className,
  variant = 'success',
}: {
  title: string
  description: string
  duration?: number
  className?: string
  variant?: 'success' | 'neutral' | 'error' | 'processing'
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), duration)
    return () => window.clearTimeout(timeout)
  }, [duration])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[70] mx-auto flex max-w-md items-start gap-3 rounded-[1.35rem] border bg-white px-4 py-4 text-[var(--wellstudio-ink)] shadow-[0_24px_60px_rgba(18,20,24,0.2)] animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none lg:bottom-6',
        variant === 'success' && 'border-emerald-700/16',
        variant === 'error' && 'border-destructive/20',
        (variant === 'neutral' || variant === 'processing') && 'border-[var(--wellstudio-blue)]/18',
        className,
      )}
    >
      <span className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
        variant === 'success' && 'bg-emerald-50 text-emerald-700',
        variant === 'error' && 'bg-destructive/8 text-destructive',
        (variant === 'neutral' || variant === 'processing') && 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_9%,white)] text-[var(--wellstudio-blue-deep)]',
      )}>
        {variant === 'success' ? <CheckCircle2 className="size-4" aria-hidden="true" /> : null}
        {variant === 'error' ? <AlertCircle className="size-4" aria-hidden="true" /> : null}
        {variant === 'neutral' ? <X className="size-4" aria-hidden="true" /> : null}
        {variant === 'processing' ? <Clock3 className="size-4" aria-hidden="true" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground)_70%,white)]">
          {description}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-mr-2 -mt-2 shrink-0"
        onClick={() => setVisible(false)}
      >
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Cerrar confirmación</span>
      </Button>
    </div>
  )
}
