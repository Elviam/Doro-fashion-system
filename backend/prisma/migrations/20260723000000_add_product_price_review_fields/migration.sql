ALTER TABLE "products"
ADD COLUMN "precio_compra_anterior" DECIMAL(10,2),
ADD COLUMN "pending_price_review" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "purchase_price_changed_at" TIMESTAMP(3);
