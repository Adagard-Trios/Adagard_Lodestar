-- =============================================================================
-- Waypoint Lodestar — one PostgreSQL schema per owning service (multiSchema)
-- Tables and enum types move out of "public" with ALTER … SET SCHEMA, which keeps
-- every row, index, constraint, cross-schema foreign key and owned sequence.
-- (A generated diff would drop and recreate them; this migration is hand-written.)
-- =============================================================================

-- Schemas
CREATE SCHEMA IF NOT EXISTS "auth";
CREATE SCHEMA IF NOT EXISTS "orders";
CREATE SCHEMA IF NOT EXISTS "planning";
CREATE SCHEMA IF NOT EXISTS "fleet";
CREATE SCHEMA IF NOT EXISTS "outlets";
CREATE SCHEMA IF NOT EXISTS "trips";
CREATE SCHEMA IF NOT EXISTS "sync";
CREATE SCHEMA IF NOT EXISTS "notifications";
CREATE SCHEMA IF NOT EXISTS "audit";

-- Enum types
ALTER TYPE "public"."Role" SET SCHEMA "auth";
ALTER TYPE "public"."Depot" SET SCHEMA "outlets";
ALTER TYPE "public"."Brand" SET SCHEMA "outlets";
ALTER TYPE "public"."TempClass" SET SCHEMA "orders";
ALTER TYPE "public"."DockType" SET SCHEMA "outlets";
ALTER TYPE "public"."ParkingType" SET SCHEMA "outlets";
ALTER TYPE "public"."VehicleType" SET SCHEMA "fleet";
ALTER TYPE "public"."VehicleStatus" SET SCHEMA "fleet";
ALTER TYPE "public"."OrderStatus" SET SCHEMA "orders";
ALTER TYPE "public"."TripStatus" SET SCHEMA "trips";
ALTER TYPE "public"."NotificationChannel" SET SCHEMA "notifications";
ALTER TYPE "public"."DeferralStatus" SET SCHEMA "planning";
ALTER TYPE "public"."PlanStatus" SET SCHEMA "planning";
ALTER TYPE "public"."PlanSource" SET SCHEMA "planning";
ALTER TYPE "public"."DeviceStatus" SET SCHEMA "auth";
ALTER TYPE "public"."DeferralReason" SET SCHEMA "planning";

-- Tables (indexes, constraints and SERIAL sequences move with them)
ALTER TABLE "public"."User" SET SCHEMA "auth";
ALTER TABLE "public"."Outlet" SET SCHEMA "outlets";
ALTER TABLE "public"."Vehicle" SET SCHEMA "fleet";
ALTER TABLE "public"."Order" SET SCHEMA "orders";
ALTER TABLE "public"."OrderLineItem" SET SCHEMA "orders";
ALTER TABLE "public"."Trip" SET SCHEMA "trips";
ALTER TABLE "public"."TripStop" SET SCHEMA "trips";
ALTER TABLE "public"."POD" SET SCHEMA "trips";
ALTER TABLE "public"."LoadRecord" SET SCHEMA "trips";
ALTER TABLE "public"."OfflineEvent" SET SCHEMA "sync";
ALTER TABLE "public"."DeferralLog" SET SCHEMA "planning";
ALTER TABLE "public"."Notification" SET SCHEMA "notifications";
ALTER TABLE "public"."Calendar" SET SCHEMA "outlets";
ALTER TABLE "public"."DistrictTravel" SET SCHEMA "outlets";
ALTER TABLE "public"."ServiceAllowance" SET SCHEMA "outlets";
ALTER TABLE "public"."Plan" SET SCHEMA "planning";
ALTER TABLE "public"."AgentRun" SET SCHEMA "planning";
ALTER TABLE "public"."Device" SET SCHEMA "auth";
ALTER TABLE "public"."AuditEntry" SET SCHEMA "audit";

-- The append-only trigger function follows its table
ALTER FUNCTION "public"."audit_entry_append_only"() SET SCHEMA "audit";
