-- CreateIndex
CREATE INDEX "Visitor_created_at_idx" ON "Visitor"("created_at");

-- CreateIndex
CREATE INDEX "VisitorHistory_organization_id_created_at_idx" ON "VisitorHistory"("organization_id", "created_at");
