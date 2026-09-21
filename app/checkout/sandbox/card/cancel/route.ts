import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { cancelSandboxCheckout } from '@/modules/payments/server/sandbox-checkout'

export async function POST(request: Request) {
  const context = await requireAuthenticatedContext()
  const formData = await request.formData()
  const paymentId = read(formData, 'paymentId')

  if (context.member && paymentId) {
    await cancelSandboxCheckout({ paymentId, memberId: context.member.id })
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/app/account?card=canceled&payment=${encodeURIComponent(paymentId)}` },
  })
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
