const PASSWORD_ACTIONS = new Set(["CHANGE_PASSWORD", "RESET_PASSWORD"]);

function readDetails(details) {
  return details && typeof details === "object" && !Array.isArray(details) ? details : {};
}

function formatUsername(username) {
  const value = typeof username === "string" ? username.trim().replace(/^@+/, "") : "";
  return value ? `@${value}` : "No disponible";
}

export function isPasswordAuditEvent(log = {}) {
  return log.resource === "auth" && PASSWORD_ACTIONS.has(log.action);
}

export function getPasswordAuditPresentation(log = {}) {
  if (!isPasswordAuditEvent(log)) return null;

  const details = readDetails(log.details);
  const isAdministrativeReset = log.action === "RESET_PASSWORD";
  const targetUsername = isAdministrativeReset
    ? details.targetUsername || details.usuario
    : details.targetUsername || details.usuario || details.actorUsername;

  return {
    actionLabel: isAdministrativeReset ? "Restablecimiento de contraseña" : "Cambio de contraseña",
    resourceLabel: "Seguridad de cuenta",
    isAdministrativeReset,
    fields: isAdministrativeReset
      ? [
          { label: "REALIZADO POR", value: formatUsername(details.actorUsername) },
          { label: "CUENTA AFECTADA", value: formatUsername(targetUsername) },
        ]
      : [{ label: "CUENTA", value: formatUsername(targetUsername) }],
  };
}

export function getPasswordMovementDescription(log = {}) {
  const presentation = getPasswordAuditPresentation(log);
  if (!presentation) return null;
  if (!presentation.isAdministrativeReset) return "Cambiaste tu contraseña.";

  const target = presentation.fields.find(({ label }) => label === "CUENTA AFECTADA")?.value;
  return target && target !== "No disponible"
    ? `Restableciste la contraseña de ${target}.`
    : "Restableciste la contraseña de una cuenta.";
}
