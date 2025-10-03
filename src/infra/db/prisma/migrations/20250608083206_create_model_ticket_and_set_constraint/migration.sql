-- CreateTable
CREATE TABLE "Ticket" (
    "id" UUID NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "queue_date" TIMESTAMP(3) NOT NULL,
    "prefix" VARCHAR(3) NOT NULL,
    "is_call" BOOLEAN NOT NULL DEFAULT false,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "service_id" UUID NOT NULL,
    "latest_assignee_counter_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_service_id_queue_date_idx" ON "Ticket"("service_id", "queue_date");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_service_id_queueNumber_queue_date_key" ON "Ticket"("service_id", "queueNumber", "queue_date");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_latest_assignee_counter_id_fkey" FOREIGN KEY ("latest_assignee_counter_id") REFERENCES "Counter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
