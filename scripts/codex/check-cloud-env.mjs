#!/usr/bin/env node

const REQUIRED = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const RECOMMENDED = [
  'NEXT_PUBLIC_APP_URL',
  'SUPABASE_SANDBOX_PROJECT_REF',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_AUTH_SANDBOX',
  'E2E_MEMBER_EMAIL',
  'E2E_MEMBER_PASSWORD',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
]

function isSet(name) {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0
}

function printGroup(title, names) {
  console.log(`\n${title}`)

  for (const name of names) {
    console.log(`- ${isSet(name) ? 'ok' : 'missing'} ${name}`)
  }
}

const missingRequired = REQUIRED.filter((name) => !isSet(name))

console.log('Codex cloud environment doctor')
printGroup('Required for build and app runtime', REQUIRED)
printGroup('Recommended for sandbox E2E and admin setup', RECOMMENDED)

if (process.env.E2E_AUTH_SANDBOX === 'true') {
  const e2eMissing = [
    'SUPABASE_SANDBOX_PROJECT_REF',
    'SUPABASE_SERVICE_ROLE_KEY',
    'E2E_MEMBER_EMAIL',
    'E2E_MEMBER_PASSWORD',
  ].filter((name) => !isSet(name))

  if (e2eMissing.length > 0) {
    console.error('\nE2E_AUTH_SANDBOX=true but sandbox E2E variables are incomplete.')
    console.error(`Missing: ${e2eMissing.join(', ')}`)
    process.exit(1)
  }
}

if (missingRequired.length > 0) {
  console.error('\nCodex cloud is missing required variables.')
  console.error(`Missing: ${missingRequired.join(', ')}`)
  process.exit(1)
}

console.log('\nCodex cloud environment looks ready.')
