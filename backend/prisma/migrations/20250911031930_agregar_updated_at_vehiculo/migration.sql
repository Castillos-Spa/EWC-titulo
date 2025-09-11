/*
  Warnings:

  - Added the required column `updatedAt` to the `Vehiculo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Vehiculo" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."OrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "vehiculoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QA" (
    "id" SERIAL NOT NULL,
    "checklist" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "otId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolicitudCompra" (
    "id" SERIAL NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Repuesto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "costoUnitario" DOUBLE PRECISION NOT NULL,
    "solicitudCompraId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repuesto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QA" ADD CONSTRAINT "QA_otId_fkey" FOREIGN KEY ("otId") REFERENCES "public"."OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repuesto" ADD CONSTRAINT "Repuesto_solicitudCompraId_fkey" FOREIGN KEY ("solicitudCompraId") REFERENCES "public"."SolicitudCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
