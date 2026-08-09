'use server'

import { redirect } from 'next/navigation'

import { requireAuthenticatedContext } from '@/modules/auth/server/identity'
import { startCreditPackCheckout } from '@/modules/payments/server/credit-pack-checkout'
import { getPaymentCheckoutProvider } from '@/modules/payments/server/payment-checkout-provider'

export type StartCreditPackCheckoutActionState = {
  success: false
  message: string
} | null

export async function startCreditPackCheckoutAction(
  _previousState: StartCreditPackCheckoutActionState,
  formData: FormData,
): Promise<StartCreditPackCheckoutActionState> {
  const context = await requireAuthenticatedContext()
  const creditPackId = read(formData, 'creditPackId')

  if (!context.member || !creditPackId) {
    return { success: false, message: 'No encontramos el socio o el bono que querías comprar.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'

  let result
  try {
    result = await startCreditPackCheckout({
      memberId: context.member.id,
      creditPackId,
      appUrl,
      provider: getPaymentCheckoutProvider(appUrl),
    })
  } catch {
    return {
      success: false,
      message: 'La compra no está disponible ahora mismo. Inténtalo de nuevo más tarde.',
    }
  }

  if (!result.success) return result

  redirect(result.checkoutUrl)
}

function read(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}
