/*
  Warnings:

  - The values [IT_SUPPORT,NETWORK_ADMIN,DEVELOPER,CIVIL_ENGINEER,PROJECT_MANAGER,ARCHITECT,CLEANING_COORDINATOR,SANITATION_SPECIALIST,HR_SPECIALIST,RECRUITER,ACCOUNTANT,FINANCIAL_ANALYST,AUDITOR,SAFETY_INSPECTOR,RISK_ANALYST] on the enum `Specialty` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Specialty_new" AS ENUM ('DRIVER', 'MECHANIC');
ALTER TABLE "UserRoleAssignment" ALTER COLUMN "specialty" TYPE "Specialty_new" USING ("specialty"::text::"Specialty_new");
ALTER TYPE "Specialty" RENAME TO "Specialty_old";
ALTER TYPE "Specialty_new" RENAME TO "Specialty";
DROP TYPE "public"."Specialty_old";
COMMIT;

-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "areaAsignada" TEXT,
ADD COLUMN     "conductorId" INTEGER;
