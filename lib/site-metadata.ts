export function resolveMetadataBase() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const metadataBaseUrl = appUrl || 'http://localhost:3000'

  if (!metadataBaseUrl) {
    return undefined
  }

  try {
    return new URL(metadataBaseUrl)
  } catch {
    return undefined
  }
}

export function resolvePublicUrl(path = '/') {
  const metadataBase = resolveMetadataBase()

  if (!metadataBase) {
    return undefined
  }

  return new URL(path, metadataBase).toString()
}
