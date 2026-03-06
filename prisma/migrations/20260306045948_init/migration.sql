-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RESEARCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('UNIMOLECULAR', 'BIMOLECULAR');

-- CreateEnum
CREATE TYPE "SpeciesRole" AS ENUM ('REACTANT', 'TRANSITION_STATE', 'PRODUCT', 'VERTICAL_PRODUCT');

-- CreateEnum
CREATE TYPE "PESEnergyType" AS ENUM ('En', 'Ent', 'EnG');

-- CreateEnum
CREATE TYPE "RateUnit" AS ENUM ('UNI', 'MOL', 'MOLECULE');

-- CreateEnum
CREATE TYPE "RateConstantMethod" AS ENUM ('TST', 'D_TST', 'BELL_35', 'BELL_58', 'BELL_2T', 'ECKART', 'SKODJE_TRUHLAR', 'MARCUS');

-- CreateEnum
CREATE TYPE "TunnelingMethod" AS ENUM ('BELL_35', 'BELL_58', 'BELL_2T', 'ECKART', 'SKODJE_TRUHLAR');

-- CreateEnum
CREATE TYPE "SolventType" AS ENUM ('WATER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SolventModel" AS ENUM ('NONE', 'KRAMERS', 'COLLINS_KIMBALL');

-- CreateEnum
CREATE TYPE "MDMethod" AS ENUM ('CPMD', 'BOMD', 'PIMD', 'SHMD', 'MTD');

-- CreateEnum
CREATE TYPE "MDFileType" AS ENUM ('WAVEFUNCTION_INPUT', 'RUN_INPUT', 'GAUSSVIEW_CHECK', 'XYZ_TRAJECTORY');

-- CreateEnum
CREATE TYPE "FittingPlotType" AS ENUM ('ARRHENIUS', 'TRANSITIVITY');

-- CreateEnum
CREATE TYPE "FittingModelType" AS ENUM ('ARRHENIUS', 'AQUILANTI_MUNDIM', 'NTS', 'VFT', 'ASCC', 'SATO');

-- CreateEnum
CREATE TYPE "CalcStatus" AS ENUM ('DRAFT', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemperatureGridType" AS ENUM ('DEFAULT', 'CUSTOM', 'RANGE');

-- CreateEnum
CREATE TYPE "UploadFileType" AS ENUM ('GAUSSIAN_LOG', 'GAUSSIAN_OUT', 'ORCA_OUT', 'GAMESS_LOG', 'NWCHEM_OUT', 'GJF_INPUT', 'XYZ_GEOMETRY', 'RATE_DATA_TXT', 'RATE_DATA_DAT', 'RATE_DATA_CSV', 'CPMD_INPUT', 'OTHER');

-- CreateEnum
CREATE TYPE "QCEngine" AS ENUM ('GAUSSIAN', 'ORCA', 'GAMESS', 'NWCHEM', 'PYSCF', 'XTB', 'MLATOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CALC_COMPLETED', 'CALC_FAILED', 'CREDITS_LOW', 'TEAM_INVITE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MLProvider" AS ENUM ('MLATOM', 'PYSCF', 'XTB');

-- CreateEnum
CREATE TYPE "MLTaskType" AS ENUM ('SINGLE_POINT', 'OPTIMIZATION', 'FREQUENCY', 'MD', 'TRAINING');

-- CreateEnum
CREATE TYPE "NeuralPotential" AS ENUM ('ANI_2X', 'MACE', 'AIQM1');

-- CreateEnum
CREATE TYPE "LLMRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('GSA_FITTING', 'RATE_CONSTANT_BASIC', 'RATE_CONSTANT_FULL', 'RATE_CONSTANT_SOLVENT', 'MD_SINGLE', 'MD_MULTIPLE', 'ML_SINGLE_POINT', 'ML_OPTIMIZATION', 'ML_MD', 'ML_TRAINING', 'LLM_DEEPSEEK', 'LLM_CLAUDE', 'QC_EXTRACT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('CPU', 'GPU', 'API');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('TRIAL', 'BASIC', 'STUDENT', 'RESEARCHER', 'LABORATORY', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'RESEARCHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpiry" TIMESTAMP(3),
    "isInstitutional" BOOLEAN NOT NULL DEFAULT false,
    "institution" TEXT,
    "trialExpiresAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "credits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lgpdConsentAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_domains" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "isVerified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "institutional_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "autoJoinDomains" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileType" "UploadFileType" NOT NULL,
    "checksum" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reactionType" "ReactionType" NOT NULL,
    "energyType" "PESEnergyType" NOT NULL DEFAULT 'En',
    "rateUnit" "RateUnit" NOT NULL DEFAULT 'MOL',
    "status" "CalcStatus" NOT NULL DEFAULT 'DRAFT',
    "deltaE" DOUBLE PRECISION,
    "deltaH" DOUBLE PRECISION,
    "deltaG" DOUBLE PRECISION,
    "forwardBarrier" DOUBLE PRECISION,
    "reverseBarrier" DOUBLE PRECISION,
    "barrierEnthalpy" DOUBLE PRECISION,
    "barrierFreeEnergy" DOUBLE PRECISION,
    "imaginaryFreq" DOUBLE PRECISION,
    "crossoverTemp" DOUBLE PRECISION,
    "dParameter" DOUBLE PRECISION,
    "eckartAlpha" DOUBLE PRECISION,
    "eckartLength" DOUBLE PRECISION,
    "eckartAsymmetry" DOUBLE PRECISION,
    "verticalEnergyDiff" DOUBLE PRECISION,
    "reorganizationEnergy" DOUBLE PRECISION,
    "marcusActivationFreeEnergy" DOUBLE PRECISION,
    "rateConstants" JSONB,
    "tunnelingCoeffs" JSONB,
    "partitionRatios" JSONB,
    "smoluchowskiData" JSONB,
    "kramersData" JSONB,
    "tokensConsumed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "computeTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species" (
    "id" TEXT NOT NULL,
    "reactionId" TEXT NOT NULL,
    "role" "SpeciesRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "fileUploadId" TEXT,
    "filename" TEXT,
    "label" TEXT,
    "nAtoms" INTEGER,
    "charge" INTEGER,
    "multiplicity" INTEGER,
    "molecularMass" DOUBLE PRECISION,
    "molecularMassKg" DOUBLE PRECISION,
    "scfEnergy" DOUBLE PRECISION,
    "zpe" DOUBLE PRECISION,
    "electronicPlusZPE" DOUBLE PRECISION,
    "electronicPlusEnthalpy" DOUBLE PRECISION,
    "electronicPlusFreeEnergy" DOUBLE PRECISION,
    "imaginaryFreq" DOUBLE PRECISION,
    "degreesOfFreedom" INTEGER,
    "rotationalSymmetryNumber" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "electronicPartitionFn" DOUBLE PRECISION,
    "scfrCavityRadius" DOUBLE PRECISION,
    "vibrationalTemps" DOUBLE PRECISION[],
    "rotationalTemps" DOUBLE PRECISION[],
    "atomComposition" JSONB,
    "cartesianCoords" JSONB,
    "partitionFunctions" JSONB,
    "qcEngine" "QCEngine",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_grids" (
    "id" TEXT NOT NULL,
    "reactionId" TEXT NOT NULL,
    "gridType" "TemperatureGridType" NOT NULL DEFAULT 'CUSTOM',
    "minTemp" DOUBLE PRECISION,
    "maxTemp" DOUBLE PRECISION,
    "step" DOUBLE PRECISION,
    "values" DOUBLE PRECISION[],

    CONSTRAINT "temperature_grids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solvent_configs" (
    "id" TEXT NOT NULL,
    "reactionId" TEXT NOT NULL,
    "solventType" "SolventType" NOT NULL DEFAULT 'WATER',
    "solventModel" "SolventModel" NOT NULL DEFAULT 'NONE',
    "epsilon" DOUBLE PRECISION,
    "dParam" DOUBLE PRECISION,
    "eta0" DOUBLE PRECISION,

    CONSTRAINT "solvent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experimental_data_sets" (
    "id" TEXT NOT NULL,
    "reactionId" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "citation" TEXT,
    "doi" TEXT,
    "points" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experimental_data_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitting_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "plotType" "FittingPlotType" NOT NULL,
    "modelType" "FittingModelType" NOT NULL,
    "status" "CalcStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "gsaQAcceptance" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "gsaQTemperature" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "gsaQVisiting" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "gsaMaxIter" INTEGER NOT NULL DEFAULT 10000,
    "gsaInitialTemp" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "gsaStepScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "inputData" JSONB,
    "tokensConsumed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "computeTimeMs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fitting_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitting_results" (
    "id" TEXT NOT NULL,
    "fittingJobId" TEXT NOT NULL,
    "chiSquare" DOUBLE PRECISION,
    "paramA" DOUBLE PRECISION,
    "paramEo" DOUBLE PRECISION,
    "paramD" DOUBLE PRECISION,
    "paramTo" DOUBLE PRECISION,
    "paramB" DOUBLE PRECISION,
    "paramEv" DOUBLE PRECISION,
    "fittedCurve" JSONB,
    "rawParams" JSONB,

    CONSTRAINT "fitting_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_simulations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "mdMethod" "MDMethod" NOT NULL,
    "status" "CalcStatus" NOT NULL DEFAULT 'DRAFT',
    "dftFunctional" TEXT,
    "pseudopotential" TEXT,
    "charge" INTEGER NOT NULL DEFAULT 0,
    "lsdFlag" INTEGER NOT NULL DEFAULT 0,
    "temperature" DOUBLE PRECISION,
    "maxSteps" INTEGER,
    "timeStep" DOUBLE PRECISION,
    "latticeA" DOUBLE PRECISION,
    "latticeB" DOUBLE PRECISION,
    "latticeC" DOUBLE PRECISION,
    "cosA" DOUBLE PRECISION,
    "cosB" DOUBLE PRECISION,
    "cosC" DOUBLE PRECISION,
    "tokensConsumed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "md_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_molecules" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "label" TEXT,
    "sourceFilename" TEXT,
    "nAtoms" INTEGER,
    "totalMass" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "md_molecules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_atoms" (
    "id" TEXT NOT NULL,
    "moleculeId" TEXT NOT NULL,
    "atomIndex" INTEGER NOT NULL,
    "element" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "massAmu" DOUBLE PRECISION,

    CONSTRAINT "md_atoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_generated_files" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "fileType" "MDFileType" NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "md_generated_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_multi_configs" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "bondInit" DOUBLE PRECISION,
    "bondFinal" DOUBLE PRECISION,
    "bondSteps" INTEGER,
    "angleInit" DOUBLE PRECISION,
    "angleFinal" DOUBLE PRECISION,
    "angleSteps" INTEGER,
    "dihedralInit" DOUBLE PRECISION,
    "dihedralFinal" DOUBLE PRECISION,
    "dihedralSteps" INTEGER,
    "tempInit" DOUBLE PRECISION,
    "tempFinal" DOUBLE PRECISION,
    "tempSteps" INTEGER,
    "chiralInversion" BOOLEAN NOT NULL DEFAULT false,
    "totalConfigs" INTEGER,

    CONSTRAINT "md_multi_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT,
    "mlProvider" "MLProvider" NOT NULL DEFAULT 'MLATOM',
    "mlTaskType" "MLTaskType" NOT NULL,
    "neuralPotential" "NeuralPotential",
    "status" "CalcStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "inputData" JSONB,
    "resultData" JSONB,
    "tokensConsumed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gpuTimeSeconds" INTEGER,
    "gpuType" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "model" TEXT NOT NULL DEFAULT 'deepseek-v3',
    "contextType" TEXT,
    "contextId" TEXT,
    "totalTokensIn" INTEGER NOT NULL DEFAULT 0,
    "totalTokensOut" INTEGER NOT NULL DEFAULT 0,
    "totalCostBrl" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "LLMRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "model" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" "OperationType" NOT NULL,
    "tokensUsed" DECIMAL(10,2) NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "costBrl" DECIMAL(10,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageType" "PackageType" NOT NULL,
    "tokens" INTEGER NOT NULL,
    "amountBrl" DECIMAL(10,2) NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "stripePaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "CalcStatus" NOT NULL DEFAULT 'PENDING',
    "inputData" JSONB,
    "resultData" JSONB,
    "errorData" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE UNIQUE INDEX "institutional_domains_domain_key" ON "institutional_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_tokenHash_key" ON "team_invites"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_teamId_email_key" ON "team_invites"("teamId", "email");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "projects_teamId_idx" ON "projects"("teamId");

-- CreateIndex
CREATE INDEX "file_uploads_userId_idx" ON "file_uploads"("userId");

-- CreateIndex
CREATE INDEX "reactions_userId_idx" ON "reactions"("userId");

-- CreateIndex
CREATE INDEX "reactions_projectId_idx" ON "reactions"("projectId");

-- CreateIndex
CREATE INDEX "reactions_status_idx" ON "reactions"("status");

-- CreateIndex
CREATE INDEX "species_reactionId_role_idx" ON "species"("reactionId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "temperature_grids_reactionId_key" ON "temperature_grids"("reactionId");

-- CreateIndex
CREATE UNIQUE INDEX "solvent_configs_reactionId_key" ON "solvent_configs"("reactionId");

-- CreateIndex
CREATE INDEX "experimental_data_sets_reactionId_idx" ON "experimental_data_sets"("reactionId");

-- CreateIndex
CREATE INDEX "fitting_jobs_userId_idx" ON "fitting_jobs"("userId");

-- CreateIndex
CREATE INDEX "fitting_jobs_status_idx" ON "fitting_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fitting_results_fittingJobId_key" ON "fitting_results"("fittingJobId");

-- CreateIndex
CREATE INDEX "md_simulations_userId_idx" ON "md_simulations"("userId");

-- CreateIndex
CREATE INDEX "md_molecules_simulationId_idx" ON "md_molecules"("simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "md_atoms_moleculeId_atomIndex_key" ON "md_atoms"("moleculeId", "atomIndex");

-- CreateIndex
CREATE INDEX "md_generated_files_simulationId_idx" ON "md_generated_files"("simulationId");

-- CreateIndex
CREATE UNIQUE INDEX "md_multi_configs_simulationId_key" ON "md_multi_configs"("simulationId");

-- CreateIndex
CREATE INDEX "ml_jobs_userId_idx" ON "ml_jobs"("userId");

-- CreateIndex
CREATE INDEX "ml_jobs_status_idx" ON "ml_jobs"("status");

-- CreateIndex
CREATE INDEX "llm_conversations_userId_idx" ON "llm_conversations"("userId");

-- CreateIndex
CREATE INDEX "llm_messages_conversationId_idx" ON "llm_messages"("conversationId");

-- CreateIndex
CREATE INDEX "usage_records_userId_idx" ON "usage_records"("userId");

-- CreateIndex
CREATE INDEX "usage_records_operation_idx" ON "usage_records"("operation");

-- CreateIndex
CREATE INDEX "usage_records_createdAt_idx" ON "usage_records"("createdAt");

-- CreateIndex
CREATE INDEX "credit_purchases_userId_idx" ON "credit_purchases"("userId");

-- CreateIndex
CREATE INDEX "job_results_userId_idx" ON "job_results"("userId");

-- CreateIndex
CREATE INDEX "job_results_jobType_status_idx" ON "job_results"("jobType", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species" ADD CONSTRAINT "species_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species" ADD CONSTRAINT "species_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "file_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_grids" ADD CONSTRAINT "temperature_grids_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solvent_configs" ADD CONSTRAINT "solvent_configs_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experimental_data_sets" ADD CONSTRAINT "experimental_data_sets_reactionId_fkey" FOREIGN KEY ("reactionId") REFERENCES "reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitting_jobs" ADD CONSTRAINT "fitting_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitting_jobs" ADD CONSTRAINT "fitting_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitting_results" ADD CONSTRAINT "fitting_results_fittingJobId_fkey" FOREIGN KEY ("fittingJobId") REFERENCES "fitting_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_simulations" ADD CONSTRAINT "md_simulations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_simulations" ADD CONSTRAINT "md_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_molecules" ADD CONSTRAINT "md_molecules_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "md_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_atoms" ADD CONSTRAINT "md_atoms_moleculeId_fkey" FOREIGN KEY ("moleculeId") REFERENCES "md_molecules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_generated_files" ADD CONSTRAINT "md_generated_files_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "md_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_multi_configs" ADD CONSTRAINT "md_multi_configs_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "md_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_jobs" ADD CONSTRAINT "ml_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_jobs" ADD CONSTRAINT "ml_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_conversations" ADD CONSTRAINT "llm_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_messages" ADD CONSTRAINT "llm_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "llm_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_results" ADD CONSTRAINT "job_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
