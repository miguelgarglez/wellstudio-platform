DO $$ BEGIN
    CREATE TYPE "MembershipBookingPolicyType" AS ENUM ('UNLIMITED', 'PERIODIC_ALLOWANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MembershipBookingPeriodType" AS ENUM ('CALENDAR_WEEK', 'CALENDAR_MONTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MemberMembershipBookingOverrideType" AS ENUM ('EXTRA_ALLOWANCE', 'SESSION_ACCESS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "MembershipBookingPolicy" (
    "id" TEXT NOT NULL,
    "membershipPlanId" TEXT NOT NULL,
    "policyType" "MembershipBookingPolicyType" NOT NULL,
    "periodType" "MembershipBookingPeriodType",
    "allowanceCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipBookingPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipBookingPolicy_membershipPlanId_key"
ON "MembershipBookingPolicy" ("membershipPlanId");

CREATE TABLE IF NOT EXISTS "MemberMembershipBookingOverride" (
    "id" TEXT NOT NULL,
    "memberMembershipId" TEXT NOT NULL,
    "overrideType" "MemberMembershipBookingOverrideType" NOT NULL,
    "classSessionId" TEXT,
    "extraBookings" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberMembershipBookingOverride_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MemberMembershipBookingOverride_memberMembershipId_overrideTyp_idx"
ON "MemberMembershipBookingOverride" ("memberMembershipId", "overrideType", "startsAt", "expiresAt");

CREATE INDEX IF NOT EXISTS "MemberMembershipBookingOverride_classSessionId_startsAt_exp_idx"
ON "MemberMembershipBookingOverride" ("classSessionId", "startsAt", "expiresAt");

ALTER TABLE "ReservationEntitlementUsage"
ADD COLUMN IF NOT EXISTS "bookingOverrideId" TEXT;

DO $$ BEGIN
    ALTER TABLE "MembershipBookingPolicy"
    ADD CONSTRAINT "MembershipBookingPolicy_membershipPlanId_fkey"
    FOREIGN KEY ("membershipPlanId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MemberMembershipBookingOverride"
    ADD CONSTRAINT "MemberMembershipBookingOverride_memberMembershipId_fkey"
    FOREIGN KEY ("memberMembershipId") REFERENCES "MemberMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MemberMembershipBookingOverride"
    ADD CONSTRAINT "MemberMembershipBookingOverride_classSessionId_fkey"
    FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MemberMembershipBookingOverride"
    ADD CONSTRAINT "MemberMembershipBookingOverride_grantedByUserId_fkey"
    FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MemberMembershipBookingOverride"
    ADD CONSTRAINT "MemberMembershipBookingOverride_revokedByUserId_fkey"
    FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ReservationEntitlementUsage"
    ADD CONSTRAINT "ReservationEntitlementUsage_bookingOverrideId_fkey"
    FOREIGN KEY ("bookingOverrideId") REFERENCES "MemberMembershipBookingOverride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
