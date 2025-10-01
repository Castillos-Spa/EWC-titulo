/*
  Warnings:

  - You are about to drop the column `read` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "read";

-- CreateTable
CREATE TABLE "public"."UserNotification" (
    "userId" INTEGER NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("userId","notificationId")
);

-- AddForeignKey
ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
