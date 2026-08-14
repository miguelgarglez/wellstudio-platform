'use client'

import { useEffect } from 'react'
import { Barlow_Condensed, Manrope } from 'next/font/google'

import { UnhandledErrorRetryButton } from '@/modules/public/ui/unhandled-error-retry-button'
import { RootUnhandledErrorPage } from '@/modules/public/ui/root-unhandled-error-page'
import { cn } from '@/lib/utils'
import '@/app/globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled root layout error', error)
  }, [error])

  return (
    <html
      lang="es"
      className={cn('font-sans', manrope.variable, barlowCondensed.variable)}
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--wellstudio-ink)]"
        >
          Saltar al contenido principal
        </a>
        <RootUnhandledErrorPage
          digest={error.digest}
          leadingAction={<UnhandledErrorRetryButton onRetry={() => reset()} />}
        />
      </body>
    </html>
  )
}
