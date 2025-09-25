/*
  Warnings:

  - The `area` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "area",
ADD COLUMN     "area" TEXT[] DEFAULT ARRAY[]::TEXT[];
