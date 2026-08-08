import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { navigationLinks, outlineButtonClass } from '@/modules/public/ui/landing/landing-config'
import { LandingStickyHeader } from '@/modules/public/ui/landing/landing-sticky-header'
import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

const publicNavigationLinks = navigationLinks.map((link) => ({
  ...link,
  href: link.href.startsWith('#') ? `/${link.href}` : link.href,
}))

export function PublicContentShell({ children }: { children: ReactNode }) {
  return (
    <div className="wellstudio-landing-shell min-h-screen bg-[radial-gradient(circle_at_84%_8%,color-mix(in_srgb,var(--wellstudio-blue-soft)_26%,transparent),transparent_24rem),linear-gradient(180deg,#f5f2ed_0%,#eeebe5_100%)] text-[var(--foreground)]">
      <LandingStickyHeader
        links={publicNavigationLinks}
        loginButtonClassName={cn(
          outlineButtonClass,
          'h-10 border-white/16 bg-white/6 px-3 text-xs uppercase tracking-[0.14em] text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/45 sm:h-12 sm:px-4 sm:text-sm sm:normal-case sm:tracking-normal',
        )}
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <div className="px-4 pb-6 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-white/70 bg-white/65 px-5 py-5 shadow-[0_16px_50px_rgba(17,19,22,0.06)] backdrop-blur sm:px-6">
          <PublicSiteFooter />
        </div>
      </div>
    </div>
  )
}
