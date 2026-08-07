import type { Metadata } from 'next'
import { Suspense } from 'react'

import { getPublicSchedule } from '@/modules/public/server/public-schedule'
import { PublicSchedulePage } from '@/modules/public/ui/schedule/public-schedule-page'
import { PublicScheduleSkeleton } from '@/modules/public/ui/schedule/public-schedule-skeleton'

const title = 'Agenda de clases | WellStudio Madrid'
const description =
  'Consulta las próximas sesiones publicadas por WellStudio, su horario, coach y disponibilidad antes de reservar desde el portal.'

// Availability changes outside this route when members book or staff publish sessions.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/classes' },
  openGraph: {
    title,
    description,
    url: '/classes',
    siteName: 'WellStudio',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<PublicScheduleSkeleton />}>
      <ClassesContent />
    </Suspense>
  )
}

async function ClassesContent() {
  const schedule = await getPublicSchedule()

  return <PublicSchedulePage schedule={schedule} />
}
