import { NextResponse } from 'next/server'

import { authorizeCronRequest } from '@/lib/server/cron-request'
import { refreshShowcase } from '@/modules/testing/server/showcase-refresh'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authorization = authorizeCronRequest(request)
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: authorization.message },
      { status: authorization.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await refreshShowcase()
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const healthy = result.summary.futureSessionCount > 0
  return NextResponse.json(
    { healthy, ...result.summary },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
