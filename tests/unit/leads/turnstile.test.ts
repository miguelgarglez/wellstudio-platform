import { describe, expect, it, vi } from 'vitest'

import {
  createTurnstileVerifier,
  isTurnstileEnforced,
  readTurnstileConfig,
} from '@/modules/leads/server/turnstile'

describe('turnstile config', () => {
  it('treats blank keys as disabled', () => {
    const config = readTurnstileConfig({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '  ',
      TURNSTILE_SECRET_KEY: '',
    } as unknown as NodeJS.ProcessEnv)

    expect(config).toEqual({ siteKey: null, secretKey: null })
    expect(isTurnstileEnforced(config)).toBe(false)
  })

  it('enforces verification when a secret key is present', () => {
    const config = readTurnstileConfig({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret-key',
    } as unknown as NodeJS.ProcessEnv)

    expect(isTurnstileEnforced(config)).toBe(true)
  })
})

describe('createTurnstileVerifier', () => {
  it('allows submissions when Turnstile is not configured', async () => {
    const fetchMock = vi.fn()
    const verifier = createTurnstileVerifier({
      fetch: fetchMock,
      config: { siteKey: null, secretKey: null },
    })

    await expect(verifier({ token: null })).resolves.toEqual({ success: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects missing tokens when Turnstile is enforced', async () => {
    const verifier = createTurnstileVerifier({
      fetch: vi.fn(),
      config: { siteKey: 'site', secretKey: 'secret' },
    })

    await expect(verifier({ token: '   ' })).resolves.toEqual({
      success: false,
      message: 'Confirma que no eres un robot antes de enviar.',
    })
  })

  it('accepts tokens approved by Cloudflare siteverify', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    const verifier = createTurnstileVerifier({
      fetch: fetchMock,
      config: { siteKey: 'site', secretKey: 'secret' },
    })

    await expect(verifier({ token: 'ok-token', remoteIp: '1.2.3.4' })).resolves.toEqual({
      success: true,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams
    expect(body.get('secret')).toBe('secret')
    expect(body.get('response')).toBe('ok-token')
    expect(body.get('remoteip')).toBe('1.2.3.4')
  })

  it('rejects tokens that siteverify marks as failed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    )
    const verifier = createTurnstileVerifier({
      fetch: fetchMock,
      config: { siteKey: 'site', secretKey: 'secret' },
    })

    await expect(verifier({ token: 'bad-token' })).resolves.toEqual({
      success: false,
      message: 'La verificación anti-spam ha fallado. Inténtalo de nuevo.',
    })
  })
})
