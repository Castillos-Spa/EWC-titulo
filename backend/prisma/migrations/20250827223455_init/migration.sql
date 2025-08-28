-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('Admin', 'Transporte', 'Driver', 'Obras', 'Aseo', 'IT', 'User');

-- CreateEnum
CREATE TYPE "public"."Permission" AS ENUM ('VIEW_DASHBOARD', 'VIEW_TICKETS', 'MANAGE_TICKETS', 'VIEW_TRIP_REPORTS', 'MANAGE_TRIP_REPORTS', 'VIEW_ROUTES', 'MANAGE_ROUTES', 'VIEW_FLEET', 'MANAGE_FLEET', 'VIEW_MAINTENANCE', 'MANAGE_MAINTENANCE', 'VIEW_CIVIL_WORKS', 'MANAGE_CIVIL_WORKS', 'VIEW_CLEANING_REPORTS', 'MANAGE_CLEANING_REPORTS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" "public"."Role"[] DEFAULT ARRAY[]::"public"."Role"[],
    "permissions" "public"."Permission"[] DEFAULT ARRAY[]::"public"."Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
