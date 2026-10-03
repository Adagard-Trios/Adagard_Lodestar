-- Proof-of-delivery photos leave the phone: stored in Postgres (bytea) next to the stop and its POD.
-- Additive only: a new table and a defaulted column on POD; nothing existing changes.

ALTER TABLE "trips"."POD" ADD COLUMN IF NOT EXISTS "photoCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "trips"."PodPhoto" (
    "id" TEXT NOT NULL,
    "tripStopId" TEXT NOT NULL,
    "podId" TEXT,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "eventId" TEXT,
    "takenAt" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PodPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PodPhoto_eventId_key" ON "trips"."PodPhoto"("eventId");
CREATE INDEX IF NOT EXISTS "PodPhoto_podId_idx" ON "trips"."PodPhoto"("podId");
CREATE UNIQUE INDEX IF NOT EXISTS "PodPhoto_tripStopId_sha256_key" ON "trips"."PodPhoto"("tripStopId", "sha256");

ALTER TABLE "trips"."PodPhoto" ADD CONSTRAINT "PodPhoto_tripStopId_fkey" FOREIGN KEY ("tripStopId") REFERENCES "trips"."TripStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips"."PodPhoto" ADD CONSTRAINT "PodPhoto_podId_fkey" FOREIGN KEY ("podId") REFERENCES "trips"."POD"("id") ON DELETE SET NULL ON UPDATE CASCADE;
