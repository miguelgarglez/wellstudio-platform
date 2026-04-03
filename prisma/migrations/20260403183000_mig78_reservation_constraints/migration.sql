CREATE UNIQUE INDEX IF NOT EXISTS "reservation_member_session_booked_unique"
ON "Reservation" ("memberId", "classSessionId")
WHERE "status" = 'BOOKED';

CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_member_session_active_unique"
ON "WaitlistEntry" ("memberId", "classSessionId")
WHERE "status" IN ('WAITING', 'NOTIFIED');
