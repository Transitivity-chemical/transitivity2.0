-- AlterTable
ALTER TABLE "users"
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordResetExpiry" TIMESTAMP(3);
