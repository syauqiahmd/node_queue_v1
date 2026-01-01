-- CreateTable
CREATE TABLE "DailyServiceStats" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "total_tickets" INTEGER NOT NULL,
    "resolved_tickets" INTEGER NOT NULL,
    "tickets_in_progress" INTEGER NOT NULL,
    "avg_wait_time" DOUBLE PRECISION NOT NULL,
    "min_wait_time" DOUBLE PRECISION NOT NULL,
    "max_wait_time" DOUBLE PRECISION NOT NULL,
    "median_wait_time" DOUBLE PRECISION NOT NULL,
    "peak_hour" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL DEFAULT '-1',

    CONSTRAINT "DailyServiceStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyServiceStats_organization_id_service_id_date_idx" ON "DailyServiceStats"("organization_id", "service_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyServiceStats_service_id_date_key" ON "DailyServiceStats"("service_id", "date");

-- AddForeignKey
ALTER TABLE "DailyServiceStats" ADD CONSTRAINT "DailyServiceStats_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyServiceStats" ADD CONSTRAINT "DailyServiceStats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
