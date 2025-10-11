-- CreateIndex
CREATE INDEX "Ticket_service_id_is_call_is_priority_created_at_idx" ON "Ticket"("service_id", "is_call", "is_priority", "created_at");
