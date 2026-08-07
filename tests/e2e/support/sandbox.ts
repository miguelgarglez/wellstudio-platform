import { execFileSync } from 'node:child_process'

import { getMissingSandboxAuthEnv, loadE2EEnvFiles } from './env'

const PROJECT_ROOT = process.cwd()
const MEMBER_RESERVATIONS_FLOW_SCENARIO = 'member-reservations-flow'
const MEMBER_RESERVATIONS_FLOW_OPERATIONS = {
  full: 'full',
  waitlistState: 'waitlist-state',
  availableSessionState: 'available-session-state',
  cancelableReservationState: 'cancelable-reservation-state',
} as const

let scenarioPreparationPromise: Promise<void> | null = null

loadE2EEnvFiles(PROJECT_ROOT)

export function getSandboxReservationsSetupIssue() {
  const missing = getMissingSandboxAuthEnv()

  if (missing.length > 0) {
    return `Sandbox reservations suite skipped: missing ${missing.join(', ')}.`
  }

  return null
}

export async function ensureSandboxReservationScenarioReady() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  if (!scenarioPreparationPromise) {
    scenarioPreparationPromise = runSandboxReservationScenario(
      MEMBER_RESERVATIONS_FLOW_OPERATIONS.full,
    )
  }

  await scenarioPreparationPromise
}

export async function resetSandboxReservationScenarioForTest() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  await runSandboxReservationScenario(MEMBER_RESERVATIONS_FLOW_OPERATIONS.full)
}

export async function resetSandboxAdminPlaygroundScenario() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) throw new Error(setupIssue)

  await runSandboxScenarioCommand('admin-playground')
}

export async function resetSandboxWaitlistState() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  await runSandboxReservationScenario(MEMBER_RESERVATIONS_FLOW_OPERATIONS.waitlistState)
}

export async function resetSandboxReservableSessionState() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  await runSandboxReservationScenario(MEMBER_RESERVATIONS_FLOW_OPERATIONS.availableSessionState)
}

export async function resetSandboxCancelableReservationState() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  await runSandboxReservationScenario(
    MEMBER_RESERVATIONS_FLOW_OPERATIONS.cancelableReservationState,
  )
}

function runSandboxReservationScenario(operation: string) {
  return Promise.resolve().then(() => {
    try {
      const args = ['sandbox:scenario', MEMBER_RESERVATIONS_FLOW_SCENARIO]

      if (operation && operation !== MEMBER_RESERVATIONS_FLOW_OPERATIONS.full) {
        args.push(operation)
      }

      execFileSync('pnpm', args, {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        encoding: 'utf8',
      })
    } catch (error) {
      const message = extractCommandFailure(error)
      throw new Error(
        `Failed to prepare sandbox reservations scenario "${MEMBER_RESERVATIONS_FLOW_SCENARIO}" (${operation}). ${message}`,
      )
    }
  })
}

function runSandboxScenarioCommand(scenario: string) {
  return Promise.resolve().then(() => {
    try {
      execFileSync('pnpm', [`sandbox:${scenario}`], {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        encoding: 'utf8',
      })
    } catch (error) {
      throw new Error(`Failed to prepare sandbox scenario "${scenario}". ${extractCommandFailure(error)}`)
    }
  })
}

function extractCommandFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Unknown command failure.'
  }

  const stderr = 'stderr' in error ? String(error.stderr ?? '').trim() : ''
  const stdout = 'stdout' in error ? String(error.stdout ?? '').trim() : ''

  return stderr || stdout || error.message
}
