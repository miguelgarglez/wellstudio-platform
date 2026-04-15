declare module '@/modules/testing/server/sandbox-scenarios/shared.mjs' {
  export const ENV_FILES: string[]
  export const SCENARIO_CONFIRMATION_FLAG: string
  export const MANAGED_SCENARIO_EMAIL_PATTERN: RegExp

  export function loadEnvFiles(rootPath: string, envFiles?: string[]): void
  export function loadEnvFile(filePath: string): void
  export function unwrap(value: string): string
  export function requireEnv(key: string): string
  export function extractProjectRef(urlString: string): string
  export function assertSandboxContext(input: {
    supabaseUrl: string
    sandboxProjectRef: string
    sandboxEnabled: string
  }): string
  export function isManagedScenarioEmail(email: string): boolean
  export function formatSummaryDate(date: Date): string
}

declare module '@/modules/testing/server/sandbox-scenarios/member-reservations-flow.mjs' {
  export const MEMBER_RESERVATIONS_FLOW_SCENARIO: string
  export const MEMBER_RESERVATIONS_FLOW_PREFIX: string
  export const MEMBER_RESERVATIONS_FLOW_SESSION_KEYS: Record<string, string>
  export const MEMBER_RESERVATIONS_FLOW_OPERATIONS: {
    full: string
    waitlistState: string
    availableSessionState: string
    cancelableReservationState: string
  }

  export function buildMemberReservationsFlowTimeline(now?: Date): Record<
    string,
    {
      startsAt: Date
      endsAt: Date
    }
  >
  export function buildMemberReservationsFlowSessionBlueprints(now?: Date): Record<
    string,
    {
      startsAt: Date
      endsAt: Date
      reservedCount: number
      locationLabel: string
      classTypeKey: 'reservable' | 'full'
      status: 'PUBLISHED' | 'COMPLETED'
      waitlistEnabled: boolean
    }
  >
  export function ensureMemberReservationsFlowScenario(input: {
    prisma: unknown
    authUser: {
      id: string
      email: string
    }
    email: string
    now?: Date
  }): Promise<unknown>
  export function ensureMemberReservationsFlowWaitlistState(input: {
    prisma: unknown
    authUser: {
      id: string
      email: string
    }
    email: string
    now?: Date
  }): Promise<unknown>
  export function ensureMemberReservationsFlowAvailableSessionState(input: {
    prisma: unknown
    authUser: {
      id: string
      email: string
    }
    email: string
    now?: Date
  }): Promise<unknown>
  export function ensureMemberReservationsFlowCancelableReservationState(input: {
    prisma: unknown
    authUser: {
      id: string
      email: string
    }
    email: string
    now?: Date
  }): Promise<unknown>
}
