import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { OAuth2Client } from 'google-auth-library'
import { signAccessToken } from '../../config/jwt.js'
import { env } from '../../config/env.js'
import { authRepository } from './auth.repository.js'
import { resolveEffectivePermissions } from '../../services/authorization.service.js'
import { logAuditEvent } from '../../utils/audit.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const STAFF_ROLES = new Set(['ADMIN', 'BODEGUERO'])

function isDemoStaffAccount(account) {
  return Boolean(
    env.DEMO_STAFF_EMAIL &&
    account?.email === env.DEMO_STAFF_EMAIL
  )
}

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
    if (currentAccount.accountType === 'STAFF' && isDemoStaffAccount(account)) {
      const error = new Error('La cuenta de demostración no permite cambiar la contraseña.')
      error.statusCode = 403
      throw error
    }
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

  async requestPasswordReset({ email }) {
    const client = await authRepository.findClientByEmail(email)
    if (!client) return { message: 'Se ha enviado un código a tu correo electrónico' }
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await authRepository.upsertClientPasswordReset(client.id, { code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) })
    await this.sendPasswordResetEmail(client.email, code)
    return { message: 'Se ha enviado un código a tu correo electrónico' }
  }

  async validateAndResetPassword({ email, code, newPassword }) {
    const client = await authRepository.findClientByEmail(email)
    if (!client) throw unauthorized()
    const reset = await authRepository.findClientPasswordReset(client.id)
    if (!reset || reset.used || new Date() > new Date(reset.expiresAt) || reset.code !== code) { const error = new Error('CÃ³digo de recuperaciÃ³n invÃ¡lido o expirado'); error.statusCode = 400; throw error }
    await authRepository.updateClientPassword(client.id, await bcrypt.hash(newPassword, 10))
    await authRepository.markClientPasswordResetUsed(client.id)
    return { message: 'Contraseña actualizada exitosamente' }
  }

  sanitizeStaff(user, permissions) { return { id: user.id, nombre: user.nombre || '', apellido: user.apellido || '', email: user.email || '', usuario: user.usuario, role: user.role, roleId: user.roleId, isPrimaryAdmin: user.isPrimaryAdmin === true, isDemoStaff: isDemoStaffAccount(user), permissions, activo: user.activo, accountType: 'STAFF', createdAt: user.createdAt } }
  sanitizeClient(client) { return { id: client.id, nombre: client.nombre || '', email: client.email, role: 'CLIENTE', activo: client.activo, accountType: 'CLIENT', createdAt: client.createdAt } }

  async sendPasswordResetEmail(email, code) {
    const transporter = nodemailer.createTransport({ host: process.env.MAIL_HOST || 'smtp.gmail.com', port: process.env.MAIL_PORT || 587, secure: false, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD } })
    await transporter.sendMail({ from: process.env.MAIL_USER || 'doroclothes@gmail.com', to: email, subject: 'Cóigo para restablecer tu contraseña - DORO', text: `Tu código de verificación es ${code}. Expira en 15 minutos.` })
  }
}

export const authService = new AuthService()
