export const SANDBOX_SITE_URL: string
export const SANDBOX_REDIRECT_URLS: string[]

export function parseOptions(argv: string[]): {
  projectRef: string
  environment: 'sandbox'
  apply: boolean
  confirmProjectRef: string | null
}

export function splitUriAllowList(value: unknown): string[]
export function mergeUriAllowList(existing: unknown, desired: string[]): string
export function buildDesiredSandboxUrlConfig(current?: Record<string, unknown>): {
  site_url: string
  uri_allow_list: string
}
export function buildChanges(
  current: Record<string, unknown>,
  desired: Record<string, string>,
): Record<string, string>
