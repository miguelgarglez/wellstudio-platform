'use client'

import { useEffect } from 'react'

import { UnhandledErrorRetryButton } from '@/modules/public/ui/unhandled-error-retry-button'
import { RootUnhandledErrorPage } from '@/modules/public/ui/root-unhandled-error-page'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error', error)
  }, [error])

  return (
    <RootUnhandledErrorPage
      digest={error.digest}
      leadingAction={<UnhandledErrorRetryButton onRetry={() => reset()} />}
    />
  )
}
