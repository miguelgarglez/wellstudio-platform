import { NextResponse } from 'next/server'

import { authorizeCronRequest } from '@/lib/server/cron-request'
import { reconcileExpiredEntitlements } from '@/modules/members/server/entitlement-reconciliation'

export async function GET(request: Request) {
  const authorization = authorizeCronRequest(request)
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: authorization.message },
      { status: authorization.status },
    )
  }

  return NextResponse.json(await reconcileExpiredEntitlements())
}
