export const REQUIRED_CONFIRMATION_FLAG: '--confirm-sandbox-delete'
export const E2E_SCENARIO_EMAIL_PATTERN: RegExp

export type DeleteSandboxUserOptions = {
  email: string
  apply: boolean
  confirm: boolean
  includeE2eScenario: boolean
  detachGrants: boolean
}

export type LocalIdentitySnapshot = {
  users: Array<{ id: string; email?: string; externalAuthId?: string | null }>
  members: Array<{ id: string; userId?: string }>
  auditLogsCount: number
  coachesCount: number
  convertedLeadsCount: number
  revokesCount: number
  grantsCount: number
}

export type DeletePlan = {
  ok: boolean
  reason: string | null
  email: string
  authUserIds: string[]
  localUserIds: string[]
  memberIds: string[]
  grantsCount: number
  nothingToDelete: boolean
  detach: {
    auditLogs: number
    coaches: number
    convertedLeads: number
    revokedOverrides: number
    grantedOverrides: number
  }
}

export type DeleteSandboxUserIo = {
  createSupabaseAdmin: (supabaseUrl: string, serviceRoleKey: string) => unknown
  listUsersByEmail: (client: unknown, email: string) => Promise<Array<{ id: string; email?: string }>>
  loadLocalIdentity: (
    connectionString: string,
    input: { email: string; authUserIds: string[] },
  ) => Promise<LocalIdentitySnapshot>
  deleteLocalIdentity: (connectionString: string, plan: DeletePlan) => Promise<void>
  deleteAuthUsers: (client: unknown, authUserIds: string[]) => Promise<void>
  log: (message: string) => void
}

export function parseOptions(argv: string[]): DeleteSandboxUserOptions
export function isE2eScenarioEmail(email: string): boolean
export function buildDeletePlan(input: {
  email: string
  authUsers: Array<{ id: string }>
  localSnapshot: LocalIdentitySnapshot
  detachGrants: boolean
}): DeletePlan
export function main(
  argv?: string[],
  env?: Record<string, string | undefined>,
  io?: DeleteSandboxUserIo,
): Promise<DeletePlan>
