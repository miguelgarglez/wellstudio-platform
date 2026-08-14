type LoginInfoParams = {
  authStatus?: string
  authError?: string
}

export function resolveLoginInfoMessage({
  authStatus,
  authError,
}: LoginInfoParams): string | undefined {
  if (authStatus === 'confirmed') {
    return 'Tu correo ya está confirmado. Si no te hemos abierto la sesión automáticamente, entra con tu contraseña y continúa.'
  }

  if (authStatus === 'password_updated') {
    return 'Tu contraseña ya está actualizada. Entra de nuevo con tu email y la nueva contraseña.'
  }

  if (authError === 'verification_failed') {
    return 'No hemos podido verificar tu enlace de acceso. Solicita un nuevo registro o vuelve a iniciar sesión.'
  }

  if (authError === 'identity_conflict') {
    return 'Este correo ya está ligado a otra cuenta. Si acabas de borrar y volver a crear el acceso, el estudio tiene que reenlazar tu identidad. Contacta con el equipo o prueba con otro email.'
  }

  return undefined
}
