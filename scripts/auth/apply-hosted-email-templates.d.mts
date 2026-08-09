export function parseOptions(argv: string[]): {
  projectRef: string
  environment: 'sandbox' | 'production'
  apply: boolean
  confirmProjectRef: string | null
}

export function buildDesiredConfig(environment: 'sandbox' | 'production'): Promise<Record<string, string>>
export function buildChanges(current: Record<string, unknown>, desired: Record<string, string>): Record<string, string>
