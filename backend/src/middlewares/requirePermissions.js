import {
  getRoleCode,
  hasAnyPermission,
  hasPermission,
  normalizeAuthenticatedUser,
} from '../services/authorization.service.js'

export function requirePermissions(requiredPermissions = []) {
  return (req, res, next) => {
    const user = req.user && normalizeAuthenticatedUser(req.user)

    if (!user) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    if (user.accountType !== 'STAFF') return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(user, permission)
    )

    if (!hasAllPermissions) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
    }

    next()
  }
}

export function requireAnyPermission(anyOfPermissions = []) {
  return (req, res, next) => {
    const user = req.user && normalizeAuthenticatedUser(req.user)

    if (!user) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    if (user.accountType !== 'STAFF') return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
    const hasAny = hasAnyPermission(user, anyOfPermissions)

    if (!hasAny) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
    }

    next()
  }
}

/** Administrative invariants are independent from functional permissions. */
export function requirePrimaryAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  const user = normalizeAuthenticatedUser(req.user)
  if (user.accountType !== 'STAFF' || getRoleCode(user) !== 'ADMIN' || user.isPrimaryAdmin !== true) {
    return res.status(403).json({ message: 'Esta operaciÃ³n requiere al administrador principal' })
  }
  next()
}

export function requireClientAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  const user = normalizeAuthenticatedUser(req.user)
  if (user.accountType !== 'CLIENT' || getRoleCode(user) !== 'CLIENTE') {
    return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para clientes de la tienda' })
  }
  next()
}

export function requireStaffAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  if (req.user.accountType !== 'STAFF' || !['ADMIN', 'BODEGUERO'].includes(req.user.role)) return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
  next()
}
