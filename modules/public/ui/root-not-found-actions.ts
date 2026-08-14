import type { NotFoundAction } from '@/components/ui/not-found-panel'

export function getRootNotFoundActions(isAuthenticated: boolean): NotFoundAction[] {
  if (isAuthenticated) {
    return [
      { href: '/app', label: 'Ir a mi área' },
      { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
      { href: '/', label: 'Ir al inicio', variant: 'outline' },
    ]
  }

  return [
    { href: '/', label: 'Ir al inicio' },
    { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
    { href: '/login', label: 'Acceso de socios', variant: 'outline' },
  ]
}
