import type { Metadata } from 'next'
import '@/app/globals.css'
import { Barlow_Condensed, Manrope } from 'next/font/google'
import { cn } from '@/lib/utils'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
})

export const metadata: Metadata = {
  title: 'WellStudio',
  description: 'Plataforma WellStudio para socios, reservas y seguimiento.',
  icons: {
    icon: '/favicon.ico',
  },
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es"
      className={cn('font-sans', manrope.variable, barlowCondensed.variable)}
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--wellstudio-ink)]"
        >
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  )
}
