/*
  Warnings:

  - The values [STUDENT,PROFESSIONAL,EVENT,RECURRING,REMOTE,EMERGENCY] on the enum `VolunteerType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[seriesId,eventDate]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `referralCode` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('FRIEND', 'COLLEGE', 'PARTNER_ORG', 'SOCIAL_MEDIA', 'WEBSITE', 'CURRENT_VOLUNTEER', 'NEWSPAPER', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BadgeApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditLogAction" ADD VALUE 'BLOG_CREATE';
ALTER TYPE "AuditLogAction" ADD VALUE 'BLOG_UPDATE';
ALTER TYPE "AuditLogAction" ADD VALUE 'BLOG_DELETE';
ALTER TYPE "AuditLogAction" ADD VALUE 'BLOG_PUBLISH';
ALTER TYPE "AuditLogAction" ADD VALUE 'BLOG_ARCHIVE';
ALTER TYPE "AuditLogAction" ADD VALUE 'OTP_SENT';
ALTER TYPE "AuditLogAction" ADD VALUE 'OTP_VERIFIED';

-- AlterEnum
ALTER TYPE "LevelRequestStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "MentorshipStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationPreferenceType" ADD VALUE 'NEW_APPLICATION';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'MENTORSHIP';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'TRAINING';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'LEVEL_UP';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'BADGE_EARNED';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'CERTIFICATE_ISSUED';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'ATTENDANCE_CONFIRMED';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'FEEDBACK_REMINDER';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'STORY_PUBLISHED';
ALTER TYPE "NotificationPreferenceType" ADD VALUE 'PROFILE_REMINDER';

-- AlterEnum
ALTER TYPE "OpportunityCategory" ADD VALUE 'ACTIVE_CITIZENSHIP';

-- AlterEnum
BEGIN;
CREATE TYPE "VolunteerType_new" AS ENUM ('STUDENT_VOLUNTEER', 'LONG_TERM', 'INTERNSHIP', 'OTHER');
ALTER TABLE "User" ALTER COLUMN "volunteerType" TYPE "VolunteerType_new" USING ("volunteerType"::text::"VolunteerType_new");
ALTER TYPE "VolunteerType" RENAME TO "VolunteerType_old";
ALTER TYPE "VolunteerType_new" RENAME TO "VolunteerType";
DROP TYPE "VolunteerType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_userId_fkey";

-- DropForeignKey
ALTER TABLE "Mentorship" DROP CONSTRAINT "Mentorship_menteeId_fkey";

-- DropForeignKey
ALTER TABLE "Mentorship" DROP CONSTRAINT "Mentorship_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "PointTransaction" DROP CONSTRAINT "PointTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserLevel" DROP CONSTRAINT "UserLevel_levelId_fkey";

-- DropForeignKey
ALTER TABLE "UserLevel" DROP CONSTRAINT "UserLevel_userId_fkey";

-- DropIndex
DROP INDEX "Attendance_approvedById_idx";

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "approvedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "onboardingCommitment" BOOLEAN,
ADD COLUMN     "onboardingInfoCorrect" BOOLEAN;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" JSONB,
ADD COLUMN     "callAvailability" JSONB,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "referralSource" "ReferralSource",
ADD COLUMN     "referralSourceName" TEXT,
ADD COLUMN     "referredById" TEXT,
ADD COLUMN     "whatsappNumber" TEXT,
ADD COLUMN     "whyVoluntary" TEXT;

-- AlterTable
ALTER TABLE "VolunteerProfile" ADD COLUMN     "details" JSONB,
ADD COLUMN     "education" TEXT;

-- CreateTable
CREATE TABLE "YouthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "initialResponses" JSONB,
    "initialCompletedAt" TIMESTAMP(3),
    "reflectionResponses" JSONB,
    "reflectionCompletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YouthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSeries" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "daysOfWeek" INTEGER[],
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "capacity" INTEGER NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxOccurrences" INTEGER,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customRule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "tags" TEXT[],
    "category" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeApproval" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "status" "BadgeApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "BadgeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KindnessChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acts" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "part2UnlockedAt" TIMESTAMP(3),
    "storyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KindnessChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KindnessCheckIn" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KindnessCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YouthProfile_userId_key" ON "YouthProfile"("userId");

-- CreateIndex
CREATE INDEX "EventSeries_opportunityId_idx" ON "EventSeries"("opportunityId");

-- CreateIndex
CREATE INDEX "EventSeries_frequency_idx" ON "EventSeries"("frequency");

-- CreateIndex
CREATE INDEX "EventSeries_isActive_idx" ON "EventSeries"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_opportunityId_key" ON "ChatRoom"("opportunityId");

-- CreateIndex
CREATE INDEX "ChatRoom_opportunityId_idx" ON "ChatRoom"("opportunityId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BadgeApproval_status_idx" ON "BadgeApproval"("status");

-- CreateIndex
CREATE INDEX "BadgeApproval_reviewedBy_idx" ON "BadgeApproval"("reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeApproval_userId_badgeId_key" ON "BadgeApproval"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "KindnessChallenge_userId_key" ON "KindnessChallenge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KindnessChallenge_storyId_key" ON "KindnessChallenge"("storyId");

-- CreateIndex
CREATE INDEX "KindnessChallenge_status_idx" ON "KindnessChallenge"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KindnessCheckIn_challengeId_day_key" ON "KindnessCheckIn"("challengeId", "day");

-- CreateIndex
CREATE INDEX "Attendance_applicationId_idx" ON "Attendance"("applicationId");

-- CreateIndex
CREATE INDEX "Certificate_levelId_idx" ON "Certificate"("levelId");

-- CreateIndex
CREATE INDEX "Event_seriesId_idx" ON "Event"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_seriesId_eventDate_key" ON "Event"("seriesId", "eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSeries" ADD CONSTRAINT "EventSeries_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevel" ADD CONSTRAINT "UserLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeApproval" ADD CONSTRAINT "BadgeApproval_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeApproval" ADD CONSTRAINT "BadgeApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeApproval" ADD CONSTRAINT "BadgeApproval_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentorship" ADD CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentorship" ADD CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KindnessChallenge" ADD CONSTRAINT "KindnessChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KindnessChallenge" ADD CONSTRAINT "KindnessChallenge_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KindnessCheckIn" ADD CONSTRAINT "KindnessCheckIn_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "KindnessChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
