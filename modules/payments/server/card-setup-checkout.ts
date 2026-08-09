import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type {
  PaymentCheckoutProvider,
  VerifiedCheckoutEvent,
} from '@/modules/payments/server/checkout-provider'

const CARD_SETUP_FAILURE_MESSAGE =
  'No se ha podido preparar la vinculación de tarjeta. Inténtalo de nuevo en unos minutos.'

export type StartCardSetupCheckoutResult =
  | { success: true; paymentId: string; checkoutUrl: string }
  | {
      success: false
      code: 'MEMBER_INACTIVE' | 'PROVIDER_ERROR'
      message: string
    }

export type ProcessCardSetupEventResult =
  | {
      success: true
      outcome: 'FULFILLED' | 'CANCELED' | 'IGNORED' | 'ALREADY_PROCESSED'
      paymentId: string | null
      cardId?: string | null
    }
  | {
      success: false
      code: 'INVALID_EVENT' | 'PAYMENT_NOT_FOUND' | 'PAYMENT_MISMATCH'
      message: string
    }

export async function startCardSetupCheckout(input: {
  memberId: string
  appUrl: string
  provider: PaymentCheckoutProvider
}): Promise<StartCardSetupCheckoutResult> {
  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: {
      id: true,
      status: true,
      user: { select: { email: true, status: true } },
      cards: {
        where: {
          provider: input.provider.provider,
          providerCustomerId: { not: null },
        },
        select: { providerCustomerId: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!member || member.status !== 'ACTIVE' || member.user.status !== 'ACTIVE') {
    return {
      success: false,
      code: 'MEMBER_INACTIVE',
      message: 'Tu cuenta debe estar activa para vincular una tarjeta.',
    }
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: member.id,
      provider: input.provider.provider,
      status: 'PENDING',
      paymentType: 'CARD_SETUP',
      amount: 0,
      currency: 'EUR',
    },
    select: { id: true },
  })

  try {
    const appUrl = input.appUrl.replace(/\/$/, '')
    const checkout = await input.provider.createCardSetupCheckout({
      paymentId: payment.id,
      memberId: member.id,
      customerEmail: member.user.email,
      customerId: member.cards[0]?.providerCustomerId ?? null,
      successUrl: `${appUrl}/app/account?card=success&payment=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/app/account?card=canceled&payment=${payment.id}`,
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
        failureReason: 'card_setup_provider_error',
      },
    })

    return { success: false, code: 'PROVIDER_ERROR', message: CARD_SETUP_FAILURE_MESSAGE }
  }
}

export async function processCardSetupEvent(input: {
  provider: string
  event: VerifiedCheckoutEvent
}): Promise<ProcessCardSetupEventResult> {
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
      return failEvent(tx, currentEvent.id, 'INVALID_EVENT', 'El evento no identifica la sesión de vinculación.')
    }

    const payment = await tx.payment.findFirst({
      where: {
        id: input.event.paymentId,
        provider: input.provider,
        providerCheckoutSessionId: input.event.checkoutSessionId,
        paymentType: 'CARD_SETUP',
      },
    })

    if (!payment) {
      return failEvent(tx, currentEvent.id, 'PAYMENT_NOT_FOUND', 'No existe una vinculación local para esta sesión.')
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

    const paymentMethodId = input.event.paymentMethodId
    const customerId = input.event.customerId
    const cardDetails = input.event.card
    const isValidSetup = input.event.mode === 'setup'
      && input.event.paymentStatus === 'no_payment_required'
      && Boolean(paymentMethodId)
      && Boolean(customerId)
      && Boolean(cardDetails?.last4)

    if (!isValidSetup || !paymentMethodId || !customerId || !cardDetails?.last4) {
      return failEvent(
        tx,
        currentEvent.id,
        'PAYMENT_MISMATCH',
        'La vinculación confirmada no incluye un método de pago usable.',
      )
    }

    await tx.card.updateMany({
      where: {
        memberId: payment.memberId,
        isDefault: true,
        NOT: {
          AND: [
            { provider: input.provider },
            { providerPaymentMethodId: paymentMethodId },
          ],
        },
      },
      data: { isDefault: false },
    })

    const card = await tx.card.upsert({
      where: {
        provider_providerPaymentMethodId: {
          provider: input.provider,
          providerPaymentMethodId: paymentMethodId,
        },
      },
      update: {
        memberId: payment.memberId,
        providerCustomerId: customerId,
        brand: normalizeBrand(cardDetails.brand),
        last4: cardDetails.last4,
        expMonth: cardDetails.expMonth,
        expYear: cardDetails.expYear,
        isDefault: true,
        status: 'ACTIVE',
      },
      create: {
        memberId: payment.memberId,
        provider: input.provider,
        providerCustomerId: customerId,
        providerPaymentMethodId: paymentMethodId,
        brand: normalizeBrand(cardDetails.brand),
        last4: cardDetails.last4,
        expMonth: cardDetails.expMonth,
        expYear: cardDetails.expYear,
        isDefault: true,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        capturedAt: input.event.occurredAt,
        cardId: card.id,
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

    return {
      success: true,
      outcome: 'FULFILLED',
      paymentId: payment.id,
      cardId: card.id,
    }
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

    return prisma.paymentEvent.findUniqueOrThrow({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.event.providerEventId,
        },
      },
    })
  }
}

async function failEvent(
  tx: Prisma.TransactionClient,
  eventId: string,
  code: 'INVALID_EVENT' | 'PAYMENT_NOT_FOUND' | 'PAYMENT_MISMATCH',
  message: string,
): Promise<ProcessCardSetupEventResult> {
  await tx.paymentEvent.update({
    where: { id: eventId },
    data: { processingStatus: 'FAILED', processedAt: new Date() },
  })
  return { success: false, code, message }
}

function normalizeBrand(brand: string | null | undefined) {
  if (!brand) return null
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase()
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
