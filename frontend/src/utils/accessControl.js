/** Shared presentation/navigation access rules. Backend authorization remains authoritative. */
export function getRoleCode(user) {
  if (!user || typeof user !== 'object') return ''
  const candidate = user.role?.codigo || user.role?.code || user.role?.nombre ||
    user.rol?.codigo || user.rol?.code || user.rol?.nombre ||
    user.role || user.rol || user.roleId || ''
  return String(candidate).trim().toUpperCase()
}

export function isAdmin(user) { return getRoleCode(user) === 'ADMIN' }

export function getUserPermissions(user) {
  return Array.isArray(user?.permissions) ? user.permissions : []
}

export function hasPermission(user, permission) {
  if (!permission) return true
  return isAdmin(user) || getUserPermissions(user).includes(permission)
}

export function hasAnyPermission(user, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) return true
  return permissions.some((permission) => hasPermission(user, permission))
}

export function normalizeAuthenticatedUser(user) {
  if (!user || typeof user !== 'object') return null
  return { ...user, role: getRoleCode(user), roleId: user.roleId || getRoleCode(user) || null, permissions: getUserPermissions(user) }
}
