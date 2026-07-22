-- Permite retirar permisos del rol a un integrante concreto, sin alterar al resto.
CREATE TABLE "public"."user_permission_revocations" (
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "user_permission_revocations_pkey" PRIMARY KEY ("user_id", "permission_id")
);

ALTER TABLE "public"."user_permission_revocations"
ADD CONSTRAINT "user_permission_revocations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."user_permission_revocations"
ADD CONSTRAINT "user_permission_revocations_permission_id_fkey"
FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
