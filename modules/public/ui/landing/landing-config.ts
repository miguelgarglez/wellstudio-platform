export const navigationLinks = [
  { href: '/classes', label: 'Agenda' },
  { href: '/plans', label: 'Planes' },
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
