export function isSandboxAuthEnabled() {
  return process.env.E2E_AUTH_SANDBOX === 'true'
}

export function isSandboxRegistrationEnabled() {
  return process.env.E2E_AUTH_SANDBOX_REGISTER === 'true'
}

export function hasSandboxCredentials() {
  const { email, password } = getSandboxCredentials()

  return Boolean(email && password)
}

export function getSandboxCredentials() {
  return {
    email: process.env.E2E_MEMBER_EMAIL ?? '',
    password: process.env.E2E_MEMBER_PASSWORD ?? '',
  }
}

export function getSandboxAdminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL ?? '',
    password: process.env.E2E_ADMIN_PASSWORD ?? '',
  }
}
