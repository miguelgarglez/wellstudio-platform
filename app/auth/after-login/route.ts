import { NextResponse, type NextRequest } from 'next/server'

import {
  hasAnyRole,
  requireAuthenticatedContext,
} from '@/modules/auth/server/identity'

export async function GET(request: NextRequest) {
  const authContext = await requireAuthenticatedContext()
  const redirectUrl = new URL(resolvePostLoginPath(authContext), request.url)

  return NextResponse.redirect(redirectUrl)
}

function resolvePostLoginPath(
  authContext: Awaited<ReturnType<typeof requireAuthenticatedContext>>,
) {
  if (hasAnyRole(authContext, ['ADMIN', 'STAFF'])) {
    return '/admin'
  }

  return '/app'
}
