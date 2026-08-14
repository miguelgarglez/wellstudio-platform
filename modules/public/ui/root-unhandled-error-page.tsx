import type { ReactNode } from 'react'

import { NotFoundPanel } from '@/components/ui/not-found-panel'
import {
  getUnhandledErrorActions,
  UNHANDLED_ERROR_COPY,
} from '@/modules/public/ui/unhandled-error-actions'

type RootUnhandledErrorPageProps = {
  digest?: string
  leadingAction?: ReactNode
}

export function RootUnhandledErrorPage({
  digest,
  leadingAction,
}: RootUnhandledErrorPageProps) {
  return (
    <NotFoundPanel
      code={UNHANDLED_ERROR_COPY.code}
      asideEyebrow={UNHANDLED_ERROR_COPY.asideEyebrow}
      eyebrow={UNHANDLED_ERROR_COPY.eyebrow}
      title={UNHANDLED_ERROR_COPY.title}
      description={UNHANDLED_ERROR_COPY.description}
      note={UNHANDLED_ERROR_COPY.note}
      digest={digest}
      leadingAction={leadingAction}
      actions={getUnhandledErrorActions()}
      shellClassName="wellstudio-landing-shell"
    />
  )
}
