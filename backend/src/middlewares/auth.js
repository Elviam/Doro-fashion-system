import { verifyAccessToken } from '../config/jwt.js'
import { authRepository } from '../modules/auth/auth.repository.js'
import { resolveEffectivePermissions } from '../services/authorization.service.js'

function reject(res, message) {
  return res.status(401).json({ message })
}

function verifyToken(token, res) {
  try {
    const decoded = verifyAccessToken(token)
    if (!decoded?.sub || typeof decoded.sub !== 'string' || !decoded.accountType) {
      reject(res, 'Token de autenticación inválido.')
      return null
    }
    return decoded
  } catch (error) {
    reject(res, error?.name === 'TokenExpiredError' ? 'La sesión ha expirado.' : 'Token de autenticación inválido.')
    return null
  }
}

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
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return reject(res, 'No autorizado')

  const token = header.slice(7).trim()
  if (!token) return reject(res, 'Token de autenticación inválido.')
  const decoded = verifyToken(token, res)
  if (!decoded) return undefined

  try {
    const account = await loadCurrentAccount(decoded)
    if (!account) return reject(res, 'Sesión inválida, inactiva o eliminada.')
    req.user = account
    return next()
  } catch (error) {
    // A database/permission-resolution failure is not evidence that the JWT is invalid.
    return next(error)
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return next()
    const decoded = verifyAccessToken(header.slice(7).trim())
    if (decoded?.sub && typeof decoded.sub === 'string') req.user = await loadCurrentAccount(decoded) || undefined
  } catch {
    // Optional authentication intentionally keeps public catalog routes public.
  }
  return next()
}

export { loadCurrentAccount }
