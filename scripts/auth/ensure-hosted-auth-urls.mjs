import process from 'node:process'

const MANAGEMENT_API_URL = 'https://api.supabase.com/v1/projects'
const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/

/**
 * Canonical Redirect URLs for the hosted sandbox project used by local + Vercel Preview.
 * Keep Site URL as localhost for local fallback; Preview must be allowlisted or GoTrue
 * replaces emailRedirectTo / ConfirmationURL with Site URL (localhost:3000).
 */
export const SANDBOX_SITE_URL = 'http://localhost:3000'

export const SANDBOX_REDIRECT_URLS = [
  'http://localhost:3000/auth/confirm',
  'http://localhost:3000/reset-password',
  'http://localhost:3000/auth/callback',
  'http://127.0.0.1:3000/auth/confirm',
  'http://127.0.0.1:3000/reset-password',
  'http://127.0.0.1:3000/auth/callback',
  'https://preview-wellstudio.miguelgarglez.com/**',
  'https://preview-wellstudio.miguelgarglez.com/auth/confirm',
  'https://preview-wellstudio.miguelgarglez.com/reset-password',
  'https://preview-wellstudio.miguelgarglez.com/auth/callback',
  'https://*-miguel-garcias-projects-38f9bf81.vercel.app/**',
]

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseOptions(argv)
  const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim()

  if (!accessToken) {
    throw new Error(
      'Falta SUPABASE_ACCESS_TOKEN. Ejecuta `pnpm exec supabase login` o expórtalo solo en tu shell.',
    )
  }

  if (options.apply && options.confirmProjectRef !== options.projectRef) {
    throw new Error('Para aplicar, --confirm-project-ref debe coincidir exactamente con --project-ref.')
  }

  if (options.environment !== 'sandbox') {
    throw new Error(
      'Este comando solo gestiona sandbox. Production Site URL / Redirect URLs se configuran aparte.',
    )
  }

  const endpoint = `${MANAGEMENT_API_URL}/${options.projectRef}/config/auth`
  const current = await requestJson(endpoint, accessToken, { method: 'GET' })
  const desired = buildDesiredSandboxUrlConfig(current)
  const changes = buildChanges(current, desired)

  printPlan({ ...options, current, desired, changes })

  if (Object.keys(changes).length === 0) {
    console.log('Sin cambios: Site URL y Redirect URLs de sandbox ya cubren Preview + local.')
    return
  }

  if (!options.apply) {
    console.log('Dry run completado. Repite con --apply y --confirm-project-ref para persistir el diff.')
    return
  }

  await requestJson(endpoint, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
  console.log(
    'URL Configuration de sandbox actualizada. Envía signup/recovery desde Preview y verifica que el host del enlace sea preview-wellstudio.miguelgarglez.com.',
  )
}

export function parseOptions(argv) {
  const values = new Map()
  let apply = false

  for (const argument of argv) {
    if (argument === '--apply') {
      apply = true
      continue
    }

    const [key, ...valueParts] = argument.split('=')
    if (!key.startsWith('--') || valueParts.length === 0) {
      throw new Error(`Argumento no reconocido: ${argument}`)
    }
    values.set(key.slice(2), valueParts.join('=').trim())
  }

  const projectRef = values.get('project-ref')
  const environment = values.get('environment')

  if (!projectRef || !PROJECT_REF_PATTERN.test(projectRef)) {
    throw new Error('--project-ref debe ser un project ref válido de Supabase.')
  }
  if (!environment || environment !== 'sandbox') {
    throw new Error('--environment debe ser sandbox.')
  }

  return {
    projectRef,
    environment,
    apply,
    confirmProjectRef: values.get('confirm-project-ref') ?? null,
  }
}

export function buildDesiredSandboxUrlConfig(current = {}) {
  const mergedAllowList = mergeUriAllowList(current.uri_allow_list, SANDBOX_REDIRECT_URLS)

  return {
    site_url: SANDBOX_SITE_URL,
    uri_allow_list: mergedAllowList,
  }
}

export function mergeUriAllowList(currentValue, requiredUrls) {
  const existing = splitUriAllowList(currentValue)
  const merged = new Set(existing)

  for (const url of requiredUrls) {
    merged.add(url)
  }

  return [...merged].join(',')
}

export function splitUriAllowList(value) {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(/[,\n]/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function buildChanges(current, desired) {
  return Object.fromEntries(
    Object.entries(desired).filter(([key, value]) => normalizeConfigValue(current[key]) !== normalizeConfigValue(value)),
  )
}

function normalizeConfigValue(value) {
  if (typeof value !== 'string') {
    return value
  }

  if (!value.includes(',')) {
    return value.trim()
  }

  return splitUriAllowList(value).join(',')
}

async function requestJson(url, accessToken, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Supabase Management API respondió ${response.status}: ${redact(body)}`)
  }

  return response.status === 204 ? null : response.json()
}

function printPlan({ projectRef, environment, apply, current, desired, changes }) {
  console.log(`Target: ${environment} (${projectRef})`)
  console.log(`Modo: ${apply ? 'apply' : 'dry-run'}`)
  console.log(`Site URL actual: ${current.site_url ?? '(vacío)'}`)
  console.log(`Site URL deseada: ${desired.site_url}`)
  console.log(`Redirect URLs actuales (${splitUriAllowList(current.uri_allow_list).length}):`)
  for (const url of splitUriAllowList(current.uri_allow_list)) {
    console.log(`  - ${url}`)
  }
  console.log(`Redirect URLs deseadas (${splitUriAllowList(desired.uri_allow_list).length}):`)
  for (const url of splitUriAllowList(desired.uri_allow_list)) {
    console.log(`  - ${url}`)
  }
  console.log(`Campos con cambios: ${Object.keys(changes).join(', ') || 'ninguno'}`)
}

function redact(value) {
  return value
    .replace(/sbp_[A-Za-z0-9_-]+/g, '<redacted>')
    .slice(0, 500)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'No se pudo actualizar la URL Configuration hosted.')
    process.exitCode = 1
  })
}
