#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const ROOT = process.cwd()
const ENV_FILES = ['.env.local', '.env.e2e.local']
export const REQUIRED_CONFIRMATION_FLAG = '--confirm-sandbox-delete'
export const E2E_SCENARIO_EMAIL_PATTERN = /^e2e\.(member|admin)\.sandbox@wellstudio\.test$/i

for (const file of ENV_FILES) {
  loadEnvFile(resolve(ROOT, file))
}

export async function main(argv = process.argv.slice(2), env = process.env, io = defaultIo()) {
  const options = parseOptions(argv)

  if (isE2eScenarioEmail(options.email) && !options.includeE2eScenario) {
    throw new Error(
      `Refusing to delete scenario account "${options.email}". Pass --include-e2e-scenario if you really mean it.`,
    )
  }

  const supabaseUrl = requireEnv(env, 'NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const sandboxProjectRef = requireEnv(env, 'SUPABASE_SANDBOX_PROJECT_REF')
  const sandboxEnabled = requireEnv(env, 'E2E_AUTH_SANDBOX')
  const connectionString = requireEnv(env, 'DATABASE_URL')

  if (sandboxEnabled !== 'true') {
    throw new Error('E2E_AUTH_SANDBOX must be set to true before deleting sandbox accounts')
  }

  const currentProjectRef = extractProjectRef(supabaseUrl)
  if (currentProjectRef !== sandboxProjectRef) {
    throw new Error(
      `Sandbox guard failed: current Supabase project ref "${currentProjectRef}" does not match SUPABASE_SANDBOX_PROJECT_REF "${sandboxProjectRef}"`,
    )
  }

  const supabase = io.createSupabaseAdmin(supabaseUrl, serviceRoleKey)
  const authUsers = await io.listUsersByEmail(supabase, options.email)
  const localSnapshot = await io.loadLocalIdentity(connectionString, {
    email: options.email,
    authUserIds: authUsers.map((user) => user.id),
  })

  const plan = buildDeletePlan({
    email: options.email,
    authUsers,
    localSnapshot,
    detachGrants: options.detachGrants,
  })

  printPlan(plan)

  if (!plan.ok) {
    throw new Error(plan.reason)
  }

  if (plan.nothingToDelete) {
    io.log(`Nothing to delete for ${options.email} in project ${currentProjectRef}.`)
    return plan
  }

  if (!options.apply) {
    io.log('Dry run completed. Repeat with --apply and --confirm-sandbox-delete to execute.')
    return plan
  }

  if (!options.confirm) {
    throw new Error(`Missing required confirmation flag: ${REQUIRED_CONFIRMATION_FLAG}`)
  }

  await io.deleteLocalIdentity(connectionString, plan)
  await io.deleteAuthUsers(supabase, plan.authUserIds)
  io.log(
    `Deleted sandbox identity for ${options.email} in project ${currentProjectRef}: ${plan.authUserIds.length} auth user(s), ${plan.localUserIds.length} local User row(s).`,
  )
  return plan
}

export function parseOptions(argv) {
  const flags = new Set()
  const positional = []

  for (const argument of argv) {
    if (argument === '--') {
      continue
    }

    if (argument.startsWith('--')) {
      flags.add(argument)
      continue
    }

    positional.push(argument)
  }

  const email = positional[0]?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw new Error('Pass the email to delete as the first argument.')
  }

  return {
    email,
    apply: flags.has('--apply'),
    confirm: flags.has(REQUIRED_CONFIRMATION_FLAG),
    includeE2eScenario: flags.has('--include-e2e-scenario'),
    detachGrants: flags.has('--detach-grants'),
  }
}

export function isE2eScenarioEmail(email) {
  return E2E_SCENARIO_EMAIL_PATTERN.test(email)
}

export function buildDeletePlan({ email, authUsers, localSnapshot, detachGrants }) {
  const authUserIds = unique(authUsers.map((user) => user.id))
  const localUserIds = unique(localSnapshot.users.map((user) => user.id))
  const memberIds = unique(localSnapshot.members.map((member) => member.id))
  const grantsCount = localSnapshot.grantsCount

  if (grantsCount > 0 && !detachGrants) {
    return {
      ok: false,
      reason: `Local user granted ${grantsCount} booking override(s). Refusing to delete because those rows keep a NOT NULL actor FK. Re-run with --detach-grants to delete those override rows too.`,
      email,
      authUserIds,
      localUserIds,
      memberIds,
      grantsCount,
      nothingToDelete: false,
      detach: emptyDetach(),
    }
  }

  const nothingToDelete = authUserIds.length === 0 && localUserIds.length === 0

  return {
    ok: true,
    reason: null,
    email,
    authUserIds,
    localUserIds,
    memberIds,
    grantsCount,
    nothingToDelete,
    detach: {
      auditLogs: localSnapshot.auditLogsCount,
      coaches: localSnapshot.coachesCount,
      convertedLeads: localSnapshot.convertedLeadsCount,
      revokedOverrides: localSnapshot.revokesCount,
      grantedOverrides: detachGrants ? grantsCount : 0,
    },
  }
}

function emptyDetach() {
  return {
    auditLogs: 0,
    coaches: 0,
    convertedLeads: 0,
    revokedOverrides: 0,
    grantedOverrides: 0,
  }
}

