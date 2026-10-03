-- Depots become reference data registered from the Admin desk (ADM-21) instead of a fixed enum.
-- Non-destructive: the table is created and seeded with the two existing depots, every depot column keeps its
-- values (enum label -> text), and the enum is dropped only once nothing uses it.

ALTER TABLE "auth"."User"               ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "outlets"."Outlet"          ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "fleet"."Vehicle"           ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "trips"."Trip"              ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "outlets"."DistrictTravel"  ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "planning"."Plan"           ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;
ALTER TABLE "planning"."AgentRun"       ALTER COLUMN "depot" TYPE TEXT USING "depot"::text;

-- A table's row type shares the namespace with types, so the enum goes before the table is created.
DROP TYPE IF EXISTS "outlets"."Depot";

CREATE TABLE IF NOT EXISTS "outlets"."Depot" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("code")
);

-- The two depots of the outlet master (data/outlets.csv), named as the desk has always shown them.
INSERT INTO "outlets"."Depot" ("code", "name", "district")
VALUES ('PELIYAGODA', 'Peliyagoda DC', 'Gampaha'),
       ('KANDY', 'Kandy Hub', 'Kandy')
ON CONFLICT ("code") DO NOTHING;

-- Same-schema references keep integrity in the database; other schemas reference the code by value.
ALTER TABLE "outlets"."Outlet" ADD CONSTRAINT "Outlet_depot_fkey"
    FOREIGN KEY ("depot") REFERENCES "outlets"."Depot"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "outlets"."DistrictTravel" ADD CONSTRAINT "DistrictTravel_depot_fkey"
    FOREIGN KEY ("depot") REFERENCES "outlets"."Depot"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
