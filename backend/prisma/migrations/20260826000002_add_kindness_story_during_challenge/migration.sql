-- AlterTable
ALTER TABLE "Story" ADD COLUMN "kindnessChallengeId" TEXT;
ALTER TABLE "Story" ADD COLUMN "kindnessDay" INTEGER;
ALTER TABLE "Story" ADD COLUMN "isCompletion" BOOLEAN NOT NULL DEFAULT false;

-- ForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_kindnessChallengeId_fkey" FOREIGN KEY ("kindnessChallengeId") REFERENCES "KindnessChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Story_kindnessChallengeId_kindnessDay_idx" ON "Story"("kindnessChallengeId", "kindnessDay");

-- One daily post per challenge day (completion stories exempt, they share day 7).
CREATE UNIQUE INDEX "Story_kindnessChallengeId_kindnessDay_daily_key"
  ON "Story"("kindnessChallengeId", "kindnessDay")
  WHERE "kindnessChallengeId" IS NOT NULL AND "kindnessDay" IS NOT NULL AND "isCompletion" = false;

ALTER TABLE "Story" ADD CONSTRAINT "Story_kindnessDay_range_check" CHECK ("kindnessDay" IS NULL OR ("kindnessDay" BETWEEN 1 AND 7));
