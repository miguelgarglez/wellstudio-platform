import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPublicSessionDetail } from '@/modules/public/server/public-schedule'
import { PublicSessionDetailPage } from '@/modules/public/ui/schedule/public-session-detail-page'

type PublicSessionPageProps = {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: PublicSessionPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const session = await getPublicSessionDetail(sessionId)

  if (!session) {
    notFound()
  }

  const title = `${session.classTypeName} | Agenda WellStudio`
  const description = `${session.classTypeName} con ${session.coachName}. Consulta horario, ubicación y disponibilidad antes de reservar.`

  return {
    title,
    description,
    alternates: { canonical: `/classes/${session.id}` },
    openGraph: {
      title,
      description,
      url: `/classes/${session.id}`,
      siteName: 'WellStudio',
      locale: 'es_ES',
      type: 'website',
    },
  }
}

export default async function PublicSessionPage({ params }: PublicSessionPageProps) {
  const { sessionId } = await params
  const session = await getPublicSessionDetail(sessionId)

  if (!session) notFound()

  return <PublicSessionDetailPage session={session} />
}
