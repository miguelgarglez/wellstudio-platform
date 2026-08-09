import { NextResponse } from 'next/server'

import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { completeSandboxCheckout } from '@/modules/payments/server/sandbox-checkout'

export async function POST(request: Request) {
  const context = await requireAuthenticatedContext()
  const formData = await request.formData()
  const paymentId = read(formData, 'paymentId')

  if (!context.member || !paymentId) {
    return NextResponse.redirect(new URL('/app/account?checkout=failed', request.url), 303)
  }

  const result = await completeSandboxCheckout({ paymentId, memberId: context.member.id })
  const checkout = result.success ? 'success' : 'failed'
  return NextResponse.redirect(
    new URL(`/app/account?checkout=${checkout}&payment=${encodeURIComponent(paymentId)}`, request.url),
    303,
  )
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
