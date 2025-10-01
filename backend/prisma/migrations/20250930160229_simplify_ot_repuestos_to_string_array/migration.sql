-- AlterTable
ALTER TABLE "public"."OrdenTrabajo" ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "repuestos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ALTER COLUMN "tareas" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Repuesto" ALTER COLUMN "costoUnitario" SET DEFAULT 0;
