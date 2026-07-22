ALTER TABLE "sales"
ADD COLUMN "fulfillment_status" TEXT NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN "prepared_at" TIMESTAMP(3),
ADD COLUMN "prepared_by" TEXT;
