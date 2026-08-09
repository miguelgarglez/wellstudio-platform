import type { PaymentCheckoutProvider } from '@/modules/payments/server/checkout-provider'
import { SandboxCheckoutProvider } from '@/modules/payments/server/sandbox-checkout-provider'
import { StripeCheckoutProvider } from '@/modules/payments/server/stripe-checkout-provider'
import Stripe from 'stripe'

export function getPaymentCheckoutProvider(appUrl: string): PaymentCheckoutProvider {
  const mode = process.env.PAYMENTS_CHECKOUT_MODE?.trim().toLowerCase()

  if (mode === 'sandbox') {
    return new SandboxCheckoutProvider(appUrl)
  }

  if (mode === 'stripe') {
    return getStripeCheckoutProvider()
  }

  throw new Error('PAYMENTS_CHECKOUT_MODE must be configured')
}

export function getStripeCheckoutProvider(): StripeCheckoutProvider {
  const secretKey = getRequiredSecret('STRIPE_SECRET_KEY')
  const webhookSecret = getRequiredSecret('STRIPE_WEBHOOK_SECRET')

  return new StripeCheckoutProvider(new Stripe(secretKey), webhookSecret)
}

function getRequiredSecret(name: 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET') {
  const value = process.env[name]?.trim()
  if (!value || value.includes('replace_me')) {
    throw new Error(`${name} must be configured`)
  }
  return value
}
