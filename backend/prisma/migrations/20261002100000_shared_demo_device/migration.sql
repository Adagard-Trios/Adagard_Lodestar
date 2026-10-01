-- Shared demo phones (PLATFORM.md §2.6): the seeded persona phones a judge's browser may adopt after sign-in.
ALTER TABLE "auth"."Device" ADD COLUMN "sharedDemo" BOOLEAN NOT NULL DEFAULT false;
