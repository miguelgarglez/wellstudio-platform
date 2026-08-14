#!/usr/bin/env node

import process from 'node:process'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

import {
  assertSandboxContext,
  formatSummaryDate,
  isManagedScenarioEmail,
  loadEnvFiles,
  requireEnv,
  SCENARIO_CONFIRMATION_FLAG,
} from '../../modules/testing/server/sandbox-scenarios/shared.mjs'
import {
  ADMIN_PLAYGROUND_DEFAULT_ADMIN_EMAIL,
  ADMIN_PLAYGROUND_SCENARIO,
  ensureAdminPlaygroundScenario,
} from '../../modules/testing/server/sandbox-scenarios/admin-playground.mjs'
import {
  ensureMemberReservationsFlowAvailableSessionState,
  ensureMemberReservationsFlowCancelableReservationState,
  ensureMemberReservationsFlowScenario,
  ensureMemberReservationsFlowWaitlistState,
  MEMBER_RESERVATIONS_FLOW_OPERATIONS,
  MEMBER_RESERVATIONS_FLOW_SCENARIO,
} from '../../modules/testing/server/sandbox-scenarios/member-reservations-flow.mjs'
import {
  ensureShowcaseVitrinaScenario,
  SHOWCASE_VITRINA_CONFIRM_MEMBER_FLAG,
  SHOWCASE_VITRINA_SCENARIO,
} from '../../modules/testing/server/sandbox-scenarios/showcase-vitrina.mjs'

const ROOT = process.cwd()
const SCENARIOS = {
  [MEMBER_RESERVATIONS_FLOW_SCENARIO]: {
    requiresMemberAuthUser: true,
    operations: {
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.full]: ensureMemberReservationsFlowScenario,
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.waitlistState]:
        ensureMemberReservationsFlowWaitlistState,
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.availableSessionState]:
        ensureMemberReservationsFlowAvailableSessionState,
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.cancelableReservationState]:
        ensureMemberReservationsFlowCancelableReservationState,
    },
  },
  [ADMIN_PLAYGROUND_SCENARIO]: {
    requiresMemberAuthUser: false,
    operations: {
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.full]: ensureAdminPlaygroundScenario,
    },
  },
  [SHOWCASE_VITRINA_SCENARIO]: {
    requiresMemberAuthUser: false,
    operations: {
      [MEMBER_RESERVATIONS_FLOW_OPERATIONS.full]: ensureShowcaseVitrinaScenario,
    },
  },
}

loadEnvFiles(ROOT)

const args = process.argv.slice(2)
const positionalArgs = args.filter((arg) => !arg.startsWith('--'))
const scenarioName = positionalArgs[0]
const scenarioOperationName =
  positionalArgs[1] ?? MEMBER_RESERVATIONS_FLOW_OPERATIONS.full

if (!scenarioName || !SCENARIOS[scenarioName]) {
  exitWithHelp(
    `Unknown or missing sandbox scenario "${scenarioName ?? ''}". Available scenarios: ${Object.keys(SCENARIOS).join(', ')}`,
  )
}

const scenarioConfig = SCENARIOS[scenarioName]

if (!scenarioConfig.operations[scenarioOperationName]) {
  exitWithHelp(
    `Unknown operation "${scenarioOperationName}" for scenario "${scenarioName}". Available operations: ${Object.keys(scenarioConfig.operations).join(', ')}`,
  )
}

if (!args.includes(SCENARIO_CONFIRMATION_FLAG)) {
  exitWithHelp(`Missing required confirmation flag: ${SCENARIO_CONFIRMATION_FLAG}`)
}

const databaseUrl = requireEnv('DATABASE_URL')
const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const sandboxProjectRef = requireEnv('SUPABASE_SANDBOX_PROJECT_REF')
const sandboxEnabled = requireEnv('E2E_AUTH_SANDBOX')

const currentProjectRef = assertSandboxContext({
  supabaseUrl,
  sandboxProjectRef,
  sandboxEnabled,
})

assertDatabaseUrlMatchesSandbox({
  databaseUrl,
  sandboxProjectRef,
})

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

