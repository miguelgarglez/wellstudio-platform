'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ensureAgentationProjectIsolation,
  getAgentationScopedSessionKey,
} from '@/lib/agentation'

const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false },
)

type AgentationBridgeProps = Readonly<{
  endpoint: string
}>

type AgentationBridgeState = Readonly<{
  readyPathname: string | null
  sessionId?: string
}>

export function AgentationBridge({ endpoint }: AgentationBridgeProps) {
  const pathname = usePathname()
  const [state, setState] = useState<AgentationBridgeState>({
    readyPathname: null,
  })

  useEffect(() => {
    if (!pathname) {
      return
    }

    try {
      const isolatedSessionId = ensureAgentationProjectIsolation(
        window.localStorage,
        pathname,
        window.location.origin,
      )

      setState({
        readyPathname: pathname,
        sessionId: isolatedSessionId ?? undefined,
      })
    } catch (error) {
      console.warn('[Agentation] Failed to initialize project isolation', error)
      setState({
        readyPathname: pathname,
        sessionId: undefined,
      })
    }
  }, [pathname])

  if (!pathname || state.readyPathname !== pathname) {
    return null
  }

  return (
    <Agentation
      key={pathname}
      endpoint={endpoint}
      sessionId={state.sessionId}
      className="z-[2000]"
      onSessionCreated={(nextSessionId) => {
        try {
          const scopedSessionKey = getAgentationScopedSessionKey(
            window.location.origin,
            pathname,
          )

          window.localStorage.setItem(scopedSessionKey, nextSessionId)
        } catch (error) {
          console.warn('[Agentation] Failed to persist project session', error)
        }

        setState({
          readyPathname: pathname,
          sessionId: nextSessionId,
        })
      }}
    />
  )
}
