ALTER TABLE "MemberCreditAccount"
ADD CONSTRAINT "MemberCreditAccount_paymentId_key" UNIQUE ("paymentId");

ALTER TABLE "Payment"
ADD COLUMN "providerCheckoutSessionId" TEXT,
ADD COLUMN "checkoutExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_provider_providerCheckoutSessionId_key"
ON "Payment"("provider", "providerCheckoutSessionId");

ALTER TABLE "PaymentItem"
ADD COLUMN "entitlementUnits" INTEGER,
ADD COLUMN "entitlementExpiresAfterDays" INTEGER;
