-- AlterTable
ALTER TABLE "public"."Ticket" ADD COLUMN     "assignedUserConfirmation" BOOLEAN DEFAULT false,
ADD COLUMN     "requestingUserConfirmation" BOOLEAN DEFAULT false;
