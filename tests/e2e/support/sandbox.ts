import { execFileSync } from 'node:child_process'

import { getMissingSandboxAuthEnv, loadE2EEnvFiles } from './env'

const PROJECT_ROOT = process.cwd()
const MEMBER_RESERVATIONS_FLOW_SCENARIO = 'member-reservations-flow'

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
    scenarioPreparationPromise = runSandboxReservationScenario()
  }

  await scenarioPreparationPromise
}

export async function resetSandboxReservationScenarioForTest() {
  const setupIssue = getSandboxReservationsSetupIssue()

  if (setupIssue) {
    throw new Error(setupIssue)
  }

  await runSandboxReservationScenario()
}

function runSandboxReservationScenario() {
  return Promise.resolve().then(() => {
    try {
      execFileSync(
        'pnpm',
        ['sandbox:scenario', MEMBER_RESERVATIONS_FLOW_SCENARIO],
        {
          cwd: PROJECT_ROOT,
          stdio: 'pipe',
          encoding: 'utf8',
        },
      )
    } catch (error) {
      const message = extractCommandFailure(error)
      throw new Error(
        `Failed to prepare sandbox reservations scenario "${MEMBER_RESERVATIONS_FLOW_SCENARIO}". ${message}`,
      )
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
