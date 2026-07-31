import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { signAccessToken } from '../../config/jwt.js'
import { authRepository } from './auth.repository.js'
import { resolveEffectivePermissions } from '../../services/authorization.service.js'
import { logAuditEvent } from '../../utils/audit.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const STAFF_ROLES = new Set(['ADMIN', 'BODEGUERO'])

function unauthorized() { const error = new Error('Credenciales inválidas'); error.statusCode = 401; return error }

export class AuthService {
  async staffLogin({ usuario, password }) {
    // Staff authentication is intentionally User-only and username-only.
    const user = await authRepository.findByUsuario(usuario)
    if (!user || !STAFF_ROLES.has(user.role) || !user.activo || !await bcrypt.compare(password, user.passwordHash)) throw unauthorized()
    const permissions = await resolveEffectivePermissions(user)
    return { token: signAccessToken({ sub: user.id, accountType: 'STAFF' }), user: this.sanitizeStaff(user, permissions) }
  }

  async clientLogin({ email, password }) {
    // Store authentication is intentionally Client-only and email-only.
    const client = await authRepository.findClientByEmail(email)
    if (!client || !client.passwordHash || !client.activo || !await bcrypt.compare(password, client.passwordHash)) throw unauthorized()
    return { token: signAccessToken({ sub: client.id, accountType: 'CLIENT' }), user: this.sanitizeClient(client) }
  }

  async register({ nombre, email, password }) {
    if (await authRepository.findClientByEmail(email)) {
      const error = new Error('El correo ya está registrado'); error.statusCode = 409; error.field = 'email'; throw error
    }
    const client = await authRepository.createClient({ nombre, email, passwordHash: await bcrypt.hash(password, 10), activo: true })
    return { token: signAccessToken({ sub: client.id, accountType: 'CLIENT' }), user: this.sanitizeClient(client) }
  }

  async googleLogin({ credential }) {
    let payload
    try { payload = (await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })).getPayload() } catch { throw unauthorized() }
    if (!payload?.email) { const error = new Error('No se pudo obtener el correo'); error.statusCode = 400; throw error }
    let client = await authRepository.findClientByEmail(payload.email.toLowerCase())
    if (client?.activo === false) { const error = new Error('Cliente inactivo'); error.statusCode = 403; throw error }
    if (!client) client = await authRepository.createClient({ nombre: payload.name || payload.email.split('@')[0], email: payload.email.toLowerCase(), passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), activo: true })
    return { token: signAccessToken({ sub: client.id, accountType: 'CLIENT' }), user: this.sanitizeClient(client) }
  }

  async me(currentAccount) {
    if (currentAccount.accountType === 'STAFF') return this.sanitizeStaff(currentAccount, currentAccount.permissions || [])
    if (currentAccount.accountType === 'CLIENT') return this.sanitizeClient(currentAccount)
    throw unauthorized()
  }

  async changePassword(currentAccount, { currentPassword, newPassword }) {
    const account = currentAccount.accountType === 'STAFF'
      ? await authRepository.findById(currentAccount.id || currentAccount.sub)
      : await authRepository.findClientById(currentAccount.id || currentAccount.sub)
    if (!account || account.activo === false) throw unauthorized()
    const hash = account.passwordHash
    if (!hash || !await bcrypt.compare(currentPassword, hash)) { const error = new Error('La contraseña actual es incorrecta'); error.statusCode = 400; throw error }
    if (await bcrypt.compare(newPassword, hash)) { const error = new Error('La nueva contraseña debe ser diferente'); error.statusCode = 400; throw error }
    const newHash = await bcrypt.hash(newPassword, 10)
    if (currentAccount.accountType === 'STAFF') {
      await authRepository.updatePassword(account.id, newHash)
      await logAuditEvent({
        action: 'CHANGE_PASSWORD',
        resource: 'auth',
        resourceId: account.id,
        details: {
          actorUserId: currentAccount.id || currentAccount.sub,
          actorUsername: currentAccount.usuario || account.usuario,
          targetUserId: account.id,
          targetUsername: account.usuario,
        },
        currentUser: currentAccount
      })
    } else {
      await authRepository.updateClientPassword(account.id, newHash)
    }
    return { message: 'Contraseña actualizada correctamente' }
  }

  sanitizeStaff(user, permissions) { return { id: user.id, nombre: user.nombre || '', apellido: user.apellido || '', email: user.email || '', usuario: user.usuario, role: user.role, roleId: user.roleId, isPrimaryAdmin: user.isPrimaryAdmin === true, permissions, activo: user.activo, accountType: 'STAFF', createdAt: user.createdAt } }
  sanitizeClient(client) { return { id: client.id, nombre: client.nombre || '', email: client.email, role: 'CLIENTE', activo: client.activo, accountType: 'CLIENT', createdAt: client.createdAt } }
}

export const authService = new AuthService()
