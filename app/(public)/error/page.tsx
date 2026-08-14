import type { Metadata } from 'next'

import { RootUnhandledErrorPage } from '@/modules/public/ui/root-unhandled-error-page'

export const metadata: Metadata = {
  title: 'No hemos podido cargar esta página | WellStudio',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PublicErrorPage() {
  return <RootUnhandledErrorPage />
}
