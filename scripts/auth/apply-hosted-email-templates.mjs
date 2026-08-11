import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import process from 'node:process'

const MANAGEMENT_API_URL = 'https://api.supabase.com/v1/projects'
const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/

const ENVIRONMENTS = {
  sandbox: {
    confirmationSubject: '[DEV] WellStudio: confirma tu correo',
    recoverySubject: '[DEV] WellStudio: crea una nueva contraseña',
  },
  production: {
    confirmationSubject: 'WellStudio: confirma tu correo',
    recoverySubject: 'WellStudio: crea una nueva contraseña',
  },
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseOptions(argv)
  const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim()

  if (!accessToken) {
    throw new Error('Falta SUPABASE_ACCESS_TOKEN. Ejecuta `pnpm exec supabase login` o expórtalo solo en tu shell.')
  }

  if (options.apply && options.confirmProjectRef !== options.projectRef) {
    throw new Error('Para aplicar, --confirm-project-ref debe coincidir exactamente con --project-ref.')
  }

  const desired = await buildDesiredConfig(options.environment)
  const endpoint = `${MANAGEMENT_API_URL}/${options.projectRef}/config/auth`
  const current = await requestJson(endpoint, accessToken, { method: 'GET' })
  const changes = buildChanges(current, desired)

  printPlan({ ...options, desired, changes })

  if (Object.keys(changes).length === 0) {
    console.log('Sin cambios: las plantillas hosted ya coinciden con la fuente versionada.')
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
  console.log('Plantillas hosted actualizadas. Ejecuta los smokes reales de signup y recovery antes de cerrar.')
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
  if (!environment || !(environment in ENVIRONMENTS)) {
    throw new Error('--environment debe ser sandbox o production.')
  }

  return {
    projectRef,
    environment,
    apply,
    confirmProjectRef: values.get('confirm-project-ref') ?? null,
  }
}

export async function buildDesiredConfig(environment) {
  const [confirmation, recovery] = await Promise.all([
    readTemplate('confirmation.html'),
    readTemplate('recovery.html'),
  ])

  validateTemplate(confirmation, ['{{ .RedirectTo }}', '{{ .TokenHash }}', '{{ .Email }}'])
  validateTemplate(recovery, ['{{ .ConfirmationURL }}'])

  const subjects = ENVIRONMENTS[environment]
  return {
    mailer_subjects_confirmation: subjects.confirmationSubject,
    mailer_templates_confirmation_content: confirmation,
    mailer_subjects_recovery: subjects.recoverySubject,
    mailer_templates_recovery_content: recovery,
  }
}

export function buildChanges(current, desired) {
  return Object.fromEntries(
    Object.entries(desired).filter(([key, value]) => current[key] !== value),
  )
}

function validateTemplate(template, requiredTokens) {
  for (const token of requiredTokens) {
    if (!template.includes(token)) {
      throw new Error(`La plantilla no conserva el token requerido ${token}.`)
    }
  }

  if (/<script\b/i.test(template) || /(?:src|href)=["']https?:\/\//i.test(template)) {
    throw new Error('Las plantillas Auth no pueden incluir JavaScript ni assets remotos.')
  }
}

async function readTemplate(filename) {
  return readFile(new URL(`../../supabase/templates/${filename}`, import.meta.url), 'utf8')
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

function printPlan({ projectRef, environment, apply, desired, changes }) {
  console.log(`Target: ${environment} (${projectRef})`)
  console.log(`Modo: ${apply ? 'apply' : 'dry-run'}`)
  console.log(`Campos con cambios: ${Object.keys(changes).join(', ') || 'ninguno'}`)
  console.log(`Confirmation SHA-256: ${digest(desired.mailer_templates_confirmation_content)}`)
  console.log(`Recovery SHA-256: ${digest(desired.mailer_templates_recovery_content)}`)
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function redact(value) {
  return value
    .replace(/sbp_[A-Za-z0-9_-]+/g, '<redacted>')
    .slice(0, 500)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'No se pudieron aplicar las plantillas hosted.')
    process.exitCode = 1
  })
}
