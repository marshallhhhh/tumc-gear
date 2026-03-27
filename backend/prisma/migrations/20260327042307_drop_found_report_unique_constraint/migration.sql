-- DropIndex
DROP INDEX "FoundReport_itemId_reportedBy_status_key";

-- Replace with partial unique indexes that only enforce uniqueness for OPEN reports
CREATE UNIQUE INDEX IF NOT EXISTS one_open_report_per_item_per_reporter
  ON "FoundReport" ("itemId", "reportedBy")
  WHERE "reportedBy" IS NOT NULL AND status = 'OPEN';

CREATE UNIQUE INDEX IF NOT EXISTS one_open_anon_report_per_item
  ON "FoundReport" ("itemId")
  WHERE "reportedBy" IS NULL AND status = 'OPEN';
