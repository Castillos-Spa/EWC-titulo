/*
  Warnings:

  - You are about to drop the `VehicleCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."VehicleCheck" DROP CONSTRAINT "VehicleCheck_driverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VehicleCheck" DROP CONSTRAINT "VehicleCheck_vehiculoId_fkey";

-- DropTable
DROP TABLE "public"."VehicleCheck";

-- DropEnum
DROP TYPE "public"."CheckType";
