type AuthErrorLike = {
  code?: string
  status?: number
}

export function resolveEmailRateLimitErrorMessage(error: AuthErrorLike) {
  if (
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit'
  ) {
    return 'Has alcanzado temporalmente el límite de emails de Supabase en desarrollo. Espera un poco antes de volver a pedir otro correo.'
  }

  return null
}
