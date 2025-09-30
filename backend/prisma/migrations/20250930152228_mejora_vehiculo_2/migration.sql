/*
  Warnings:

  - A unique constraint covering the columns `[patente]` on the table `Vehiculo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Vehiculo" ADD COLUMN     "lastMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "marca" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "modelo" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "public"."Vehiculo"("patente");
