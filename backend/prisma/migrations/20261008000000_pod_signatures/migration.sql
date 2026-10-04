-- Receiver signatures (DR-03 / DR-20) travel with the POD photos: same table, told apart by "kind".
-- Additive only: defaulted / nullable columns; every existing row stays a PHOTO and every POD unsigned.

ALTER TABLE "trips"."PodPhoto" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'PHOTO';
ALTER TABLE "trips"."POD" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "trips"."POD" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
