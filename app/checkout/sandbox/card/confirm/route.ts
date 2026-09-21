import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { completeSandboxCardSetup } from '@/modules/payments/server/sandbox-checkout'

export async function POST(request: Request) {
  const context = await requireAuthenticatedContext()
  const formData = await request.formData()
  const paymentId = read(formData, 'paymentId')

  if (!context.member || !paymentId) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/app/account?card=failed' },
    })
  }

  const result = await completeSandboxCardSetup({ paymentId, memberId: context.member.id })
  const card = result.success ? 'success' : 'failed'
  return new Response(null, {
    status: 303,
    headers: { Location: `/app/account?card=${card}&payment=${encodeURIComponent(paymentId)}` },
  })
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
