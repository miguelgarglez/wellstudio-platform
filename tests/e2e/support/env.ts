export function isSandboxAuthEnabled() {
  return process.env.E2E_AUTH_SANDBOX === 'true'
}

export function getSandboxCredentials() {
  return {
    email: process.env.E2E_MEMBER_EMAIL ?? '',
    password: process.env.E2E_MEMBER_PASSWORD ?? '',
  }
}
