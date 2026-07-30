-- Add totalHours to User for denormalized leaderboard performance
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add whyVolunteer field alongside deprecated whyVoluntary
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whyVolunteer" TEXT;

-- Backfill totalHours from VolunteerProfile for existing users
UPDATE "User"
SET "totalHours" = COALESCE((
  SELECT "totalHours" FROM "VolunteerProfile"
  WHERE "VolunteerProfile"."userId" = "User"."id"
), 0);

-- Backfill whyVolunteer from whyVoluntary for existing users
UPDATE "User"
SET "whyVolunteer" = "whyVoluntary"
WHERE "whyVolunteer" IS NULL AND "whyVoluntary" IS NOT NULL;

-- Create compound index for leaderboard queries
CREATE INDEX IF NOT EXISTS "User_points_totalHours_idx" ON "User"("points", "totalHours");
