-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PLAN_UPGRADE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'PLAN_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'USER_REGISTERED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT;

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
