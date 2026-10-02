-- Weekly fuel quota: usedLThisWeek counts the week starting at fuelWeekStart (Monday 00:00 Asia/Colombo).
-- The fleet service starts the count again at 0 the first time it touches a vehicle in a new week.
ALTER TABLE "fleet"."Vehicle" ADD COLUMN "fuelWeekStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
