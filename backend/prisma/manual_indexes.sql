-- =============================================================================
-- MANUAL INDEXES — run these after `prisma migrate deploy`
-- Prisma schema cannot express partial indexes or GIN indexes natively.
-- Run this file once against your database (dev and prod separately).
-- =============================================================================

-- 1. ONE ACTIVE LOAN PER ITEM (Critical)
--    Prevents concurrent checkouts from corrupting item availability state.
--    Safe to re-run: IF NOT EXISTS guard.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_loan_per_item
  ON "Loan" ("itemId")
  WHERE status = 'ACTIVE';

  CREATE UNIQUE INDEX IF NOT EXISTS one_open_anon_report_per_item
  ON "FoundReport" ("itemId")
  WHERE "reportedBy" IS NULL AND status = 'OPEN';

-- 3. ONE OPEN REPORT PER ITEM PER AUTHENTICATED REPORTER
--    Prevents duplicate open found reports for the same item by the same user.
--    Replaces the former @@unique([itemId, reportedBy, status]) Prisma constraint
--    which incorrectly blocked multiple CLOSED reports for the same item+reporter.
CREATE UNIQUE INDEX IF NOT EXISTS one_open_report_per_item_per_reporter
  ON "FoundReport" ("itemId", "reportedBy")
  WHERE "reportedBy" IS NOT NULL AND status = 'OPEN';