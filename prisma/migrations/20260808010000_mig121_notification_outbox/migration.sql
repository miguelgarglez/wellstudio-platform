CREATE TYPE "NotificationEventType" AS ENUM ('RESERVATION_BOOKED', 'RESERVATION_CANCELED');

CREATE TYPE "NotificationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TYPE "NotificationAttemptStatus" AS ENUM ('SENT', 'FAILED');

CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "status" "NotificationJobStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "notificationJobId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "NotificationAttemptStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationJob_idempotencyKey_key" ON "NotificationJob"("idempotencyKey");
CREATE INDEX "NotificationJob_status_availableAt_idx" ON "NotificationJob"("status", "availableAt");
CREATE INDEX "NotificationJob_referenceType_referenceId_idx" ON "NotificationJob"("referenceType", "referenceId");
CREATE UNIQUE INDEX "NotificationDeliveryAttempt_notificationJobId_attemptNumber_key" ON "NotificationDeliveryAttempt"("notificationJobId", "attemptNumber");
CREATE INDEX "NotificationDeliveryAttempt_status_attemptedAt_idx" ON "NotificationDeliveryAttempt"("status", "attemptedAt");

ALTER TABLE "NotificationDeliveryAttempt"
ADD CONSTRAINT "NotificationDeliveryAttempt_notificationJobId_fkey"
FOREIGN KEY ("notificationJobId") REFERENCES "NotificationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
