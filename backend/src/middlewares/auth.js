import { verifyAccessToken } from '../config/jwt.js'
import { authRepository } from '../modules/auth/auth.repository.js'
import { resolveEffectivePermissions } from '../services/authorization.service.js'

async function loadCurrentAccount(decoded) {
  if (decoded.accountType === 'STAFF') {
    const user = await authRepository.findById(decoded.sub)
    if (!user || user.activo === false || !['ADMIN', 'BODEGUERO'].includes(user.role)) return null
    return { ...user, sub: user.id, id: user.id, accountType: 'STAFF', permissions: await resolveEffectivePermissions(user) }
  }
  if (decoded.accountType === 'CLIENT') {
    const client = await authRepository.findClientById(decoded.sub)
    if (!client || client.activo === false) return null
    return { ...client, sub: client.id, id: client.id, role: 'CLIENTE', accountType: 'CLIENT', permissions: [] }
  }
  return null
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No autorizado' })
    const account = await loadCurrentAccount(verifyAccessToken(header.slice(7)))
    if (!account) return res.status(401).json({ message: 'SesiÃ³n invÃ¡lida, inactiva o eliminada' })
    req.user = account
    next()
  } catch {
    return res.status(401).json({ message: 'Token invÃ¡lido o expirado' })
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) req.user = await loadCurrentAccount(verifyAccessToken(header.slice(7))) || undefined
  } catch { /* public catalog remains public */ }
  next()
}
