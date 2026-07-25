-- CreateTable
CREATE TABLE "VisitorHistory" (
    "id" UUID NOT NULL,
    "visitor_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitorHistory_visitor_id_visit_date_idx" ON "VisitorHistory"("visitor_id", "visit_date");

-- CreateIndex
CREATE INDEX "VisitorHistory_organization_id_visit_date_idx" ON "VisitorHistory"("organization_id", "visit_date");

-- AddForeignKey
ALTER TABLE "VisitorHistory" ADD CONSTRAINT "VisitorHistory_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorHistory" ADD CONSTRAINT "VisitorHistory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
