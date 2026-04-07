import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const E2E_ENV_FILES = ['.env.local', '.env.e2e.local']

let envLoaded = false

loadE2EEnvFiles()

export function loadE2EEnvFiles(rootPath = process.cwd()) {
  if (envLoaded) {
    return
  }

  for (const file of E2E_ENV_FILES) {
    const filePath = path.join(rootPath, file)

    if (!existsSync(filePath)) {
      continue
    }

    const content = readFileSync(filePath, 'utf8')

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const rawValue = trimmed.slice(separatorIndex + 1).trim()

      if (!key || process.env[key]) {
        continue
      }

      process.env[key] = unwrapEnvValue(rawValue)
    }
  }

  envLoaded = true
}

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

export function getMissingSandboxAuthEnv() {
  const missing: string[] = []

  if (!isSandboxAuthEnabled()) {
    missing.push('E2E_AUTH_SANDBOX=true')
  }

  const { email, password } = getSandboxCredentials()

  if (!email) {
    missing.push('E2E_MEMBER_EMAIL')
  }

  if (!password) {
    missing.push('E2E_MEMBER_PASSWORD')
  }

  return missing
}

function unwrapEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
