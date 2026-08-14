import { notFound } from 'next/navigation'

import { isShowcaseRoutesEnabled } from '@/lib/deployment-environment'

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  if (!isShowcaseRoutesEnabled()) {
    notFound()
  }

  return children
}
