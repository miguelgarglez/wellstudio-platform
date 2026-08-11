const FALLBACK_INTERNAL_PATH = '/auth/after-login'

/**
 * Returns a same-origin relative path suitable for post-auth redirects.
 * Rejects absolute URLs, protocol-relative URLs, and backslash tricks.
 */
export function resolveSafeInternalPath(
  candidate: string | null | undefined,
  fallback: string = FALLBACK_INTERNAL_PATH,
): string {
  const safeFallback = isSafeInternalPath(fallback) ? fallback : FALLBACK_INTERNAL_PATH

  if (!candidate) {
    return safeFallback
  }

  const trimmed = candidate.trim()

  if (!isSafeInternalPath(trimmed)) {
    return safeFallback
  }

  try {
    const parsed = new URL(trimmed, 'http://wellstudio.local')

    if (parsed.origin !== 'http://wellstudio.local') {
      return safeFallback
    }

    if (parsed.username || parsed.password) {
      return safeFallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return safeFallback
  }
}

export function isSafeInternalPath(candidate: string): boolean {
  if (!candidate.startsWith('/')) {
    return false
  }

  // Protocol-relative and scheme-smuggling patterns.
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return false
  }

  if (candidate.includes('\\') || candidate.includes('\0')) {
    return false
  }

  // Encoded slashes / backslashes that can become protocol-relative after decode.
  const lower = candidate.toLowerCase()
  if (
    lower.includes('%2f%2f') ||
    lower.includes('%5c') ||
    lower.includes('%00')
  ) {
    return false
  }

  return true
}
