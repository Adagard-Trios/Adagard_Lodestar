-- Dispatcher "close orders" for a run date and depot (Orders/Lodestar.CloseOrders): while a row is closed,
-- the orders service refuses new orders for that run. Additive only: a new table, nothing existing changes.

CREATE TABLE IF NOT EXISTS "orders"."OrderClosure" (
    "depot" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT true,
    "closedBy" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "reopenedBy" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderClosure_pkey" PRIMARY KEY ("depot","runDate")
);
