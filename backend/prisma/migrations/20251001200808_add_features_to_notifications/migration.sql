-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "scheduledAt" TIMESTAMP(3);
