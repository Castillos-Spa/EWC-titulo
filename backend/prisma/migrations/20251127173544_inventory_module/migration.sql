/*
  Warnings:

  - The `recipientArea` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `lastLogin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `conductorId` on the `Vehiculo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo]` on the table `Vehiculo` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `approverArea` on the `TicketApproval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `area` on the `UserRoleAssignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."InventoryItemStatus" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('INGRESO', 'EGRESO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "public"."IncidentSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."IncidentType" AS ENUM ('VEHICLE_BREAKDOWN', 'ACCIDENT', 'TRAFFIC_DELAY', 'WEATHER', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CleaningStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."CivilWorkType" AS ENUM ('CONSTRUCTION', 'REPAIR', 'MAINTENANCE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "public"."CivilWorkStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'PENDING', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."RouteFrequency" AS ENUM ('Diaria', 'Semanal', 'Mensual', 'Ocasional', 'Adhoc');

-- CreateEnum
CREATE TYPE "public"."Area" AS ENUM ('Admin', 'IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanzas', 'Prev_Riesgo');

-- AlterTable
ALTER TABLE "public"."FuelLog" ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "recipientArea",
ADD COLUMN     "recipientArea" "public"."Area"[] DEFAULT ARRAY[]::"public"."Area"[];

-- AlterTable
ALTER TABLE "public"."TicketApproval" DROP COLUMN "approverArea",
ADD COLUMN     "approverArea" "public"."Area" NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "lastLogin",
ADD COLUMN     "last_login" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."UserRoleAssignment" DROP COLUMN "area",
ADD COLUMN     "area" "public"."Area" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Vehiculo" DROP COLUMN "conductorId",
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "tipo" TEXT;

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "unidadMedida" TEXT NOT NULL,
    "estado" "public"."InventoryItemStatus" NOT NULL DEFAULT 'ACTIVO',
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "tipo" "public"."InventoryMovementType" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saldoAnterior" INTEGER NOT NULL,
    "saldoPosterior" INTEGER NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Incident" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "type" "public"."IncidentType" NOT NULL,
    "severity" "public"."IncidentSeverity" NOT NULL,
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "location" JSONB NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportedById" INTEGER NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransportRoute" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "frequency" "public"."RouteFrequency" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TruckAssignment" (
    "id" SERIAL NOT NULL,
    "truckId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planificada',
    "volumeLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Aseo" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "area" TEXT NOT NULL,
    "tasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibleStaff" TEXT NOT NULL,
    "timeSpent" DOUBLE PRECISION NOT NULL,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."CleaningStatus" NOT NULL,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "Aseo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CivilWork" (
    "id" SERIAL NOT NULL,
    "project" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "estimatedEndDate" TIMESTAMP(3) NOT NULL,
    "actualEndDate" TIMESTAMP(3),
    "workType" "public"."CivilWorkType" NOT NULL,
    "tasks" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."CivilWorkStatus" NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibleStaffUsernames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materialsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivilWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalWorkflow" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "area" "public"."Area" NOT NULL,
    "category" "public"."TicketCategory" NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "public"."InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryMovement_itemId_fecha_idx" ON "public"."InventoryMovement"("itemId", "fecha");

-- CreateIndex
CREATE INDEX "Incident_reportedById_idx" ON "public"."Incident"("reportedById");

-- CreateIndex
CREATE INDEX "Incident_reviewedById_idx" ON "public"."Incident"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_code_key" ON "public"."TransportRoute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TruckAssignment_truckId_routeId_date_key" ON "public"."TruckAssignment"("truckId", "routeId", "date");

-- CreateIndex
CREATE INDEX "Aseo_createdById_idx" ON "public"."Aseo"("createdById");

-- CreateIndex
CREATE INDEX "CivilWork_createdById_idx" ON "public"."CivilWork"("createdById");

-- CreateIndex
CREATE INDEX "TicketApproval_approverArea_approverRole_idx" ON "public"."TicketApproval"("approverArea", "approverRole");

-- CreateIndex
CREATE INDEX "idx_user_username" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "idx_user_refresh_token" ON "public"."User"("refreshToken");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_area_role_idx" ON "public"."UserRoleAssignment"("area", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_area_role_key" ON "public"."UserRoleAssignment"("userId", "area", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_codigo_key" ON "public"."Vehiculo"("codigo");

-- CreateIndex
CREATE INDEX "Vehiculo_estado_idx" ON "public"."Vehiculo"("estado");

-- CreateIndex
CREATE INDEX "Vehiculo_areaAsignada_idx" ON "public"."Vehiculo"("areaAsignada");

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckAssignment" ADD CONSTRAINT "TruckAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckAssignment" ADD CONSTRAINT "TruckAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TruckAssignment" ADD CONSTRAINT "TruckAssignment_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "public"."Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Aseo" ADD CONSTRAINT "Aseo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CivilWork" ADD CONSTRAINT "CivilWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
