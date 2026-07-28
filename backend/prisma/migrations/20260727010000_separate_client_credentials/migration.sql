-- Client credentials are deliberately stored on Client. The optional legacy
-- relation is retained only for historical linkage and is not used for auth.
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

CREATE TABLE IF NOT EXISTS "client_password_resets" (
  "id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_password_resets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_password_resets_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "client_password_resets_client_id_key" ON "client_password_resets"("client_id");
