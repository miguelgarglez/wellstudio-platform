import { existsSync, readFileSync } from 'node:fs'

export const ENV_FILES = ['.env.local', '.env.e2e.local']
export const SCENARIO_CONFIRMATION_FLAG = '--confirm-sandbox-scenario'
export const MANAGED_SCENARIO_EMAIL_PATTERN =
  /^e2e\.[a-z0-9.-]+\.sandbox@wellstudio\.test$/i

export function loadEnvFiles(rootPath, envFiles = ENV_FILES) {
  for (const file of envFiles) {
    loadEnvFile(`${rootPath}/${file}`)
  }
}

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf('=')

    if (separator === -1) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    const rawValue = trimmed.slice(separator + 1).trim()

    if (!key || process.env[key]) {
      continue
    }

    process.env[key] = unwrap(rawValue)
  }
}

export function unwrap(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

export function requireEnv(key) {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export function extractProjectRef(urlString) {
  const url = new URL(urlString)
  return url.hostname.split('.')[0] ?? ''
}

export function assertSandboxContext({
  supabaseUrl,
  sandboxProjectRef,
  sandboxEnabled,
}) {
  if (sandboxEnabled !== 'true') {
    throw new Error('E2E_AUTH_SANDBOX must be set to true before reconciling sandbox scenarios')
  }

  const currentProjectRef = extractProjectRef(supabaseUrl)

  if (currentProjectRef !== sandboxProjectRef) {
    throw new Error(
      `Sandbox guard failed: current Supabase project ref "${currentProjectRef}" does not match SUPABASE_SANDBOX_PROJECT_REF "${sandboxProjectRef}"`,
    )
  }

  return currentProjectRef
}

export function isManagedScenarioEmail(email) {
  return MANAGED_SCENARIO_EMAIL_PATTERN.test(email)
}

export function formatSummaryDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
