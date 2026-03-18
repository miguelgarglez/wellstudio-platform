function resolveBrowserAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
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

  return new URL(path, origin).toString()
}
