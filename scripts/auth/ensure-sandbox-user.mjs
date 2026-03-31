#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = process.cwd()
const ENV_FILES = ['.env.local', '.env.e2e.local']
const REQUIRED_CONFIRMATION_FLAG = '--confirm-sandbox-reset'
const TARGETS = {
  member: {
    emailKey: 'E2E_MEMBER_EMAIL',
    passwordKey: 'E2E_MEMBER_PASSWORD',
    label: 'member',
  },
  admin: {
    emailKey: 'E2E_ADMIN_EMAIL',
    passwordKey: 'E2E_ADMIN_PASSWORD',
    label: 'admin',
  },
}

for (const file of ENV_FILES) {
  loadEnvFile(resolve(ROOT, file))
}

const args = process.argv.slice(2)
const targetArg = args.find((arg) => !arg.startsWith('--')) ?? 'member'
const target = TARGETS[targetArg]

if (!target) {
  exitWithHelp(
    `Unknown sandbox target "${targetArg}". Use one of: ${Object.keys(TARGETS).join(', ')}`,
  )
}

if (!args.includes(REQUIRED_CONFIRMATION_FLAG)) {
  exitWithHelp(
    `Missing required confirmation flag: ${REQUIRED_CONFIRMATION_FLAG}`,
  )
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const sandboxProjectRef = requireEnv('SUPABASE_SANDBOX_PROJECT_REF')
const sandboxEnabled = requireEnv('E2E_AUTH_SANDBOX')
const email = requireEnv(target.emailKey)
const password = requireEnv(target.passwordKey)

if (sandboxEnabled !== 'true') {
  exitWithHelp('E2E_AUTH_SANDBOX must be set to true before touching sandbox accounts')
}

const currentProjectRef = extractProjectRef(supabaseUrl)

if (currentProjectRef !== sandboxProjectRef) {
  exitWithHelp(
    `Sandbox guard failed: current Supabase project ref "${currentProjectRef}" does not match SUPABASE_SANDBOX_PROJECT_REF "${sandboxProjectRef}"`,
  )
}

if (!/^e2e\.(member|admin)\.sandbox@wellstudio\.test$/i.test(email)) {
  exitWithHelp(
    `Refusing to operate on non-scenario email "${email}". Expected a dedicated e2e sandbox account.`,
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const users = await listUsersByEmail(supabase, email)
const existingUser = users[0] ?? null

if (existingUser) {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
  })

  if (error) {
    console.error(`Failed to update sandbox ${target.label} user: ${error.message}`)
    process.exit(1)
  }

  console.log(
    `Updated sandbox ${target.label} user ${email} in project ${currentProjectRef} and ensured email_confirm=true.`,
  )
  process.exit(0)
}

const { error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    scenario: target.label,
    source: 'wellstudio-sandbox-ops',
  },
})

if (error) {
  console.error(`Failed to create sandbox ${target.label} user: ${error.message}`)
  process.exit(1)
}

console.log(
  `Created sandbox ${target.label} user ${email} in project ${currentProjectRef} with confirmed email.`,
)

async function listUsersByEmail(client, emailAddress) {
  const matches = []

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      console.error(`Failed to list sandbox users: ${error.message}`)
      process.exit(1)
    }

    const users = data?.users ?? []
    matches.push(
      ...users.filter((user) => user.email?.toLowerCase() === emailAddress.toLowerCase()),
    )

    if (users.length < 200) {
      break
    }
  }

  return matches
}

function loadEnvFile(filePath) {
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

function unwrap(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function requireEnv(key) {
  const value = process.env[key]

  if (!value) {
    exitWithHelp(`Missing required environment variable: ${key}`)
  }

  return value
}

function extractProjectRef(urlString) {
  try {
    const url = new URL(urlString)
    return url.hostname.split('.')[0] ?? ''
  } catch {
    exitWithHelp(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${urlString}`)
  }
}

function exitWithHelp(message) {
  console.error(message)
  console.error('')
  console.error('Expected local setup:')
  console.error(
    '- .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SANDBOX_PROJECT_REF',
  )
  console.error(
    '- .env.e2e.local with E2E_AUTH_SANDBOX=true plus E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD (and optional admin pair)',
  )
  console.error('')
  console.error('Examples:')
  console.error(
    `  node scripts/auth/ensure-sandbox-user.mjs member ${REQUIRED_CONFIRMATION_FLAG}`,
  )
  console.error(
    `  node scripts/auth/ensure-sandbox-user.mjs admin ${REQUIRED_CONFIRMATION_FLAG}`,
  )
  process.exit(1)
}
