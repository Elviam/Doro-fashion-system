CREATE TABLE "client_addresses" (
  "id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "alias" TEXT NOT NULL DEFAULT 'Dirección',
  "country" TEXT NOT NULL DEFAULT 'México',
  "state" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "exterior_number" TEXT NOT NULL,
  "interior_number" TEXT,
  "references" TEXT,
  "phone" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_addresses_client_id_active_idx" ON "client_addresses"("client_id", "active");

ALTER TABLE "client_addresses"
  ADD CONSTRAINT "client_addresses_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
