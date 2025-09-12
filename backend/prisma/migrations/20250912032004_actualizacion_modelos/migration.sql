-- AlterTable
ALTER TABLE "public"."OrdenTrabajo" ADD COLUMN     "responsableId" INTEGER,
ADD COLUMN     "tareas" TEXT[];

-- AlterTable
ALTER TABLE "public"."SolicitudCompra" ADD COLUMN     "aprobada" BOOLEAN NOT NULL DEFAULT false;
