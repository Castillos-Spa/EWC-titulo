-- CreateTable
CREATE TABLE "public"."FuelLog" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "odometer" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuelLog_vehiculoId_date_idx" ON "public"."FuelLog"("vehiculoId", "date");

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
