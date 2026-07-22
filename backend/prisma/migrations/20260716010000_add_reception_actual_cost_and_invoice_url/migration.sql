ALTER TABLE "receptions"
ADD COLUMN "factura_url" TEXT;

ALTER TABLE "reception_items"
ADD COLUMN "costo_unitario_real" DECIMAL(10,2);
