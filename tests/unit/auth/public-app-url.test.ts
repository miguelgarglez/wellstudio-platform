import { afterEach, describe, expect, it, vi } from 'vitest'

describe('resolvePublicAppUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('prefers NEXT_PUBLIC_APP_URL over the live browser origin', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview-wellstudio.miguelgarglez.com/')
    vi.stubGlobal('window', {
      location: { origin: 'https://wellstudio-platform-git-preview.vercel.app' },
    })

    const { resolvePublicAppUrl } = await import('@/modules/auth/lib/public-app-url')

    expect(resolvePublicAppUrl()).toBe('https://preview-wellstudio.miguelgarglez.com')
    expect(resolvePublicAppUrl('/reset-password?flow=recovery')).toBe(
      'https://preview-wellstudio.miguelgarglez.com/reset-password?flow=recovery',
    )
  })

  it('falls back to window.location.origin when NEXT_PUBLIC_APP_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    vi.stubGlobal('window', {
      location: { origin: 'https://preview-wellstudio.miguelgarglez.com' },
    })

    const { resolvePublicAppUrl } = await import('@/modules/auth/lib/public-app-url')

    expect(resolvePublicAppUrl('/auth/callback')).toBe(
      'https://preview-wellstudio.miguelgarglez.com/auth/callback',
    )
  })
})
