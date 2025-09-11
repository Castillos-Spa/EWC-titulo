-- CreateTable
CREATE TABLE "public"."Documento" (
    "id" SERIAL NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "public"."Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
