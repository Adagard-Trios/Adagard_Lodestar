-- =============================================================================
-- Waypoint Lodestar — Initial Migration
-- Generated from schema.prisma (Prisma 5.x)
-- =============================================================================

-- Enums
CREATE TYPE "Role"               AS ENUM ('DISPATCHER', 'LOADER', 'DRIVER', 'STORE_MANAGER', 'ADMIN');
CREATE TYPE "Depot"              AS ENUM ('PELIYAGODA', 'KANDY');
CREATE TYPE "Brand"              AS ENUM ('FRESH', 'STYLE', 'TECH');
CREATE TYPE "TempClass"          AS ENUM ('CHILLED', 'AMBIENT');
CREATE TYPE "DockType"           AS ENUM ('REAR_DOCK', 'STREET', 'MALL_BAY');
CREATE TYPE "ParkingType"        AS ENUM ('NORMAL', 'VAN_ONLY', 'MALL_DOCK');
CREATE TYPE "VehicleType"        AS ENUM ('TRUCK', 'VAN');
CREATE TYPE "VehicleStatus"      AS ENUM ('AVAILABLE', 'WORKSHOP', 'ENROUTE');
CREATE TYPE "OrderStatus"        AS ENUM ('RECEIVED', 'PLANNED', 'LOADED', 'ENROUTE', 'DELIVERED', 'DEFERRED', 'EXCEPTION');
CREATE TYPE "TripStatus"         AS ENUM ('PLANNED', 'LOADING', 'ENROUTE', 'COMPLETE');
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'WEBSOCKET');
CREATE TYPE "DeferralReason"     AS ENUM ('CAP_REEFER', 'CAP_TIME', 'ACCESS', 'WINDOW', 'FUEL', 'VEH_DOWN');

