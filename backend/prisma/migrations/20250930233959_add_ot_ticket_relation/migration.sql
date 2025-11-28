/*
  Warnings:

  - A unique constraint covering the columns `[ordenTrabajoId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Ticket" ADD COLUMN     "ordenTrabajoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ordenTrabajoId_key" ON "public"."Ticket"("ordenTrabajoId");

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_ordenTrabajoId_fkey" FOREIGN KEY ("ordenTrabajoId") REFERENCES "public"."OrdenTrabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