function printPlan(plan) {
  console.log(`Email: ${plan.email}`)
  console.log(`Auth users: ${plan.authUserIds.length ? plan.authUserIds.join(', ') : '(none)'}`)
  console.log(`Local User rows: ${plan.localUserIds.length ? plan.localUserIds.join(', ') : '(none)'}`)
  console.log(`Members: ${plan.memberIds.length ? plan.memberIds.join(', ') : '(none)'}`)
  console.log(
    `Detach: auditLogs=${plan.detach.auditLogs} coaches=${plan.detach.coaches} convertedLeads=${plan.detach.convertedLeads} revokedOverrides=${plan.detach.revokedOverrides} grantedOverrides=${plan.detach.grantedOverrides}`,
  )
}

function defaultIo() {
  return {
    createSupabaseAdmin(supabaseUrl, serviceRoleKey) {
      return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    },
    async listUsersByEmail(client, emailAddress) {
      return listUsersByEmail(client, emailAddress)
    },
    async loadLocalIdentity(connectionString, input) {
      return loadLocalIdentity(connectionString, input)
    },
    async deleteLocalIdentity(connectionString, plan) {
      return deleteLocalIdentity(connectionString, plan)
    },
    async deleteAuthUsers(client, authUserIds) {
      return deleteAuthUsers(client, authUserIds)
    },
    log(message) {
      console.log(message)
    },
  }
}

async function listUsersByEmail(client, emailAddress) {
  const matches = []

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(`Failed to list sandbox users: ${error.message}`)
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

async function loadLocalIdentity(connectionString, input) {
  const client = new Client({ connectionString })
  const normalizedEmail = normalizeEmail(input.email)

  await client.connect()

  try {
    const usersResult = await client.query(
      `select "id", "email", "externalAuthId"
       from "User"
       where "normalizedEmail" = $1
          or ("externalAuthId" = any($2::text[]))`,
      [normalizedEmail, input.authUserIds],
    )
    const users = usersResult.rows
    const userIds = users.map((row) => row.id)

    if (userIds.length === 0) {
      return {
        users: [],
        members: [],
        auditLogsCount: 0,
        coachesCount: 0,
        convertedLeadsCount: 0,
        revokesCount: 0,
        grantsCount: 0,
      }
    }

    const members = await client.query(`select "id", "userId" from "Member" where "userId" = any($1::text[])`, [
      userIds,
    ])
    const auditLogs = await client.query(
      `select count(*)::int as count from "AuditLog" where "actorUserId" = any($1::text[])`,
      [userIds],
    )
    const coaches = await client.query(`select count(*)::int as count from "Coach" where "userId" = any($1::text[])`, [
      userIds,
    ])
    const convertedLeads = await client.query(
      `select count(*)::int as count
       from "Lead"
       where "convertedMemberId" in (select "id" from "Member" where "userId" = any($1::text[]))`,
      [userIds],
    )
    const revokes = await client.query(
      `select count(*)::int as count from "MemberMembershipBookingOverride" where "revokedByUserId" = any($1::text[])`,
      [userIds],
    )
    const grants = await client.query(
      `select count(*)::int as count from "MemberMembershipBookingOverride" where "grantedByUserId" = any($1::text[])`,
      [userIds],
    )

    return {
      users,
      members: members.rows,
      auditLogsCount: auditLogs.rows[0]?.count ?? 0,
      coachesCount: coaches.rows[0]?.count ?? 0,
      convertedLeadsCount: convertedLeads.rows[0]?.count ?? 0,
      revokesCount: revokes.rows[0]?.count ?? 0,
      grantsCount: grants.rows[0]?.count ?? 0,
    }
  } finally {
    await client.end()
  }
}

async function deleteLocalIdentity(connectionString, plan) {
  if (plan.localUserIds.length === 0) {
    return
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    await client.query('begin')
    await client.query(`update "AuditLog" set "actorUserId" = null where "actorUserId" = any($1::text[])`, [
      plan.localUserIds,
    ])
    await client.query(`update "Coach" set "userId" = null where "userId" = any($1::text[])`, [
      plan.localUserIds,
    ])
    await client.query(
      `update "MemberMembershipBookingOverride"
       set "revokedByUserId" = null
       where "revokedByUserId" = any($1::text[])`,
      [plan.localUserIds],
    )
    await client.query(
      `update "Lead"
       set "convertedMemberId" = null
       where "convertedMemberId" in (select "id" from "Member" where "userId" = any($1::text[]))`,
      [plan.localUserIds],
    )

    if (plan.detach.grantedOverrides > 0) {
      await client.query(
        `delete from "MemberMembershipBookingOverride" where "grantedByUserId" = any($1::text[])`,
        [plan.localUserIds],
      )
    }

    await client.query(`delete from "User" where "id" = any($1::text[])`, [plan.localUserIds])
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw new Error(`Failed to delete local identity: ${error.message}`)
  } finally {
    await client.end()
  }
}

async function deleteAuthUsers(client, authUserIds) {
  for (const authUserId of authUserIds) {
    const { error } = await client.auth.admin.deleteUser(authUserId)
    if (error) {
      throw new Error(`Local identity deleted, but Auth user ${authUserId} could not be removed: ${error.message}`)
    }
  }
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

function requireEnv(env, key) {
  const value = env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function extractProjectRef(urlString) {
  try {
    const url = new URL(urlString)
    return url.hostname.split('.')[0] ?? ''
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${urlString}`)
  }
}

function normalizeEmail(emailAddress) {
  return emailAddress.trim().toLowerCase()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Failed to delete sandbox user')
    console.error('')
    console.error('Examples:')
    console.error('  pnpm sandbox:auth:delete -- you@email.com')
    console.error(
      `  pnpm sandbox:auth:delete -- you@email.com --apply ${REQUIRED_CONFIRMATION_FLAG}`,
    )
    process.exitCode = 1
  })
}