-- Reference tables
CREATE TABLE "Calendar" (
    "date"          TIMESTAMP(3) NOT NULL,
    "isOperating"   BOOLEAN NOT NULL,
    "isPayday"      BOOLEAN NOT NULL DEFAULT false,
    "festivalRamp"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monsoon"       INTEGER NOT NULL DEFAULT 0,
    "festivalName"  TEXT,
    "note"          TEXT,
    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "DistrictTravel" (
    "district"         TEXT NOT NULL,
    "depot"            "Depot" NOT NULL,
    "roadClass"        TEXT NOT NULL,
    "depotToDistMin"   INTEGER NOT NULL,
    "interStopMin"     INTEGER NOT NULL,
    "distKm"           DOUBLE PRECISION,
    CONSTRAINT "DistrictTravel_pkey" PRIMARY KEY ("district")
);

CREATE TABLE "ServiceAllowance" (
    "brand"    "Brand" NOT NULL,
    "dockType" "DockType" NOT NULL,
    "minutes"  INTEGER NOT NULL,
    CONSTRAINT "ServiceAllowance_pkey" PRIMARY KEY ("brand", "dockType")
);

-- Outlets
CREATE TABLE "Outlet" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "brand"       "Brand" NOT NULL,
    "district"    TEXT NOT NULL,
    "depot"       "Depot" NOT NULL,
    "dockType"    "DockType" NOT NULL,
    "parking"     "ParkingType" NOT NULL,
    "windowOpen"  TEXT NOT NULL,
    "windowClose" TEXT NOT NULL,
    "address"     TEXT,
    "accessNote"  TEXT,
    "lat"         DOUBLE PRECISION,
    "lng"         DOUBLE PRECISION,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- Users
CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role"         "Role" NOT NULL,
    "depot"        "Depot",
    "outletId"     TEXT,
    "phone"        TEXT,
    "refreshToken" TEXT,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Vehicles
CREATE TABLE "Vehicle" (
    "id"             TEXT NOT NULL,
    "depot"          "Depot" NOT NULL,
    "type"           "VehicleType" NOT NULL,
    "tempClass"      "TempClass" NOT NULL,
    "capacityKg"     DOUBLE PRECISION NOT NULL,
    "capacityM3"     DOUBLE PRECISION NOT NULL,
    "kmPerLitre"     DOUBLE PRECISION NOT NULL,
    "weeklyLFuel"    INTEGER NOT NULL,
    "usedLThisWeek"  INTEGER NOT NULL DEFAULT 0,
    "status"         "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "workshopNote"   TEXT,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- Orders
CREATE TABLE "Order" (
    "id"                TEXT NOT NULL,
    "outletId"          TEXT NOT NULL,
    "runDate"           TIMESTAMP(3) NOT NULL,
    "orderedAt"         TIMESTAMP(3) NOT NULL,
    "brand"             "Brand" NOT NULL,
    "tempClass"         "TempClass" NOT NULL,
    "units"             INTEGER NOT NULL,
    "kg"                DOUBLE PRECISION NOT NULL,
    "m3"                DOUBLE PRECISION NOT NULL,
    "status"            "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "deferredYesterday" BOOLEAN NOT NULL DEFAULT false,
    "daysSince"         INTEGER NOT NULL DEFAULT 0,
    "deferralScore"     INTEGER,
    "notes"             TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderLineItem" (
    "id"        TEXT NOT NULL,
    "orderId"   TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "qty"       INTEGER NOT NULL,
    "kg"        DOUBLE PRECISION NOT NULL,
    "tempClass" "TempClass" NOT NULL,
    CONSTRAINT "OrderLineItem_pkey" PRIMARY KEY ("id")
);

-- Trips
CREATE TABLE "Trip" (
    "id"            TEXT NOT NULL,
    "vehicleId"     TEXT NOT NULL,
    "driverId"      TEXT,
    "depot"         "Depot" NOT NULL,
    "runDate"       TIMESTAMP(3) NOT NULL,
    "brand"         "Brand" NOT NULL,
    "district"      TEXT NOT NULL,
    "status"        "TripStatus" NOT NULL DEFAULT 'PLANNED',
    "planVersion"   INTEGER NOT NULL DEFAULT 1,
    "tripNumber"    INTEGER NOT NULL DEFAULT 1,
    "departTime"    TIMESTAMP(3),
    "returnTime"    TIMESTAMP(3),
    "planMinutes"   INTEGER,
    "actualMinutes" INTEGER,
    "sealNumber"    TEXT,
    "reeferTempC"   DOUBLE PRECISION,
    "bay"           TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripStop" (
    "id"                  TEXT NOT NULL,
    "tripId"              TEXT NOT NULL,
    "orderId"             TEXT NOT NULL,
    "outletId"            TEXT NOT NULL,
    "stopSeq"             INTEGER NOT NULL,
    "etaPlan"             TIMESTAMP(3),
    "etaModel"            TIMESTAMP(3),
    "etaModelBandEarly"   TIMESTAMP(3),
    "etaModelBandLate"    TIMESTAMP(3),
    "lateRiskPct"         INTEGER,
    "serviceMinPredicted" INTEGER,
    "arrivalActual"       TIMESTAMP(3),
    "leaveActual"         TIMESTAMP(3),
    "status"              "OrderStatus" NOT NULL DEFAULT 'PLANNED',
    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TripStop_orderId_key" ON "TripStop"("orderId");

CREATE TABLE "POD" (
    "id"             TEXT NOT NULL,
    "tripStopId"     TEXT NOT NULL,
    "unitsDelivered" INTEGER NOT NULL,
    "unitsOrdered"   INTEGER NOT NULL,
    "photoUrl"       TEXT,
    "receiverName"   TEXT,
    "signature"      TEXT,
    "exceptions"     JSONB,
    "creditNoteId"   TEXT,
    "savedOffline"   BOOLEAN NOT NULL DEFAULT false,
    "savedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt"       TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "POD_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "POD_tripStopId_key" ON "POD"("tripStopId");

CREATE TABLE "LoadRecord" (
    "id"          TEXT NOT NULL,
    "tripId"      TEXT NOT NULL,
    "vehicleId"   TEXT NOT NULL,
    "loaderId"    TEXT NOT NULL,
    "bay"         TEXT NOT NULL,
    "sealNumber"  TEXT,
    "reeferTempC" DOUBLE PRECISION,
    "loadedAt"    TIMESTAMP(3),
    "releasedAt"  TIMESTAMP(3),
    "shortfalls"  JSONB,
    "notes"       TEXT,
    CONSTRAINT "LoadRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoadRecord_tripId_key" ON "LoadRecord"("tripId");

CREATE TABLE "OfflineEvent" (
    "id"               TEXT NOT NULL,
    "driverId"         TEXT NOT NULL,
    "tripId"           TEXT,
    "eventType"        TEXT NOT NULL,
    "payload"          JSONB NOT NULL,
    "savedAt"          TIMESTAMP(3) NOT NULL,
    "syncedAt"         TIMESTAMP(3),
    "conflictResolved" BOOLEAN NOT NULL DEFAULT false,
    "conflictNote"     TEXT,
    CONSTRAINT "OfflineEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeferralLog" (
    "id"              TEXT NOT NULL,
    "orderId"         TEXT NOT NULL,
    "reason"          "DeferralReason" NOT NULL,
    "score"           INTEGER NOT NULL,
    "resolvedBy"      TEXT,
    "notes"           TEXT,
    "rescheduledDate" TIMESTAMP(3),
    "isProvisional"   BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeferralLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeferralLog_orderId_key" ON "DeferralLog"("orderId");

CREATE TABLE "Notification" (
    "id"          TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "tripId"      TEXT,
    "type"        TEXT NOT NULL,
    "channel"     "NotificationChannel" NOT NULL,
    "payload"     JSONB NOT NULL,
    "sentAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt"      TIMESTAMP(3),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "User"         ADD CONSTRAINT "User_outletId_fkey"        FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order"        ADD CONSTRAINT "Order_outletId_fkey"        FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trip"         ADD CONSTRAINT "Trip_vehicleId_fkey"        FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Trip"         ADD CONSTRAINT "Trip_driverId_fkey"         FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripStop"     ADD CONSTRAINT "TripStop_tripId_fkey"       FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripStop"     ADD CONSTRAINT "TripStop_orderId_fkey"      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripStop"     ADD CONSTRAINT "TripStop_outletId_fkey"     FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POD"          ADD CONSTRAINT "POD_tripStopId_fkey"        FOREIGN KEY ("tripStopId") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoadRecord"   ADD CONSTRAINT "LoadRecord_tripId_fkey"     FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoadRecord"   ADD CONSTRAINT "LoadRecord_vehicleId_fkey"  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadRecord"   ADD CONSTRAINT "LoadRecord_loaderId_fkey"   FOREIGN KEY ("loaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfflineEvent" ADD CONSTRAINT "OfflineEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfflineEvent" ADD CONSTRAINT "OfflineEvent_tripId_fkey"   FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeferralLog"  ADD CONSTRAINT "DeferralLog_orderId_fkey"   FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tripId_fkey"   FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
