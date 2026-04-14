-- CreateEnum
CREATE TYPE "UploadRole" AS ENUM ('INPUT', 'OUTPUT');

-- AlterTable
ALTER TABLE "file_uploads"
ADD COLUMN "sha256" TEXT,
ADD COLUMN "resourceRole" "UploadRole" NOT NULL DEFAULT 'INPUT',
ADD COLUMN "resourceType" TEXT,
ADD COLUMN "resourceId" TEXT;

-- CreateIndex
CREATE INDEX "file_uploads_resourceType_resourceId_idx" ON "file_uploads"("resourceType", "resourceId");
