import { describe, expect, it } from 'vitest'

import { getRootNotFoundActions } from '@/modules/public/ui/root-not-found-actions'

describe('getRootNotFoundActions', () => {
  it('keeps home, contact and login for anonymous visitors', () => {
    expect(getRootNotFoundActions(false)).toEqual([
      { href: '/', label: 'Ir al inicio' },
      { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
      { href: '/login', label: 'Acceso de socios', variant: 'outline' },
    ])
  })

  it('sends authenticated members back to /app without advertising admin', () => {
    const actions = getRootNotFoundActions(true)

    expect(actions).toEqual([
      { href: '/app', label: 'Ir a mi área' },
      { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
      { href: '/', label: 'Ir al inicio', variant: 'outline' },
    ])
    expect(actions.some((action) => action.href === '/admin' || action.href === '/login')).toBe(
      false,
    )
  })

  it('uses the same member-area CTAs for any authenticated session, including staff', () => {
    expect(getRootNotFoundActions(true)[0]).toEqual({ href: '/app', label: 'Ir a mi área' })
  })
})
