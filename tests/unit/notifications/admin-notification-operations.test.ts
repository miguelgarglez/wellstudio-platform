import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock, txMock } = vi.hoisted(() => {
  const tx = {
    notificationJob: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  }

  return {
    txMock: tx,
    prismaMock: {
      $transaction: vi.fn(),
    },
  }
})

vi.mock('@/lib/db/prisma', () => ({ prisma: prismaMock }))

import { requestAdminNotificationRetry } from '@/modules/notifications/server/admin-notification-operations'

const now = new Date('2026-08-08T12:00:00.000Z')
const updatedAt = new Date('2026-08-08T11:00:00.000Z')

describe('requestAdminNotificationRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock))
    txMock.notificationJob.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'FAILED',
      eventType: 'RESERVATION_BOOKED',
      recipient: 'ana@example.com',
      referenceId: 'reservation-1',
      attemptCount: 5,
      updatedAt,
    })
    txMock.notificationJob.updateMany.mockResolvedValue({ count: 1 })
    txMock.auditLog.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('requeues an exhausted failure without resetting its attempt count', async () => {
    const result = await requestAdminNotificationRetry({
      jobId: 'job-1',
      expectedUpdatedAt: updatedAt.toISOString(),
      actor: { userId: 'admin-1', displayName: 'Admin' },
      now,
    })

    expect(result).toEqual({ success: true, jobId: 'job-1' })
    expect(txMock.notificationJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'FAILED', updatedAt },
      data: { status: 'PENDING', availableAt: now, lockedAt: null },
    })
    expect(txMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        actionType: 'NOTIFICATION_RETRY_REQUESTED',
        entityType: 'NotificationJob',
        entityId: 'job-1',
        contextJson: expect.objectContaining({ previousAttemptCount: 5 }),
      }),
    })
  })

  it('rejects sent or concurrently changed jobs', async () => {
    txMock.notificationJob.findUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: 'SENT',
      eventType: 'RESERVATION_BOOKED',
      recipient: 'ana@example.com',
      referenceId: 'reservation-1',
      attemptCount: 1,
      updatedAt,
    })

    await expect(requestAdminNotificationRetry({
      jobId: 'job-1',
      expectedUpdatedAt: updatedAt.toISOString(),
      actor: { userId: 'admin-1', displayName: 'Admin' },
      now,
    })).resolves.toMatchObject({ success: false, code: 'NOT_RETRYABLE' })

    txMock.notificationJob.findUnique.mockResolvedValueOnce({
      id: 'job-1',
      status: 'FAILED',
      eventType: 'RESERVATION_BOOKED',
      recipient: 'ana@example.com',
      referenceId: 'reservation-1',
      attemptCount: 5,
      updatedAt: new Date('2026-08-08T11:01:00.000Z'),
    })

    await expect(requestAdminNotificationRetry({
      jobId: 'job-1',
      expectedUpdatedAt: updatedAt.toISOString(),
      actor: { userId: 'admin-1', displayName: 'Admin' },
      now,
    })).resolves.toMatchObject({ success: false, code: 'CONFLICT' })
  })
})
