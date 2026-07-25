-- CreateTable
CREATE TABLE "Visitor" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL DEFAULT '-1',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_phone_number_key" ON "Visitor"("phone_number");
