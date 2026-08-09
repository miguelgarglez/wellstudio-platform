'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { OperationToast } from '@/components/ui/operation-toast'
import type { MemberCheckoutNotice } from '@/modules/members/server/member-account-overview'

const CHECKOUT_POLL_DELAYS_MS = [900, 1_400, 2_200, 3_500, 5_000, 6_000] as const

export function MemberCheckoutFeedback({ notice }: { notice: MemberCheckoutNotice }) {
  if (!notice) return null

  return <CheckoutFeedbackSession key={`${notice.instanceKey}-${notice.kind}`} notice={notice} />
}

function CheckoutFeedbackSession({ notice }: { notice: NonNullable<MemberCheckoutNotice> }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [pollCycle, setPollCycle] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (notice.kind !== 'processing') return

    let canceled = false
    let timeout: number | null = null
    let attempt = 0

    function scheduleNextRefresh() {
      if (attempt >= CHECKOUT_POLL_DELAYS_MS.length) {
        setTimedOut(true)
        return
      }

      timeout = window.setTimeout(() => {
        if (canceled) return
        startTransition(() => router.refresh())
        attempt += 1
        scheduleNextRefresh()
      }, CHECKOUT_POLL_DELAYS_MS[attempt])
    }

    scheduleNextRefresh()

    return () => {
      canceled = true
      if (timeout) window.clearTimeout(timeout)
    }
  }, [notice.kind, pollCycle, router])

  function clearCheckoutContext() {
    router.replace('/app/account', { scroll: false })
  }

  function checkAgain() {
    setTimedOut(false)
    setPollCycle((cycle) => cycle + 1)
    startTransition(() => router.refresh())
  }

  if (notice.kind === 'processing' && timedOut) {
    return (
      <OperationToast
        title="La confirmación tarda más de lo habitual"
        description="Esto no significa que el pago haya fallado. Puedes comprobar de nuevo mientras el proveedor termina de responder."
        duration={null}
        variant="processing"
        actionLabel="Comprobar ahora"
        actionPending={isRefreshing}
        onAction={checkAgain}
        onDismiss={clearCheckoutContext}
      />
    )
  }

  return (
    <OperationToast
      title={notice.title}
      description={notice.description}
      duration={notice.kind === 'processing' ? null : 8_000}
      variant={notice.kind === 'canceled' ? 'neutral' : notice.kind === 'failed' ? 'error' : notice.kind}
      onDismiss={clearCheckoutContext}
    />
  )
}
