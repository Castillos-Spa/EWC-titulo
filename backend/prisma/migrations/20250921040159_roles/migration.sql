-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Permission" ADD VALUE 'VIEW_MANAGEMENT_USER';
ALTER TYPE "public"."Permission" ADD VALUE 'MANAGE_MANAGEMENT_USER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Role" ADD VALUE 'RRHH';
ALTER TYPE "public"."Role" ADD VALUE 'Finanza';
ALTER TYPE "public"."Role" ADD VALUE 'P_Riesgo';
ALTER TYPE "public"."Role" ADD VALUE 'Gerente';
