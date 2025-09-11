/*
  Warnings:

  - The `estado` column on the `Vehiculo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."VehiculoStatus" AS ENUM ('disponible', 'en_mantenimiento', 'inactivo', 'en_uso');

-- AlterTable
ALTER TABLE "public"."Vehiculo" DROP COLUMN "estado",
ADD COLUMN     "estado" "public"."VehiculoStatus" NOT NULL DEFAULT 'disponible';
