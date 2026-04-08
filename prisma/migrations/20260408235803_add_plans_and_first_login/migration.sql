/*
  Warnings:

  - Added the required column `updatedAt` to the `institutional_domains` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STUDENT', 'PROFESSIONAL', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "institutional_domains" ADD COLUMN     "allowedRole" "UserRole" NOT NULL DEFAULT 'RESEARCHER',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "defaultPlan" "Plan" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan" "Plan";

-- CreateTable
CREATE TABLE "plan_configs" (
    "id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "maxCredits" INTEGER,
    "monthlyCredits" INTEGER,
    "features" JSONB,
    "label" TEXT NOT NULL,
    "labelEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_configs_plan_key" ON "plan_configs"("plan");

-- CreateIndex
CREATE INDEX "users_pendingApproval_idx" ON "users"("pendingApproval");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
