/** Shared presentation/navigation access rules. Backend authorization remains authoritative. */
export function getRoleCode(user) {
  if (!user || typeof user !== 'object') return ''
  const candidate = user.role?.codigo || user.role?.code || user.role?.name || user.role?.nombre ||
    user.rol?.codigo || user.rol?.code || user.rol?.name || user.rol?.nombre ||
    user.role || user.rol || user.roleId || ''
  const role = String(candidate).trim().toUpperCase()
  return ({ ADMINISTRADOR: 'ADMIN', ADMIN: 'ADMIN', BODEGUERO: 'BODEGUERO' })[role] || role
}

export function isAdmin(user) { return getRoleCode(user) === 'ADMIN' }

export function getUserPermissions(user) {
  const sources = [user?.permissions, user?.permisos, user?.role?.permissions, user?.rol?.permissions]
  return [...new Set(sources.flatMap((permissions) => Array.isArray(permissions) ? permissions : []).map((permission) => {
    if (typeof permission === 'string') return permission
    return permission?.code || permission?.codigo || permission?.permission?.code || permission?.permission?.codigo || ''
  }).map((code) => String(code).trim().toLowerCase()).filter(Boolean))]
}

export function hasPermission(user, permission) {
  if (!permission) return true
  const normalized = normalizeAuthenticatedUser(user)
  return isAdmin(normalized) || normalized?.permissions.includes(String(permission).trim().toLowerCase())
}

export function hasAnyPermission(user, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) return true
  return permissions.some((permission) => hasPermission(user, permission))
}

export function normalizeAuthenticatedUser(user) {
  if (!user || typeof user !== 'object') return null
  return {
    ...user,
    role: getRoleCode(user),
    roleId: user.roleId || getRoleCode(user) || null,
    permissions: getUserPermissions(user),
    accountType: String(user.accountType || '').trim().toUpperCase(),
  }
}
