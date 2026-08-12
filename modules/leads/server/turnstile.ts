export type TurnstileVerificationResult =
  | { success: true }
  | { success: false; message: string }

export type TurnstileVerifier = (input: {
  token: string | null | undefined
  remoteIp?: string | null
}) => Promise<TurnstileVerificationResult>

export type TurnstileConfig = {
  siteKey: string | null
  secretKey: string | null
}

export function readTurnstileConfig(
  env: NodeJS.ProcessEnv = process.env,
): TurnstileConfig {
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim() || null

  return { siteKey, secretKey }
}

export function isTurnstileEnforced(config: TurnstileConfig = readTurnstileConfig()) {
  return Boolean(config.secretKey)
}

export function createTurnstileVerifier(dependencies: {
  fetch?: typeof fetch
  config?: TurnstileConfig
} = {}): TurnstileVerifier {
  const fetchImpl = dependencies.fetch ?? fetch
  const config = dependencies.config ?? readTurnstileConfig()

  return async ({ token, remoteIp }) => {
    if (!config.secretKey) {
      return { success: true }
    }

    const trimmedToken = token?.trim()

    if (!trimmedToken) {
      return {
        success: false,
        message: 'Confirma que no eres un robot antes de enviar.',
      }
    }

    try {
      const body = new URLSearchParams({
        secret: config.secretKey,
        response: trimmedToken,
      })

      if (remoteIp?.trim()) {
        body.set('remoteip', remoteIp.trim())
      }

      const response = await fetchImpl(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      )

      if (!response.ok) {
        return {
          success: false,
          message: 'No pudimos validar el captcha. Inténtalo de nuevo.',
        }
      }

      const payload = (await response.json()) as { success?: boolean }

      if (!payload.success) {
        return {
          success: false,
          message: 'La verificación anti-spam ha fallado. Inténtalo de nuevo.',
        }
      }

      return { success: true }
    } catch {
      return {
        success: false,
        message: 'No pudimos validar el captcha. Inténtalo de nuevo.',
      }
    }
  }
}

export const defaultTurnstileVerifier = createTurnstileVerifier()
