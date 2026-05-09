ALTER TABLE "Lead"
ADD COLUMN IF NOT EXISTS "normalizedPhone" TEXT,
ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "privacyPolicyVersion" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_normalizedPhone_status_createdAt_idx"
ON "Lead" ("normalizedPhone", "status", "createdAt");
