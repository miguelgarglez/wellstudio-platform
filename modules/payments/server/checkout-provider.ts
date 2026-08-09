import type { Prisma } from '@prisma/client'

export type CreateCreditPackCheckoutInput = {
  paymentId: string
  memberId: string
  customerEmail: string
  productName: string
  productDescription: string | null
  unitAmount: number
  currency: string
  successUrl: string
  cancelUrl: string
}

export type CreatedCheckoutSession = {
  id: string
  url: string
  expiresAt: Date | null
}

export type VerifiedCheckoutEvent = {
  providerEventId: string
  providerEventType: string
  occurredAt: Date
  kind: 'CHECKOUT_COMPLETED' | 'CHECKOUT_EXPIRED' | 'UNSUPPORTED'
  checkoutSessionId: string | null
  paymentIntentId: string | null
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required' | null
  paymentId: string | null
  amountTotal: number | null
  currency: string | null
  safePayload: Prisma.InputJsonValue
}

export interface PaymentCheckoutProvider {
  readonly provider: string
  createCreditPackCheckout(input: CreateCreditPackCheckoutInput): Promise<CreatedCheckoutSession>
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedCheckoutEvent>
}
