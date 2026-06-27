/**
 * Roles que pueden acceder al dashboard (no clientes)
 */
export const DASHBOARD_ACCESSIBLE_ROLES = [
  "role_admin",
  "ADMIN",
  "GERENTE",
  "BODEGUERO",
  "VENDEDOR"
];

/**
 * Verifica si un rol específico puede acceder al dashboard
 * @param {string} roleId - El ID del rol del usuario
 * @returns {boolean} - True si puede acceder al dashboard
 */
export function canAccessDashboard(roleId) {
  if (!roleId) return false;
  return DASHBOARD_ACCESSIBLE_ROLES.includes(roleId);
}

/**
 * Obtiene el rol del usuario de manera normalizada
 * @param {object} usuario - El objeto usuario
 * @returns {string|null} - El roleId del usuario
 */
export function getUserRole(usuario) {
  if (!usuario) return null;
  return usuario?.roleId || usuario?.role || null;
}

/**
 * Verifica si un usuario puede acceder al dashboard
 * @param {object} usuario - El objeto usuario
 * @returns {boolean} - True si puede acceder al dashboard
 */
export function userCanAccessDashboard(usuario) {
  const role = getUserRole(usuario);
  return canAccessDashboard(role);
}
