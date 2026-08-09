import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type {
  PaymentCheckoutProvider,
  VerifiedCheckoutEvent,
} from '@/modules/payments/server/checkout-provider'

const CHECKOUT_FAILURE_MESSAGE = 'No se ha podido preparar el pago. Inténtalo de nuevo en unos minutos.'

export type StartCreditPackCheckoutResult =
  | { success: true; paymentId: string; checkoutUrl: string }
  | {
      success: false
      code: 'MEMBER_INACTIVE' | 'PRODUCT_UNAVAILABLE' | 'PROVIDER_ERROR'
      message: string
    }

export type ProcessCheckoutEventResult =
  | { success: true; outcome: 'FULFILLED' | 'CANCELED' | 'IGNORED' | 'ALREADY_PROCESSED'; paymentId: string | null }
  | { success: false; code: 'INVALID_EVENT' | 'PAYMENT_NOT_FOUND' | 'PAYMENT_MISMATCH'; message: string }

export async function startCreditPackCheckout(input: {
  memberId: string
  creditPackId: string
  appUrl: string
  provider: PaymentCheckoutProvider
}): Promise<StartCreditPackCheckoutResult> {
  const [member, creditPack] = await Promise.all([
    prisma.member.findUnique({
      where: { id: input.memberId },
      select: {
        id: true,
        status: true,
        user: { select: { email: true, status: true } },
      },
    }),
    prisma.creditPack.findFirst({
      where: { id: input.creditPackId, status: 'ACTIVE', isPublic: true },
      select: {
        id: true,
        name: true,
        description: true,
        creditsTotal: true,
        priceAmount: true,
        currency: true,
        expiresAfterDays: true,
      },
    }),
  ])

  if (!member || member.status !== 'ACTIVE' || member.user.status !== 'ACTIVE') {
    return {
      success: false,
      code: 'MEMBER_INACTIVE',
      message: 'Tu cuenta debe estar activa para comprar un bono.',
    }
  }

  if (!creditPack) {
    return {
      success: false,
      code: 'PRODUCT_UNAVAILABLE',
      message: 'Este bono ya no está disponible para comprar.',
    }
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: member.id,
      provider: input.provider.provider,
      status: 'PENDING',
      paymentType: 'CREDIT_PACK_PURCHASE',
      amount: creditPack.priceAmount,
      currency: creditPack.currency.toUpperCase(),
      items: {
        create: {
          itemType: 'CREDIT_PACK',
          referenceId: creditPack.id,
          quantity: 1,
          unitAmount: creditPack.priceAmount,
          totalAmount: creditPack.priceAmount,
          entitlementUnits: creditPack.creditsTotal,
          entitlementExpiresAfterDays: creditPack.expiresAfterDays,
        },
      },
    },
    select: { id: true },
  })

  try {
    const appUrl = input.appUrl.replace(/\/$/, '')
    const checkout = await input.provider.createCreditPackCheckout({
      paymentId: payment.id,
      memberId: member.id,
      customerEmail: member.user.email,
      productName: creditPack.name,
      productDescription: creditPack.description,
      unitAmount: creditPack.priceAmount,
      currency: creditPack.currency.toLowerCase(),
      successUrl: `${appUrl}/app/account?checkout=success&payment=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/app/account?checkout=canceled&payment=${payment.id}`,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerCheckoutSessionId: checkout.id,
        checkoutExpiresAt: checkout.expiresAt,
      },
    })

    return { success: true, paymentId: payment.id, checkoutUrl: checkout.url }
  } catch {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: 'checkout_provider_error',
      },
    })

    return { success: false, code: 'PROVIDER_ERROR', message: CHECKOUT_FAILURE_MESSAGE }
  }
}