try {
  const scenarioInput = await buildScenarioInput({
    scenarioConfig,
    scenarioName,
    supabaseUrl,
    args,
  })
  const scenario = await scenarioConfig.operations[scenarioOperationName]({
    prisma,
    now: new Date(),
    ...scenarioInput,
  })

  printSummary({
    scenario,
    currentProjectRef,
    scenarioOperationName,
  })
} catch (error) {
  console.error('Failed to reconcile sandbox scenario.')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}

async function buildScenarioInput({ scenarioConfig, scenarioName, supabaseUrl, args }) {
  if (scenarioName === SHOWCASE_VITRINA_SCENARIO) {
    const showcaseMemberEmail = process.env.SHOWCASE_MEMBER_EMAIL?.trim() || null

    if (showcaseMemberEmail && !args.includes(SHOWCASE_VITRINA_CONFIRM_MEMBER_FLAG)) {
      exitWithHelp(
        `Refusing to reconcile showcase member "${showcaseMemberEmail}" without ${SHOWCASE_VITRINA_CONFIRM_MEMBER_FLAG}.`,
      )
    }

    return { showcaseMemberEmail }
  }

  if (!scenarioConfig.requiresMemberAuthUser) {
    return {
      adminEmail:
        process.env.E2E_ADMIN_EMAIL || ADMIN_PLAYGROUND_DEFAULT_ADMIN_EMAIL,
    }
  }

  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const memberEmail = requireEnv('E2E_MEMBER_EMAIL')

  if (!isManagedScenarioEmail(memberEmail)) {
    exitWithHelp(
      `Refusing to reconcile scenario for non-managed email "${memberEmail}". Expected an e2e sandbox account.`,
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const authUser = await findAuthUserByEmail(supabase, memberEmail)

  if (!authUser) {
    exitWithHelp(
      `Sandbox auth user "${memberEmail}" was not found. Run node scripts/auth/ensure-sandbox-user.mjs member --confirm-sandbox-reset first.`,
    )
  }

  return {
    authUser: {
      id: authUser.id,
      email: authUser.email ?? memberEmail,
    },
    email: memberEmail,
  }
}

async function findAuthUserByEmail(client, email) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error(`Failed to list sandbox auth users: ${error.message}`)
    }

    const user = (data?.users ?? []).find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
    )

    if (user) {
      return user
    }

    if ((data?.users ?? []).length < 200) {
      break
    }
  }

  return null
}

function printSummary({ scenario, currentProjectRef, scenarioOperationName }) {
  if (scenario.scenario === SHOWCASE_VITRINA_SCENARIO) {
    printShowcaseVitrinaSummary({ scenario, currentProjectRef, scenarioOperationName })
    return
  }

  if (scenario.scenario === ADMIN_PLAYGROUND_SCENARIO) {
    printAdminPlaygroundSummary({
      scenario,
      currentProjectRef,
      scenarioOperationName,
    })
    return
  }

  console.log(
    `Reconciled sandbox scenario "${scenario.scenario}" (${scenarioOperationName}) for ${scenario.memberEmail} in project ${currentProjectRef}.`,
  )
  console.log(`Local member id: ${scenario.memberId}`)
  console.log(`Local user id: ${scenario.localUserId}`)
  console.log(`Membership plan: ${scenario.planSlug}`)
  console.log(`Class types: ${scenario.classTypeSlugs.join(', ')}`)
  console.log(`Cancelable reservation id: ${scenario.cancelableReservationId}`)
  console.log(`Active waitlist id: ${scenario.waitlistEntryId}`)
  console.log('Managed sessions:')

  for (const session of scenario.sessions) {
    console.log(
      `- ${session.key}: ${session.locationLabel} · ${formatSummaryDate(session.startsAt)} · ${session.id}`,
    )
  }

  console.log('')
  console.log(`Login account ready: ${scenario.memberEmail}`)
  console.log('Recommended next steps:')
  console.log('1. agent-browser --session-name wellstudio-sandbox open http://localhost:3000/login')
  console.log('2. Log in with the sandbox member credentials')
  console.log('3. Open /app and /app/reservations to validate the scenario visually')
}

