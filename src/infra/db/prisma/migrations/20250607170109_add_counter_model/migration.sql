/*
  Warnings:

  - You are about to drop the column `organization_id` on the `Counter` table. All the data in the column will be lost.
  - Added the required column `service_id` to the `Counter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Counter" DROP CONSTRAINT "Counter_organization_id_fkey";

-- AlterTable
ALTER TABLE "Counter" DROP COLUMN "organization_id",
ADD COLUMN     "service_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
