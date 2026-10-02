-- Per-user preferences (DSP-20, DSP-33, SM-30): read and written only by the signed-in user.
ALTER TABLE "auth"."User" ADD COLUMN "preferences" JSONB;

-- Reference-data CSV imports (ADM-14/15): the check result and what was applied, never the CSV itself.
CREATE TABLE "outlets"."DataImport" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "fileName" TEXT,
    "rows" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "applied" BOOLEAN NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "problems" JSONB NOT NULL,
    "checks" JSONB NOT NULL,
    "importedBy" TEXT NOT NULL,
    "byName" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataImport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataImport_file_importedAt_idx" ON "outlets"."DataImport"("file", "importedAt");
