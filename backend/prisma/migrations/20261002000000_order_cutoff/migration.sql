-- 4:00 PM order cut-off: dispatch may log a late phone order (DSP-10) with a reason.
ALTER TABLE "orders"."Order" ADD COLUMN "latePhone" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lateReason" TEXT;
