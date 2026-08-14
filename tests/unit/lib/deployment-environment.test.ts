import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isProductionDeployment,
  isShowcaseRoutesEnabled,
} from '@/lib/deployment-environment'

describe('deployment environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('isProductionDeployment', () => {
    it('treats Vercel production as production', () => {
      vi.stubEnv('VERCEL_ENV', 'production')
      vi.stubEnv('NODE_ENV', 'production')

      expect(isProductionDeployment()).toBe(true)
    })

    it('treats Vercel preview as non-production', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('NODE_ENV', 'production')

      expect(isProductionDeployment()).toBe(false)
    })

    it('falls back to NODE_ENV when VERCEL_ENV is unset', () => {
      vi.stubEnv('VERCEL_ENV', '')
      vi.stubEnv('NODE_ENV', 'production')

      expect(isProductionDeployment()).toBe(true)
    })
  })

  describe('isShowcaseRoutesEnabled', () => {
    it('disables showcase routes on Vercel production', () => {
      vi.stubEnv('VERCEL_ENV', 'production')

      expect(isShowcaseRoutesEnabled()).toBe(false)
    })

    it('enables showcase routes on Vercel preview', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('NODE_ENV', 'production')

      expect(isShowcaseRoutesEnabled()).toBe(true)
    })

    it('enables showcase routes in local development', () => {
      vi.stubEnv('VERCEL_ENV', '')
      vi.stubEnv('NODE_ENV', 'development')

      expect(isShowcaseRoutesEnabled()).toBe(true)
    })
  })
})
