import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

export type AdminNotificationRetryActor = {
  userId: string
  displayName: string
}

export type AdminNotificationRetryResult =
  | { success: true; jobId: string }
  | {
      success: false
      code: 'INVALID' | 'NOT_FOUND' | 'NOT_RETRYABLE' | 'CONFLICT'
      message: string
    }

export async function requestAdminNotificationRetry(input: {
  jobId: string
  expectedUpdatedAt: string
  actor: AdminNotificationRetryActor
  now?: Date
}): Promise<AdminNotificationRetryResult> {
  const now = input.now ?? new Date()
  const expectedUpdatedAt = new Date(input.expectedUpdatedAt)

  if (!input.jobId || Number.isNaN(expectedUpdatedAt.getTime())) {
    return {
      success: false,
      code: 'INVALID',
      message: 'La entrega seleccionada ya no es válida. Recarga la vista.',
    }
  }

  return prisma.$transaction(async (tx) => {
    const job = await tx.notificationJob.findUnique({
      where: { id: input.jobId },
      select: {
        id: true,
        status: true,
        eventType: true,
        recipient: true,
        referenceId: true,
        attemptCount: true,
        updatedAt: true,
      },
    })

    if (!job) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'La entrega ya no existe.',
      }
    }

    if (job.status !== 'FAILED') {
      return {
        success: false,
        code: 'NOT_RETRYABLE',
        message: 'Solo se pueden reintentar entregas fallidas.',
      }
    }

    if (job.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      return {
        success: false,
        code: 'CONFLICT',
        message: 'La entrega cambió mientras la revisabas. Recarga antes de reintentar.',
      }
    }

    const update = await tx.notificationJob.updateMany({
      where: {
        id: job.id,
        status: 'FAILED',
        updatedAt: expectedUpdatedAt,
      },
      data: {
        status: 'PENDING',
        availableAt: now,
        lockedAt: null,
      },
    })

    if (update.count !== 1) {
      return {
        success: false,
        code: 'CONFLICT',
        message: 'Otro proceso ya ha reclamado esta entrega.',
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: input.actor.userId,
        actionType: 'NOTIFICATION_RETRY_REQUESTED',
        entityType: 'NotificationJob',
        entityId: job.id,
        contextJson: {
          eventType: job.eventType,
          recipient: job.recipient,
          referenceId: job.referenceId,
          previousAttemptCount: job.attemptCount,
          actorDisplayName: input.actor.displayName,
        },
      },
    })

    return { success: true, jobId: job.id }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
