-- Stored weekly demand forecasts (DSP-05 capacity outlook), scored against delivered volume (WAPE) by the
-- planning rules' measured model quality. Additive only: one new table in the planning schema; nothing existing
-- changes, and re-running it is harmless.

CREATE TABLE IF NOT EXISTS "planning"."DemandForecast" (
    "id" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "totalM3" DOUBLE PRECISION NOT NULL,
    "chilledM3" DOUBLE PRECISION NOT NULL,
    "forecastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DemandForecast_depot_weekStart_source_key" ON "planning"."DemandForecast"("depot", "weekStart", "source");
CREATE INDEX IF NOT EXISTS "DemandForecast_weekStart_idx" ON "planning"."DemandForecast"("weekStart");
