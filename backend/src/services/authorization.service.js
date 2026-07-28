import { prisma } from '../lib/prisma.js'

const ADMINISTRATIVE_PERMISSION_PREFIXES = ['users:', 'roles:', 'permissions:', 'audit:']

export function isPersonnel(user) {
  return ['ADMIN', 'BODEGUERO'].includes(user?.role)
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
  if (actor?.role !== 'ADMIN') {
    const error = new Error('Solo las cuentas administrativas pueden administrar personal')
    error.statusCode = 403
    throw error
  }
}
