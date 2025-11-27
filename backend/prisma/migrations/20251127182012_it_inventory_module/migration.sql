-- CreateEnum
CREATE TYPE "public"."ITAssetStatus" AS ENUM ('EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO');

-- CreateEnum
CREATE TYPE "public"."ITAssetMovementType" AS ENUM ('ALTA', 'ASIGNACION', 'DEVOLUCION', 'REPARACION', 'BAJA');

-- CreateTable
CREATE TABLE "public"."ITAsset" (
    "id" SERIAL NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "estado" "public"."ITAssetStatus" NOT NULL DEFAULT 'EN_STOCK',
    "asignadoA" TEXT,
    "proveedor" TEXT,
    "fechaCompra" TIMESTAMP(3),
    "garantiaHasta" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ITAssetMovement" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "tipo" "public"."ITAssetMovementType" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalle" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,

    CONSTRAINT "ITAssetMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ITAsset_assetTag_key" ON "public"."ITAsset"("assetTag");

-- CreateIndex
CREATE INDEX "ITAssetMovement_assetId_fecha_idx" ON "public"."ITAssetMovement"("assetId", "fecha");

-- AddForeignKey
ALTER TABLE "public"."ITAssetMovement" ADD CONSTRAINT "ITAssetMovement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."ITAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "public"."Ticket"
ADD COLUMN IF NOT EXISTS "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
