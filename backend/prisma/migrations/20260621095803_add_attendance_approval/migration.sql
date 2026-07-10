ALTER TABLE "Attendance" ADD COLUMN "approvedHours" DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN "rating" INTEGER;
ALTER TABLE "Attendance" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "approvedAt" TIMESTAMPTZ;

CREATE INDEX "Attendance_approvedById_idx" ON "Attendance"("approvedById");

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
