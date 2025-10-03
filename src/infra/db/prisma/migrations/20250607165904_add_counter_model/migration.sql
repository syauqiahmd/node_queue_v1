/*
  Warnings:

  - A unique constraint covering the columns `[prefix]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Counter" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "counterNumber" VARCHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Counter_counterNumber_key" ON "Counter"("counterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Service_prefix_key" ON "Service"("prefix");

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
