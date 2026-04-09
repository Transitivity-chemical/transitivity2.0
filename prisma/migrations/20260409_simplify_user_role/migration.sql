-- FIX-9 of post-megaplan audit: simplify UserRole to USER + ADMIN only.
-- Existing RESEARCHER and VIEWER values are mapped to USER.

-- Postgres can't drop enum values in-place. Strategy:
--   1. Create new enum
--   2. Convert columns + alter default
--   3. Drop old enum and rename

-- Step 1: new enum
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');

-- Step 2: change User.role
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (CASE
    WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"UserRole_new"
    ELSE 'USER'::"UserRole_new"
  END);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Step 3: change InstitutionalDomain.allowedRole
ALTER TABLE "institutional_domains" ALTER COLUMN "allowedRole" DROP DEFAULT;
ALTER TABLE "institutional_domains"
  ALTER COLUMN "allowedRole" TYPE "UserRole_new"
  USING (CASE
    WHEN "allowedRole"::text = 'ADMIN' THEN 'ADMIN'::"UserRole_new"
    ELSE 'USER'::"UserRole_new"
  END);
ALTER TABLE "institutional_domains" ALTER COLUMN "allowedRole" SET DEFAULT 'USER';

-- Step 4: drop old enum + rename new one to take its place
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
