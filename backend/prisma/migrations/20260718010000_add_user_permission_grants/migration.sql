-- Permisos adicionales concedidos a un integrante sin modificar su rol base.
CREATE TABLE "public"."user_permission_grants" (
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "user_permission_grants_pkey" PRIMARY KEY ("user_id", "permission_id")
);

ALTER TABLE "public"."user_permission_grants"
ADD CONSTRAINT "user_permission_grants_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."user_permission_grants"
ADD CONSTRAINT "user_permission_grants_permission_id_fkey"
FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
