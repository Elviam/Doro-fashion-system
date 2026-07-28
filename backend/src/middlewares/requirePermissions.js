export function requirePermissions(requiredPermissions = []) {
  return (req, res, next) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    if (user.accountType !== 'STAFF') return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : []

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    )

    if (!hasAllPermissions) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
    }

    next()
  }
}

export function requireAnyPermission(anyOfPermissions = []) {
  return (req, res, next) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    if (user.accountType !== 'STAFF') return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : []

    const hasAny = anyOfPermissions.some((permission) =>
      userPermissions.includes(permission)
    )

    if (!hasAny) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
    }

    next()
  }
}

/** Administrative invariants are independent from functional permissions. */
export function requirePrimaryAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  if (req.user.accountType !== 'STAFF' || req.user.role !== 'ADMIN' || req.user.isPrimaryAdmin !== true) {
    return res.status(403).json({ message: 'Esta operaciÃ³n requiere al administrador principal' })
  }
  next()
}

export function requireClientAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  if (req.user.accountType !== 'CLIENT' || req.user.role !== 'CLIENTE') {
    return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para clientes de la tienda' })
  }
  next()
}

export function requireStaffAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' })
  if (req.user.accountType !== 'STAFF' || !['ADMIN', 'BODEGUERO'].includes(req.user.role)) return res.status(403).json({ message: 'Esta operaciÃ³n es exclusiva para personal interno' })
  next()
}
