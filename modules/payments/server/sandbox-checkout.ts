import { prisma } from '@/lib/db/prisma'
import { processCheckoutEvent } from '@/modules/payments/server/credit-pack-checkout'
import { ensureSandboxCheckoutEnabled } from '@/modules/payments/server/payment-environment'
import { buildSandboxCompletedEvent } from '@/modules/payments/server/sandbox-checkout-provider'

export type SandboxCheckoutOverview = {
  paymentId: string
  packName: string
  description: string | null
  creditsLabel: string
  validityLabel: string
  amountLabel: string
  status: 'PENDING' | 'SUCCEEDED' | 'CANCELED' | 'FAILED'
}

export async function getSandboxCheckoutOverview(input: {
  paymentId: string
  memberId: string
}): Promise<SandboxCheckoutOverview | null> {
  ensureSandboxMode()

  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      memberId: input.memberId,
      provider: 'sandbox',
      paymentType: 'CREDIT_PACK_PURCHASE',
    },
    include: { items: true },
  })
  const item = payment?.items.length === 1 ? payment.items[0] : null
  if (!payment || !item || item.itemType !== 'CREDIT_PACK') return null

  const pack = await prisma.creditPack.findUnique({
    where: { id: item.referenceId },
    select: { name: true, description: true },
  })
  if (!pack) return null

  return {
    paymentId: payment.id,
    packName: pack.name,
    description: pack.description,
    creditsLabel: item.entitlementUnits === 1 ? '1 reserva' : `${item.entitlementUnits ?? 0} reservas`,
    validityLabel: item.entitlementExpiresAfterDays
      ? `${item.entitlementExpiresAfterDays} días desde la compra`
      : 'Sin caducidad configurada',
    amountLabel: formatMoney(payment.amount, payment.currency),
    status: normalizeStatus(payment.status),
  }
}

export async function completeSandboxCheckout(input: { paymentId: string; memberId: string }) {
  ensureSandboxMode()

  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      memberId: input.memberId,
      provider: 'sandbox',
      paymentType: 'CREDIT_PACK_PURCHASE',
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      providerCheckoutSessionId: true,
    },
  })

  if (!payment?.providerCheckoutSessionId) {
    return { success: false as const, message: 'El pago de prueba ya no está disponible.' }
  }

  return processCheckoutEvent({
    provider: 'sandbox',
    event: buildSandboxCompletedEvent({
      paymentId: payment.id,
      checkoutSessionId: payment.providerCheckoutSessionId,
      amount: payment.amount,
      currency: payment.currency,
    }),
  })
}

export async function cancelSandboxCheckout(input: { paymentId: string; memberId: string }) {
  ensureSandboxMode()
  await prisma.payment.updateMany({
    where: {
      id: input.paymentId,
      memberId: input.memberId,
      provider: 'sandbox',
      status: 'PENDING',
    },
    data: { status: 'CANCELED' },
  })
}

function ensureSandboxMode() {
  ensureSandboxCheckoutEnabled()
}

function normalizeStatus(status: string): SandboxCheckoutOverview['status'] {
  if (status === 'SUCCEEDED' || status === 'CANCELED' || status === 'FAILED') return status
  return 'PENDING'
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount / 100)
}
