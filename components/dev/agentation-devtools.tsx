'use client'

import { AgentationBridge } from '@/components/dev/agentation-bridge'

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

  return <AgentationBridge endpoint={endpoint} />
}
