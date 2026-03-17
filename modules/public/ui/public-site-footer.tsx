import Link from 'next/link'

import { cn } from '@/lib/utils'

type PublicSiteFooterProps = {
  className?: string
}

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/privacy-policy', label: 'Privacidad' },
  { href: '/terms', label: 'Condiciones' },
]

export function PublicSiteFooter({ className }: PublicSiteFooterProps) {
  return (
    <footer className={cn('flex flex-col gap-3 text-sm text-muted-foreground', className)}>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--wellstudio-blue-deep)]">
        Documentación pública
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-2 py-1 underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="mailto:miguel.garglez@gmail.com"
          className="rounded-full px-2 py-1 underline-offset-4 transition-colors hover:text-[var(--wellstudio-blue-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue-soft)]"
        >
          Contacto
        </a>
      </div>
    </footer>
  )
}
