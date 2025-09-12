-- CreateTable
CREATE TABLE "public"."Vehiculo" (
    "id" SERIAL NOT NULL,
    "patente" TEXT NOT NULL,
    "capacidad" DOUBLE PRECISION NOT NULL,
    "odometro" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);
