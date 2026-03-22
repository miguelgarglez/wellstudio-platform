import { resolvePublicUrl } from '@/lib/site-metadata'
import heroBarbellImage from '@/modules/public/ui/landing/assets/hero-barbell.jpeg'
import type { LandingContact, LandingFaq } from '@/modules/public/content/landing-content'

const weekdayOpeningHours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

function extractPostalAddress(addressLines: string[]) {
  const [streetAddress, localityLine] = addressLines
  const match = localityLine?.match(/^(?<postalCode>\d{5}),\s*(?<addressLocality>.+)$/u)

  return {
    streetAddress,
    postalCode: match?.groups?.postalCode,
    addressLocality: match?.groups?.addressLocality,
  }
}

type LandingStructuredDataProps = {
  heroDescription: string
  contact: LandingContact
  faq: LandingFaq[]
}

export function LandingStructuredData({
  heroDescription,
  contact,
  faq,
}: LandingStructuredDataProps) {
  const publicHomeUrl = resolvePublicUrl('/') ?? '/'
  const socialImageUrl = resolvePublicUrl(heroBarbellImage.src) ?? heroBarbellImage.src
  const postalAddress = extractPostalAddress(contact.addressLines)
  const gymSchema = {
    '@context': 'https://schema.org',
    '@type': 'ExerciseGym',
    name: 'WellStudio',
    description: heroDescription,
    url: publicHomeUrl,
    image: socialImageUrl,
    email: contact.email,
    telephone: contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: postalAddress.streetAddress,
      postalCode: postalAddress.postalCode,
      addressLocality: postalAddress.addressLocality,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: weekdayOpeningHours,
        opens: '07:15',
        closes: '15:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: weekdayOpeningHours,
        opens: '17:00',
        closes: '21:30',
      },
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  const serializedGymSchema = JSON.stringify(gymSchema).replace(/</g, '\\u003c')
  const serializedFaqSchema = JSON.stringify(faqSchema).replace(/</g, '\\u003c')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedGymSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedFaqSchema }}
      />
    </>
  )
}
