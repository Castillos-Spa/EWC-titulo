/*
  Warnings:

  - Changed the column `role` on the `Notification` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "public"."Notification" ALTER COLUMN "role" SET DEFAULT ARRAY[]::"public"."Role"[],
ALTER COLUMN "role" SET DATA TYPE "public"."Role"[];
