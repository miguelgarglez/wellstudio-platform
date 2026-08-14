#!/usr/bin/env node

import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

import {
  assertSandboxContext,
  loadEnvFiles,
  requireEnv,
} from '../../modules/testing/server/sandbox-scenarios/shared.mjs'

const ROOT = process.cwd()
const CONFIRM_FLAG = '--confirm-showcase-demo-admin'
const DEFAULT_EMAIL = 'demo@wellstudio.es'
const DEFAULT_FIRST_NAME = 'Equipo'
const DEFAULT_LAST_NAME = 'WellStudio'

loadEnvFiles(ROOT)

const args = process.argv.slice(2)

if (!args.includes(CONFIRM_FLAG)) {
  console.error(`Missing required confirmation flag: ${CONFIRM_FLAG}`)
  process.exit(1)
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const sandboxProjectRef = requireEnv('SUPABASE_SANDBOX_PROJECT_REF')
const sandboxEnabled = requireEnv('E2E_AUTH_SANDBOX')
const databaseUrl = requireEnv('DATABASE_URL')

const email = (process.env.SHOWCASE_ADMIN_EMAIL || DEFAULT_EMAIL).trim()
const password = process.env.SHOWCASE_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD

if (!password) {
  console.error('Missing SHOWCASE_ADMIN_PASSWORD or E2E_ADMIN_PASSWORD in env.')
  process.exit(1)
}

if (!email.endsWith('@wellstudio.es')) {
  console.error(`Refusing non-showcase domain email "${email}". Use *@wellstudio.es`)
  process.exit(1)
}

const currentProjectRef = assertSandboxContext({
  supabaseUrl,
  sandboxProjectRef,
  sandboxEnabled,
})

assertDatabaseUrlMatchesSandbox({ databaseUrl, sandboxProjectRef })

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const existing = await findAuthUserByEmail(supabase, email)
let authUserId = existing?.id ?? null

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: {
      scenario: 'showcase-demo-admin',
      source: 'wellstudio-showcase-ops',
    },
  })

  if (error) {
    console.error(`Failed to update showcase admin: ${error.message}`)
    process.exit(1)
  }

  console.log(`Updated showcase admin ${email} in project ${currentProjectRef}.`)
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      scenario: 'showcase-demo-admin',
      source: 'wellstudio-showcase-ops',
    },
  })

  if (error) {
    console.error(`Failed to create showcase admin: ${error.message}`)
    process.exit(1)
  }

  authUserId = data.user?.id ?? null
  console.log(`Created showcase admin ${email} in project ${currentProjectRef}.`)
}

if (!authUserId) {
  console.error('Showcase admin user did not return a Supabase id.')
  process.exit(1)
}

await ensureLocalStaffIdentity({
  email,
  externalAuthId: authUserId,
  firstName: process.env.SHOWCASE_ADMIN_FIRST_NAME || DEFAULT_FIRST_NAME,
  lastName: process.env.SHOWCASE_ADMIN_LAST_NAME || DEFAULT_LAST_NAME,
  databaseUrl,
})

console.log('')
console.log('Showcase demo admin ready for captures.')
console.log(`Email: ${email}`)
console.log('Set SHOWCASE_ADMIN_EMAIL / SHOWCASE_ADMIN_PASSWORD for capture-showcase-shots.mjs')

async function findAuthUserByEmail(client, emailAddress) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)

    const match = (data?.users ?? []).find(
      (user) => user.email?.toLowerCase() === emailAddress.toLowerCase(),
    )
    if (match) return match

    if ((data?.users ?? []).length < 200) break
  }

  return null
}

async function ensureLocalStaffIdentity({
  email,
  externalAuthId,
  firstName,
  lastName,
  databaseUrl,
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const now = new Date()
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    await client.query('begin')

    const userResult = await client.query(
      `insert into "User" (
        "id", "email", "normalizedEmail", "status",
        "externalAuthProvider", "externalAuthId", "emailVerifiedAt", "createdAt", "updatedAt"
      ) values ($1, $2, $3, 'ACTIVE', 'supabase', $4, $5, now(), now())
      on conflict ("normalizedEmail") do update set
        "email" = excluded."email",
        "status" = 'ACTIVE',
        "externalAuthProvider" = excluded."externalAuthProvider",
        "externalAuthId" = excluded."externalAuthId",
        "emailVerifiedAt" = coalesce("User"."emailVerifiedAt", excluded."emailVerifiedAt"),
        "updatedAt" = now()
      returning "id"`,
      [randomUUID(), email, normalizedEmail, externalAuthId, now],
    )

    const userId = userResult.rows[0]?.id
    if (!userId) throw new Error(`Local user upsert failed for ${email}`)

    await client.query(
      `insert into "Member" (
        "id", "userId", "firstName", "lastName", "status", "joinedAt", "createdAt", "updatedAt"
      ) values ($1, $2, $3, $4, 'ACTIVE', now(), now(), now())
      on conflict ("userId") do update set
        "firstName" = excluded."firstName",
        "lastName" = excluded."lastName",
        "status" = 'ACTIVE',
        "updatedAt" = now()`,
      [randomUUID(), userId, firstName, lastName],
    )

    await client.query(
      `insert into "UserRole" ("id", "userId", "role", "createdAt")
       values ($1, $2, 'MEMBER', now()), ($3, $2, 'ADMIN', now()), ($4, $2, 'STAFF', now())
       on conflict ("userId", "role") do nothing`,
      [randomUUID(), userId, randomUUID(), randomUUID()],
    )

    await client.query('commit')
    console.log(`Ensured local ADMIN/STAFF roles for ${firstName} ${lastName} (${email}).`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

function assertDatabaseUrlMatchesSandbox({ databaseUrl, sandboxProjectRef }) {
  const url = new URL(databaseUrl)
  const hostMatches = url.hostname.includes(sandboxProjectRef)
  const usernameMatches = url.username.includes(sandboxProjectRef)

  if (!hostMatches && !usernameMatches) {
    throw new Error(
      `Sandbox guard failed: DATABASE_URL does not target project ref "${sandboxProjectRef}".`,
    )
  }
}
