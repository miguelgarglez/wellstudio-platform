import { describe, expect, it } from 'vitest'

import {
  getUnhandledErrorActions,
  UNHANDLED_ERROR_COPY,
} from '@/modules/public/ui/unhandled-error-actions'

describe('getUnhandledErrorActions', () => {
  it('keeps recovery on public surfaces and never sends the visitor to /app', () => {
    expect(getUnhandledErrorActions()).toEqual([
      { href: '/', label: 'Ir al inicio' },
      { href: '/#contacto', label: 'Contactar con el equipo', variant: 'outline' },
    ])
    expect(UNHANDLED_ERROR_COPY.code).toBe('500')
    expect(UNHANDLED_ERROR_COPY.title).toMatch(/no hemos podido cargar/i)
  })
})