export async function processCheckoutEvent(input: {
  provider: string
  event: VerifiedCheckoutEvent
}): Promise<ProcessCheckoutEventResult> {
  const eventRecord = await persistReceivedEvent(input)

  if (eventRecord.processingStatus === 'PROCESSED' || eventRecord.processingStatus === 'IGNORED') {
    return {
      success: true,
      outcome: 'ALREADY_PROCESSED',
      paymentId: eventRecord.paymentId,
    }
  }

  return prisma.$transaction(async (tx) => {
    const currentEvent = await tx.paymentEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.event.providerEventId,
        },
      },
    })

    if (
      !currentEvent
      || currentEvent.processingStatus === 'PROCESSED'
      || currentEvent.processingStatus === 'IGNORED'
    ) {
      return {
        success: true,
        outcome: 'ALREADY_PROCESSED',
        paymentId: currentEvent?.paymentId ?? null,
      }
    }

    if (input.event.kind === 'UNSUPPORTED') {
      await tx.paymentEvent.update({
        where: { id: currentEvent.id },
        data: { processingStatus: 'IGNORED', processedAt: new Date() },
      })
      return { success: true, outcome: 'IGNORED', paymentId: null }
    }

    if (!input.event.paymentId || !input.event.checkoutSessionId) {
      return failEvent(tx, currentEvent.id, 'INVALID_EVENT', 'El evento no identifica el pago o la sesión de checkout.')
    }

    const payment = await tx.payment.findFirst({
      where: {
        id: input.event.paymentId,
        provider: input.provider,
        providerCheckoutSessionId: input.event.checkoutSessionId,
      },
      include: { items: true },
    })

    if (!payment) {
      return failEvent(tx, currentEvent.id, 'PAYMENT_NOT_FOUND', 'No existe un pago local para esta sesión de checkout.')
    }

    if (input.event.kind === 'CHECKOUT_EXPIRED') {
      if (payment.status === 'PENDING') {
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'CANCELED' } })
      }
      await tx.paymentEvent.update({
        where: { id: currentEvent.id },
        data: { paymentId: payment.id, processingStatus: 'PROCESSED', processedAt: new Date() },
      })
      return { success: true, outcome: 'CANCELED', paymentId: payment.id }
    }

    const item = payment.items.length === 1 ? payment.items[0] : null
    const currency = input.event.currency?.toUpperCase() ?? null
    const isValidFulfillment = input.event.paymentStatus === 'paid'
      && input.event.amountTotal === payment.amount
      && currency === payment.currency.toUpperCase()
      && item?.itemType === 'CREDIT_PACK'
      && item.totalAmount === payment.amount
      && Boolean(item.entitlementUnits && item.entitlementUnits > 0)

    if (!isValidFulfillment || !item?.entitlementUnits) {
      return failEvent(tx, currentEvent.id, 'PAYMENT_MISMATCH', 'El pago confirmado no coincide con el snapshot comercial local.')
    }

    const expiresAt = item.entitlementExpiresAfterDays
      ? new Date(input.event.occurredAt.getTime() + item.entitlementExpiresAfterDays * 24 * 60 * 60 * 1_000)
      : null

    await tx.memberCreditAccount.upsert({
      where: { paymentId: payment.id },
      update: {},
      create: {
        memberId: payment.memberId,
        creditPackId: item.referenceId,
        paymentId: payment.id,
        status: 'ACTIVE',
        openedAt: input.event.occurredAt,
        expiresAt,
        ledgerEntries: {
          create: {
            entryType: 'PURCHASE',
            creditsDelta: item.entitlementUnits,
            balanceAfter: item.entitlementUnits,
            referenceType: 'payment',
            referenceId: payment.id,
            notes: 'Compra de bono confirmada por el proveedor de pagos.',
          },
        },
      },
    })

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        capturedAt: input.event.occurredAt,
        providerPaymentIntentId: input.event.paymentIntentId,
        failedAt: null,
        failureReason: null,
      },
    })
    await tx.paymentEvent.update({
      where: { id: currentEvent.id },
      data: {
        paymentId: payment.id,
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
      },
    })

    return { success: true, outcome: 'FULFILLED', paymentId: payment.id }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

async function persistReceivedEvent(input: {
  provider: string
  event: VerifiedCheckoutEvent
}) {
  try {
    return await prisma.paymentEvent.create({
      data: {
        provider: input.provider,
        providerEventId: input.event.providerEventId,
        eventType: input.event.providerEventType,
        payloadJson: input.event.safePayload,
        processingStatus: 'RECEIVED',
      },
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error

    const existing = await prisma.paymentEvent.findUniqueOrThrow({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.event.providerEventId,
        },
      },
    })
    return existing
  }
}

async function failEvent(
  tx: Prisma.TransactionClient,
  eventId: string,
  code: 'INVALID_EVENT' | 'PAYMENT_NOT_FOUND' | 'PAYMENT_MISMATCH',
  message: string,
): Promise<ProcessCheckoutEventResult> {
  await tx.paymentEvent.update({
    where: { id: eventId },
    data: { processingStatus: 'FAILED', processedAt: new Date() },
  })
  return { success: false, code, message }
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
