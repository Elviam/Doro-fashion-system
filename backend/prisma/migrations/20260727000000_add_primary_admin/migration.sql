ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_primary_admin" BOOLEAN NOT NULL DEFAULT false;

-- PostgreSQL partial unique index: there can be at most one primary admin.
CREATE UNIQUE INDEX IF NOT EXISTS "users_one_primary_admin"
  ON "users" ("is_primary_admin")
  WHERE "is_primary_admin" = true;
