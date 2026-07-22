CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_entidad_accion_created_at_idx" ON "audit_logs"("entidad", "accion", "created_at");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX "audit_logs_entidad_id_idx" ON "audit_logs"("entidad_id");
