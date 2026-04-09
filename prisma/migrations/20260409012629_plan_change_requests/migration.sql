-- CreateEnum
CREATE TYPE "PlanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "plan_change_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPlan" "Plan",
    "targetPlan" "Plan" NOT NULL,
    "status" "PlanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "plan_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_change_requests_userId_idx" ON "plan_change_requests"("userId");

-- CreateIndex
CREATE INDEX "plan_change_requests_status_idx" ON "plan_change_requests"("status");

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
