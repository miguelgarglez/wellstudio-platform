import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicDemoNotice } from '@/modules/public/ui/public-demo-notice'

afterEach(() => vi.unstubAllEnvs())

describe('public demo disclosure', () => {
  it('labels the Preview agenda and payment examples as synthetic', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const html = renderToStaticMarkup(createElement(PublicDemoNotice))
    expect(html).toContain('Agenda y perfiles sintéticos')
    expect(html).toContain('no representan cobros reales')
  })

  it('does not claim Production contains demo data', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(renderToStaticMarkup(createElement(PublicDemoNotice))).toBe('')
  })
})
