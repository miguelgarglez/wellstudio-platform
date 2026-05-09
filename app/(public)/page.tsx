import type { Metadata } from 'next'

import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import { PublicLandingPage } from '@/modules/public/ui/landing/public-landing-page'
import { resolvePublicUrl } from '@/lib/site-metadata'

const homeTitle = 'Entrenamiento de Fuerza en Madrid | WellStudio'
const homeDescription =
  'Centro boutique de entrenamiento de fuerza en Madrid con grupos reducidos, seguimiento profesional y metodología propia.'
const socialImageUrl =
  resolvePublicUrl(heroBarbellImage.src) ?? heroBarbellImage.src

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: '/',
    siteName: 'WellStudio',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: socialImageUrl,
        width: heroBarbellImage.width,
        height: heroBarbellImage.height,
        alt: 'Entrenamiento de fuerza en WellStudio, Madrid',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [socialImageUrl],
  },
}

type MarketingHomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function MarketingHomePage({ searchParams }: MarketingHomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}

  return (
    <PublicLandingPage
      leadAttribution={{
        utmSource: readSearchParam(resolvedSearchParams.utm_source),
        utmMedium: readSearchParam(resolvedSearchParams.utm_medium),
        utmCampaign: readSearchParam(resolvedSearchParams.utm_campaign),
      }}
    />
  )
}

function readSearchParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}
