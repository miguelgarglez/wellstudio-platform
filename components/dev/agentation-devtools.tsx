'use client'

import dynamic from 'next/dynamic'

const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false },
)

const DEFAULT_AGENTATION_ENDPOINT = 'http://localhost:4747'

export function AgentationDevtools() {
  const isEnabled =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_AGENTATION_ENABLED === 'true'

  if (!isEnabled) {
    return null
  }

  const endpoint =
    process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT?.trim() ||
    DEFAULT_AGENTATION_ENDPOINT

  return (
    <Agentation
      endpoint={endpoint}
      className="z-[2000]"
      onSessionCreated={(sessionId) => {
        console.info('[Agentation] Session created:', sessionId)
      }}
    />
  )
}
