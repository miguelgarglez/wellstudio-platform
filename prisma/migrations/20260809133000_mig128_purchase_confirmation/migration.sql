ALTER TYPE "NotificationEventType" ADD VALUE 'CREDIT_PACK_PURCHASED';

ALTER TABLE "PaymentItem"
ADD COLUMN "productNameSnapshot" TEXT;
