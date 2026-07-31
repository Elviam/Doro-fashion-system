import { prisma } from '../lib/prisma.js'

const ADMINISTRATIVE_PERMISSION_PREFIXES = ['users:', 'roles:', 'permissions:', 'audit:']

export function getRoleCode(user) {
  const candidate = user?.role?.codigo || user?.role?.code || user?.role?.name || user?.role?.nombre || user?.rol?.codigo || user?.rol?.code || user?.rol?.name || user?.rol?.nombre || user?.role || user?.rol || ''
  const role = String(candidate).trim().toUpperCase()
  return ({ ADMINISTRADOR: 'ADMIN', ADMIN: 'ADMIN', BODEGUERO: 'BODEGUERO' })[role] || role
}

export function getUserPermissions(user) {
  const sources = [user?.permissions, user?.permisos, user?.role?.permissions, user?.rol?.permissions]
  return [...new Set(sources.flatMap((permissions) => Array.isArray(permissions) ? permissions : []).map((permission) => {
    if (typeof permission === 'string') return permission
    return permission?.code || permission?.codigo || permission?.permission?.code || permission?.permission?.codigo || ''
  }).map((code) => String(code).trim().toLowerCase()).filter(Boolean))]
}

/** Normalizes the account shapes accepted at the authorization boundary. */
export function normalizeAuthenticatedUser(user = {}) {
  return {
    ...user,
    role: getRoleCode(user),
    permissions: getUserPermissions(user),
    accountType: String(user.accountType || '').trim().toUpperCase(),
  }
}

/** ADMIN has global staff access; other roles use normalized effective permissions. */
export function hasPermission(user, permission) {
  const normalized = normalizeAuthenticatedUser(user)
  return normalized.role === 'ADMIN' || normalized.permissions.includes(String(permission).trim().toLowerCase())
}

export function hasAnyPermission(user, permissions = []) {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function isPersonnel(user) {
  return ['ADMIN', 'BODEGUERO'].includes(getRoleCode(user))
}

export function isAdministrativePermission(code) {
  return ADMINISTRATIVE_PERMISSION_PREFIXES.some((prefix) => code.startsWith(prefix))
}

/**
 * The only effective-permission resolver. ADMIN intentionally reads the live
 * permission catalog so a newly registered functional permission is effective
 * immediately without copying it into every administrator account.
 */
export async function resolveEffectivePermissions(user, db = prisma) {
  if (!user?.roleId || !user?.role) return []

  if (user.role === 'ADMIN') {
    const permissions = await db.permission.findMany({ select: { code: true } })
    return permissions.map((permission) => permission.code)
  }

  if (user.role !== 'BODEGUERO') {
    const rolePermissions = await db.rolePermission.findMany({
      where: { roleId: user.roleId },
      select: { permission: { select: { code: true } } }
    })
    return rolePermissions.map((entry) => entry.permission.code)
  }

  const basePermissions = await db.rolePermission.findMany({
    where: { roleId: user.roleId },
    select: { permission: { select: { code: true } } }
  })
  const revoked = new Set(user.revokedPermissions || [])
  const granted = (user.grantedPermissions || []).filter((code) => !isAdministrativePermission(code))
  return [...new Set([
    ...basePermissions.map((entry) => entry.permission.code).filter((code) => !revoked.has(code)),
    ...granted
  ])]
}

export function assertPersonnelAdmin(actor) {
  if (getRoleCode(normalizeAuthenticatedUser(actor)) !== 'ADMIN') {
    const error = new Error('Solo las cuentas administrativas pueden administrar personal')
    error.statusCode = 403
    throw error
  }
}
