DO $$ BEGIN
    CREATE TYPE "LeadActivityType" AS ENUM ('NOTE', 'STATUS_CHANGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus",
    "note" TEXT,
    "actorUserId" TEXT,
    "actorDisplayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadActivity_payload_check" CHECK (
        (
            "type" = 'NOTE'
            AND "fromStatus" IS NULL
            AND "toStatus" IS NULL
            AND LENGTH(BTRIM("note")) BETWEEN 1 AND 1000
        )
        OR
        (
            "type" = 'STATUS_CHANGED'
            AND "fromStatus" IS NOT NULL
            AND "toStatus" IS NOT NULL
            AND "fromStatus" <> "toStatus"
            AND ("note" IS NULL OR LENGTH(BTRIM("note")) BETWEEN 1 AND 1000)
        )
    ),
    CONSTRAINT "LeadActivity_actorDisplayName_check" CHECK (
        LENGTH(BTRIM("actorDisplayName")) > 0
    )
);

CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_createdAt_id_idx"
ON "LeadActivity" ("leadId", "createdAt", "id");

CREATE INDEX IF NOT EXISTS "LeadActivity_actorUserId_createdAt_idx"
ON "LeadActivity" ("actorUserId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "LeadActivity"
    ADD CONSTRAINT "LeadActivity_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "LeadActivity"
    ADD CONSTRAINT "LeadActivity_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
