-- =============================================================================
-- Field app support
--   1. Store receipt on the order (Orders('…')/Lodestar.ConfirmReceipt, SM-03):
--      the store's count, who counted it and when, and the credit note issued
--      when the count is short (CN-YYMM-NNNN, the same id the POD carries).
--   2. Idempotency-Key records, one table in the schema of each service whose
--      writes honour the header (orders: POST Orders, ConfirmReceipt;
--      trips: Release, RecordShortfalls, POST LoadRecords). Kept >= 24 h.
-- New tables inherit the svc_<schema> grants through the default privileges
-- set up by the db-roles init job.
-- =============================================================================

-- 1. Receipt on the order
ALTER TABLE "orders"."Order" ADD COLUMN     "unitsReceived" INTEGER,
ADD COLUMN     "unitsExpected" INTEGER,
ADD COLUMN     "receiptNote" TEXT,
ADD COLUMN     "receiptSavedAt" TIMESTAMP(3),
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "receivedBy" TEXT,
ADD COLUMN     "creditNoteId" TEXT;

CREATE UNIQUE INDEX "Order_creditNoteId_key" ON "orders"."Order"("creditNoteId");

-- 2. Idempotency-Key records
CREATE TABLE "orders"."IdempotencyKey" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("userId","key")
);

CREATE TABLE "trips"."IdempotencyKey" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("userId","key")
);

CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "orders"."IdempotencyKey"("expiresAt");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "trips"."IdempotencyKey"("expiresAt");
