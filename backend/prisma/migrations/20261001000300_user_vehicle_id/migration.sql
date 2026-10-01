-- Users: the driver's vehicle, mirrored to Keycloak's vehicle_id attribute (token claim).
-- Plain column (no cross-service foreign key); the auth service validates it on write.
ALTER TABLE "auth"."User" ADD COLUMN "vehicleId" TEXT;
