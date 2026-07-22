-- Vincula los perfiles comerciales con las cuentas que pueden iniciar sesiÃ³n.
ALTER TABLE "clients" ADD COLUMN "user_id" TEXT;

-- Conserva perfiles existentes creados por ventas o por el personal y los
-- enlaza con la cuenta CLIENTE que tenga el mismo correo.
UPDATE "clients" AS c
SET "user_id" = u."id"
FROM "users" AS u
INNER JOIN "roles" AS r ON r."id" = u."role_id"
WHERE r."codigo" = 'CLIENTE'
  AND c."user_id" IS NULL
  AND LOWER(c."email") = LOWER(u."email");

-- Crea perfiles para las cuentas CLIENTE histÃ³ricas que todavÃ­a no habÃ­an
-- comprado y, por lo tanto, no existÃ­an en la tabla clients.
INSERT INTO "clients" ("id", "user_id", "nombre", "email", "activo", "created_at", "updated_at")
SELECT CONCAT('profile_', u."id"), u."id", u."nombre", u."email", u."activo", u."created_at", CURRENT_TIMESTAMP
FROM "users" AS u
INNER JOIN "roles" AS r ON r."id" = u."role_id"
LEFT JOIN "clients" AS c ON c."user_id" = u."id"
WHERE r."codigo" = 'CLIENTE'
  AND c."id" IS NULL;

CREATE UNIQUE INDEX "clients_user_id_key" ON "clients"("user_id");

ALTER TABLE "clients"
ADD CONSTRAINT "clients_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
