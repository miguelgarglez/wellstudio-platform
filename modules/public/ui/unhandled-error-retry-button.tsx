'use client'

import { Button } from '@/components/ui/button'

type UnhandledErrorRetryButtonProps = {
  onRetry: () => void
}

export function UnhandledErrorRetryButton({ onRetry }: UnhandledErrorRetryButtonProps) {
  return (
    <Button
      size="lg"
      className="rounded-full bg-[var(--wellstudio-blue)] px-6 text-[var(--wellstudio-ink)] shadow-[0_18px_38px_rgba(79,137,197,0.22)] transition-[background-color,border-color,color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_86%,white)] active:scale-[0.98] sm:min-w-36"
      onClick={onRetry}
    >
      Reintentar
    </Button>
  )
}