function printShowcaseVitrinaSummary({ scenario, currentProjectRef, scenarioOperationName }) {
  console.log(
    `Reconciled sandbox scenario "${scenario.scenario}" (${scenarioOperationName}) in project ${currentProjectRef}.`,
  )
  console.log(`Plans: ${scenario.planSlugs.join(', ')}`)
  console.log(`Credit pack: ${scenario.creditPackSlug}`)
  console.log(`Class types: ${scenario.classTypeSlugs.join(', ')}`)
  console.log(`Published sessions: ${scenario.sessionCount}`)
  console.log(`Demo members: ${scenario.demoMemberEmails.join(', ')}`)

  if (scenario.showcaseMemberEmail) {
    console.log(`Showcase member: ${scenario.showcaseMemberEmail}`)
    console.log(`Upcoming reservation id: ${scenario.upcomingReservationId ?? 'none'}`)
  }

  console.log('')
  console.log('Recommended next steps:')
  console.log('1. Open /classes and /plans on Preview — commercial names, populated agenda')
  console.log('2. Log in as showcase member and open /app — plan + próxima reserva')
  console.log('3. Re-capture: node scripts/capture-showcase-shots.mjs && node scripts/optimize-showcase-shots.mjs')
}

function printAdminPlaygroundSummary({
  scenario,
  currentProjectRef,
  scenarioOperationName,
}) {
  console.log(
    `Reconciled sandbox scenario "${scenario.scenario}" (${scenarioOperationName}) in project ${currentProjectRef}.`,
  )
  console.log(`Admin actor: ${scenario.adminEmail}`)
  console.log(`Plans: ${scenario.planSlugs.join(', ')}`)
  console.log(`Members: ${scenario.memberEmails.join(', ')}`)
  console.log(`Active memberships: ${scenario.activeMembershipCount}`)
  console.log('Managed sessions:')

  for (const label of scenario.sessionLabels) {
    console.log(`- ${label}`)
  }

  console.log('')
  console.log('Recommended next steps:')
  console.log('1. Open http://localhost:3000/admin')
  console.log('2. Check membership policy density and explicit policy states')
  console.log('3. Open /admin/overrides?q=playground to inspect member override states')
}

function assertDatabaseUrlMatchesSandbox({ databaseUrl, sandboxProjectRef }) {
  let databaseConnectionUrl

  try {
    databaseConnectionUrl = new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL')
  }

  const hostMatches = databaseConnectionUrl.hostname.includes(sandboxProjectRef)
  const usernameMatches = databaseConnectionUrl.username.includes(sandboxProjectRef)

  if (!hostMatches && !usernameMatches) {
    throw new Error(
      `Sandbox guard failed: DATABASE_URL does not appear to target project ref "${sandboxProjectRef}".`,
    )
  }
}

function exitWithHelp(message) {
  console.error(message)
  console.error('')
  console.error('Expected local setup:')
  console.error(
    '- .env.local with DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SANDBOX_PROJECT_REF',
  )
  console.error(
    '- .env.e2e.local with E2E_AUTH_SANDBOX=true plus E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD',
  )
  console.error('')
  console.error('Example:')
  console.error(
    `  node scripts/sandbox/ensure-member-scenario.mjs ${MEMBER_RESERVATIONS_FLOW_SCENARIO} ${SCENARIO_CONFIRMATION_FLAG}`,
  )
  console.error(
    `  node scripts/sandbox/ensure-member-scenario.mjs ${MEMBER_RESERVATIONS_FLOW_SCENARIO} ${MEMBER_RESERVATIONS_FLOW_OPERATIONS.waitlistState} ${SCENARIO_CONFIRMATION_FLAG}`,
  )
  console.error(
    `  node scripts/sandbox/ensure-member-scenario.mjs ${ADMIN_PLAYGROUND_SCENARIO} ${SCENARIO_CONFIRMATION_FLAG}`,
  )
  console.error(
    `  SHOWCASE_MEMBER_EMAIL=you@example.com node scripts/sandbox/ensure-member-scenario.mjs ${SHOWCASE_VITRINA_SCENARIO} ${SCENARIO_CONFIRMATION_FLAG} ${SHOWCASE_VITRINA_CONFIRM_MEMBER_FLAG}`,
  )
  process.exit(1)
}
