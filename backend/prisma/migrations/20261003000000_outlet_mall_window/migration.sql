-- Mall delivery window of mall_dock outlets ("HH:mm-HH:mm", outlet master mall_window); planning checks mall stops against it.
ALTER TABLE "outlets"."Outlet" ADD COLUMN "mallWindow" TEXT;
