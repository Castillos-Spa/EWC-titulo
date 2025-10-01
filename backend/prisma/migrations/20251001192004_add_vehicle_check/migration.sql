-- CreateEnum
CREATE TYPE "public"."CheckType" AS ENUM ('START_OF_DAY', 'END_OF_DAY');

-- CreateTable
CREATE TABLE "public"."VehicleCheck" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "fuelLevel" DOUBLE PRECISION,
    "checkType" "public"."CheckType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleCheck_vehiculoId_date_idx" ON "public"."VehicleCheck"("vehiculoId", "date");

-- AddForeignKey
ALTER TABLE "public"."VehicleCheck" ADD CONSTRAINT "VehicleCheck_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleCheck" ADD CONSTRAINT "VehicleCheck_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
