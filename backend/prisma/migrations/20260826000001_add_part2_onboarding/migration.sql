-- CreateEnum
CREATE TYPE "VolunteerRoleTier" AS ENUM ('GENERAL_VOLUNTEER', 'LEADER', 'COORDINATOR', 'MANAGEMENT', 'INTERN');

-- CreateEnum
CREATE TYPE "TravelDistance" AS ENUM ('WITHIN_5_KM', 'WITHIN_10_KM', 'ANYWHERE');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'FLUENT');

-- CreateEnum
CREATE TYPE "SupportResource" AS ENUM ('COUNSELING', 'MENTORSHIP', 'COACHING', 'NEED_BASED_CAPACITY_BUILDING');

-- CreateEnum
CREATE TYPE "LifeSkill" AS ENUM ('COMMUNICATION', 'PROBLEM_SOLVING', 'CRITICAL_THINKING', 'DIGITAL_LITERACY', 'SELF_CONFIDENCE', 'LEADERSHIP', 'TEAMWORK', 'PUBLIC_SPEAKING', 'OTHER');

-- CreateTable
CREATE TABLE "VolunteerOnboardingPart2" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kindnessReflection" TEXT,
    "aspirations" TEXT,
    "roleMappings" JSONB NOT NULL,
    "lifeSkills" TEXT[],
    "lifeSkillsOther" TEXT,
    "languages" JSONB NOT NULL,
    "volunteerRoleTier" "VolunteerRoleTier",
    "preferredDays" TEXT[],
    "preferredTimeSlots" TEXT[],
    "specificDaysTimes" TEXT,
    "supportResources" TEXT[],
    "preferredCityArea" TEXT,
    "maxTravelDistance" "TravelDistance",
    "remoteAvailable" BOOLEAN,
    "hasVolunteered" BOOLEAN,
    "previousOrgName" TEXT,
    "previousRole" TEXT,
    "previousDurationNature" TEXT,
    "previousTotalHours" DOUBLE PRECISION,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "portfolioUrl" TEXT,
    "emergencyContactName" TEXT,
    "emergencyRelationship" TEXT,
    "emergencyMobile" TEXT,
    "medicalConditions" TEXT,
    "privacyPolicyConsent" BOOLEAN,
    "codeOfConductConsent" BOOLEAN,
    "mediaConsent" BOOLEAN,
    "whatsappConsent" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerOnboardingPart2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerOnboardingPart2_userId_key" ON "VolunteerOnboardingPart2"("userId");

-- CreateIndex
CREATE INDEX "VolunteerOnboardingPart2_volunteerRoleTier_idx" ON "VolunteerOnboardingPart2"("volunteerRoleTier");

-- AddForeignKey
ALTER TABLE "VolunteerOnboardingPart2" ADD CONSTRAINT "VolunteerOnboardingPart2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
