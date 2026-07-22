ALTER TABLE "sales"
  ADD COLUMN "shipping_status" TEXT NOT NULL DEFAULT 'PENDIENTE',
  ADD COLUMN "shipping_carrier" TEXT NOT NULL DEFAULT 'D''ORO Envíos (simulado)',
  ADD COLUMN "delivered_at" TIMESTAMP(3);

CREATE TABLE "shipping_events" (
  "id" TEXT NOT NULL,
  "sale_id" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "descripcion" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipping_events_sale_id_created_at_idx" ON "shipping_events"("sale_id", "created_at");
ALTER TABLE "shipping_events" ADD CONSTRAINT "shipping_events_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
