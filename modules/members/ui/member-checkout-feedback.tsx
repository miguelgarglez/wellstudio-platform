'use client'

import { OperationToast } from '@/components/ui/operation-toast'
import type { MemberCheckoutNotice } from '@/modules/members/server/member-account-overview'

export function MemberCheckoutFeedback({ notice }: { notice: MemberCheckoutNotice }) {
  if (!notice) return null

  return (
    <OperationToast
      title={notice.title}
      description={notice.description}
      duration={notice.kind === 'processing' ? 12_000 : 8_000}
      variant={notice.kind === 'canceled' ? 'neutral' : notice.kind === 'failed' ? 'error' : notice.kind}
    />
  )
}
