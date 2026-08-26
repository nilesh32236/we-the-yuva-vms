-- AlterTable
ALTER TABLE "Story" ADD COLUMN "kindnessChallengeId" TEXT;
ALTER TABLE "Story" ADD COLUMN "kindnessDay" INTEGER;
ALTER TABLE "Story" ADD COLUMN "isCompletion" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Story_kindnessChallengeId_kindnessDay_idx" ON "Story"("kindnessChallengeId", "kindnessDay");
