-- CreateTable
CREATE TABLE "attendance_locks" (
  "id" TEXT NOT NULL,
  "month" VARCHAR(7) NOT NULL,
  "locked_by_id" TEXT,
  "locked_at" TIMESTAMP(3),
  "is_locked" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_locks_month_key" ON "attendance_locks"("month");
CREATE INDEX "attendance_locks_month_idx" ON "attendance_locks"("month");
CREATE INDEX "attendance_locks_is_locked_idx" ON "attendance_locks"("is_locked");
CREATE INDEX "attendance_locks_created_at_idx" ON "attendance_locks"("created_at");
