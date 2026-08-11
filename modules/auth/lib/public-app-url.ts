function normalizeOrigin(value: string | undefined) {
  if (!value) {
    return undefined
  }

  try {
    return new URL(value).origin
  } catch {
    return undefined
  }
}

function resolveBrowserAppOrigin() {
  // Prefer the configured app URL so Preview auth emails always target the
  // stable allowlisted host, even when the user opened a *.vercel.app alias.
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
  if (configured) {
    return configured
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return undefined
}

export function resolvePublicAppUrl(path = '/') {
  const origin = resolveBrowserAppOrigin()

  if (!origin) {
    return undefined
  }

  if (path === '/' || path === '') {
    // Signup template uses {{ .RedirectTo }}/auth/confirm — origin without slash.
    return origin
  }

  return new URL(path, origin).toString()
}
