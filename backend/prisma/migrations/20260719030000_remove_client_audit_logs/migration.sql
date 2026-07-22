-- La bitácora administrativa no debe conservar actividad de cuentas CLIENTE.
-- Se mantienen los eventos del personal y los eventos técnicos sin usuario.
DELETE FROM "audit_logs"
WHERE "user_id" IN (
  SELECT "users"."id"
  FROM "users"
  INNER JOIN "roles" ON "roles"."id" = "users"."role_id"
  WHERE "roles"."codigo" = 'CLIENTE'
);
