-- Add ticket attachments column to align with Prisma schema
ALTER TABLE "public"."Ticket"
ADD COLUMN IF NOT EXISTS "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
