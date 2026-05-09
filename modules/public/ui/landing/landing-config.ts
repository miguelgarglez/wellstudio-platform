export const navigationLinks = [
  { href: '#centro', label: 'Centro' },
  { href: '#metodo', label: 'Método' },
  { href: '#testimonios', label: 'Testimonios' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contacto', label: 'Contacto' },
] as const

export const externalLocationLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const

const baseButtonClass =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 active:translate-y-px'

export const solidButtonClass = `${baseButtonClass} h-12 rounded-full px-6 text-sm font-medium`

export const outlineButtonClass =
  `${baseButtonClass} h-12 rounded-full border px-6 text-sm font-medium`

export const heroSurfaceClass =
  'bg-[radial-gradient(circle_at_top_left,rgba(79,137,197,0.32),transparent_24%),radial-gradient(circle_at_78%_12%,rgba(183,206,231,0.14),transparent_22%),linear-gradient(180deg,rgba(15,16,18,0.98),rgba(15,16,18,0.92))]'
