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

export type CreateCardSetupCheckoutInput = {
  paymentId: string
  memberId: string
  customerEmail: string
  customerId: string | null
  successUrl: string
  cancelUrl: string
}

export type CreatedCheckoutSession = {
  id: string
  url: string
  expiresAt: Date | null
  customerId?: string | null
}

export type VerifiedCheckoutCard = {
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
}

export type VerifiedCheckoutEvent = {
  providerEventId: string
  providerEventType: string
  occurredAt: Date
  kind: 'CHECKOUT_COMPLETED' | 'CHECKOUT_EXPIRED' | 'UNSUPPORTED'
  mode: 'payment' | 'setup' | null
  checkoutSessionId: string | null
  paymentIntentId: string | null
  setupIntentId: string | null
  paymentMethodId: string | null
  customerId: string | null
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required' | null
  paymentId: string | null
  amountTotal: number | null
  currency: string | null
  card: VerifiedCheckoutCard | null
  safePayload: Prisma.InputJsonValue
}

export interface PaymentCheckoutProvider {
  readonly provider: string
  createCreditPackCheckout(input: CreateCreditPackCheckoutInput): Promise<CreatedCheckoutSession>
  createCardSetupCheckout(input: CreateCardSetupCheckoutInput): Promise<CreatedCheckoutSession>
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedCheckoutEvent>
}
