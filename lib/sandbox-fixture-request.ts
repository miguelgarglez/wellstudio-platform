import { headers } from 'next/headers'

import {
  SANDBOX_FIXTURES_REQUEST_HEADER,
  shouldIncludeSandboxFixtures,
} from '@/modules/public/server/sandbox-fixtures'

export async function readIncludeSandboxFixtures(query?: string | null) {
  const headerValue = (await headers()).get(SANDBOX_FIXTURES_REQUEST_HEADER)
  return shouldIncludeSandboxFixtures({ headerValue, query })
}
