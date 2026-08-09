import { afterEach, describe, expect, it, vi } from 'vitest'

import { ensureSandboxCheckoutEnabled } from '@/modules/payments/server/payment-environment'

describe('payment environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows deterministic checkout in Vercel Preview builds', () => {
    vi.stubEnv('PAYMENTS_CHECKOUT_MODE', 'sandbox')
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => ensureSandboxCheckoutEnabled()).not.toThrow()
  })

  it('blocks sandbox checkout in the Vercel production environment', () => {
    vi.stubEnv('PAYMENTS_CHECKOUT_MODE', 'sandbox')
    vi.stubEnv('VERCEL_ENV', 'production')

    expect(() => ensureSandboxCheckoutEnabled()).toThrow('Sandbox checkout is disabled')
  })

  it('blocks sandbox checkout in non-Vercel production deployments', () => {
    vi.stubEnv('PAYMENTS_CHECKOUT_MODE', 'sandbox')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => ensureSandboxCheckoutEnabled()).toThrow('Sandbox checkout is disabled')
  })

  it('requires the sandbox payment mode explicitly', () => {
    vi.stubEnv('PAYMENTS_CHECKOUT_MODE', 'stripe')
    vi.stubEnv('VERCEL_ENV', 'preview')

    expect(() => ensureSandboxCheckoutEnabled()).toThrow('Sandbox checkout is disabled')
  })
})
