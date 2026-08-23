-- Add hoursPerMonth and preferredDaysTimes to VolunteerProfile (T11 week-month sync)
ALTER TABLE "VolunteerProfile" ADD COLUMN "hoursPerMonth" DOUBLE PRECISION;
ALTER TABLE "VolunteerProfile" ADD COLUMN "preferredDaysTimes" TEXT;
