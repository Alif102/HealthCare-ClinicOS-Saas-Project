-- AlterTable
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "settings" JSONB;
