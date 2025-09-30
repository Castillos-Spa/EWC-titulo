-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('Pendiente', 'Aprobado', 'Rechazado');

-- CreateTable
CREATE TABLE "public"."TicketApproval" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "step" INTEGER NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'Pendiente',
    "approverRole" "public"."Role" NOT NULL,
    "approverArea" TEXT NOT NULL,
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "comments" TEXT,

    CONSTRAINT "TicketApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketApproval_ticketId_idx" ON "public"."TicketApproval"("ticketId");

-- CreateIndex
CREATE INDEX "TicketApproval_approverArea_approverRole_idx" ON "public"."TicketApproval"("approverArea", "approverRole");

-- CreateIndex
CREATE UNIQUE INDEX "TicketApproval_ticketId_step_key" ON "public"."TicketApproval"("ticketId", "step");

-- AddForeignKey
ALTER TABLE "public"."TicketApproval" ADD CONSTRAINT "TicketApproval_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketApproval" ADD CONSTRAINT "TicketApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
