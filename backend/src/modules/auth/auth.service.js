import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { signAccessToken } from '../../config/jwt.js'
import { authRepository } from './auth.repository.js'

export class AuthService {
  async login(payload) {
    const { usuario, password } = payload

    const user = await authRepository.findByUsuario(usuario)

    if (!user) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    let userPermissions = []
    if (user.roleId) {
      try {
        userPermissions = await authRepository.findPermissionsByRoleId(user.roleId)
      } catch (err) {
        console.error('Error obteniendo permisos del rol:', err)
      }
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      usuario: user.usuario,
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: userPermissions,
    })

    return { token, user: this.sanitizeUser(user, userPermissions) }
  }

  async staffLogin(payload) {
    const result = await this.login(payload)

    if (result.user.role === 'CLIENTE') {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    return result
  }

  async me(userId) {
    const user = await authRepository.findById(userId)

    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (user.activo === false) {
      const error = new Error('Usuario inactivo')
      error.statusCode = 403
      throw error
    }

    let userPermissions = []
    if (user.roleId) {
      try {
        userPermissions = await authRepository.findPermissionsByRoleId(user.roleId)
      } catch (err) {
        console.error('Error obteniendo permisos del rol:', err)
      }
    }

    return this.sanitizeUser(user, userPermissions)
  }

  sanitizeUser(user, permissions = []) {
    return {
      id: user.id,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      usuario: user.usuario || '',
      role: user.role || null,
      roleId: user.roleId || null,
      permissions,
      activo: user.activo ?? true,
    }
  }

  // Self-registration only creates login credentials (User, role
  // CLIENTE). The matching Client record is created later, on first
  // purchase, via find-or-create by email — see ventas.service.js.
  async register(payload) {
    const { nombre, email, usuario, password } = payload

    const existingUsuario = await authRepository.findByUsuario(usuario)
    if (existingUsuario) {
      const error = new Error('El nombre de usuario ya está en uso')
      error.statusCode = 409
      error.field = 'usuario'
      throw error
    }

    const existingEmail = await authRepository.findByEmail(email)
    if (existingEmail) {
      const error = new Error('El email ya está registrado')
      error.statusCode = 409
      error.field = 'email'
      throw error
    }

    const clienteRole = await authRepository.findRoleByCodigo('CLIENTE')
    if (!clienteRole) {
      const error = new Error('Rol CLIENTE no configurado en el sistema')
      error.statusCode = 500
      throw error
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await authRepository.createUser({
      nombre,
      email,
      usuario,
      passwordHash,
      roleId: clienteRole.id,
      activo: true,
    })

    const userPermissions = await authRepository.findPermissionsByRoleId(newUser.roleId)

    const token = signAccessToken({
      sub: newUser.id,
      email: newUser.email,
      usuario: newUser.usuario,
      role: newUser.role,
      roleId: newUser.roleId,
      permissions: userPermissions,
    })

    return { token, user: this.sanitizeUser(newUser, userPermissions) }
  }

  async requestPasswordReset(payload) {
    const { usuario } = payload

    const user = await authRepository.findByUsuario(usuario)
    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    // Only self-service customers reset via email code; staff go through an admin.
    if (user.role !== 'CLIENTE') {
      const error = new Error('ADMIN_REQUIRED')
      error.statusCode = 403
      throw error
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await authRepository.upsertPasswordReset(user.id, { code: resetCode, expiresAt })
    await this.sendPasswordResetEmail(user.email, resetCode)

    return { message: 'Se ha enviado un código a tu correo electrónico' }
  }

  async validateAndResetPassword(payload) {
    const { usuario, code, newPassword } = payload

    const user = await authRepository.findByUsuario(usuario)
    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (user.role !== 'CLIENTE') {
      const error = new Error('No autorizado para esta operación')
      error.statusCode = 403
      throw error
    }

    const reset = await authRepository.findPasswordResetByUserId(user.id)
    if (!reset) {
      const error = new Error('No hay solicitud de cambio de contraseña activa')
      error.statusCode = 400
      throw error
    }

    if (new Date() > new Date(reset.expiresAt)) {
      await authRepository.deletePasswordReset(user.id)
      const error = new Error('El código ha expirado')
      error.statusCode = 400
      throw error
    }

    if (reset.code !== code) {
      const error = new Error('Código incorrecto')
      error.statusCode = 400
      throw error
    }

    if (reset.used) {
      const error = new Error('Este código ya fue utilizado')
      error.statusCode = 400
      throw error
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await authRepository.updatePassword(user.id, passwordHash)
    await authRepository.markPasswordResetUsed(user.id)

    return { message: 'Contraseña actualizada exitosamente' }
  }

  async sendPasswordResetEmail(email, code) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: process.env.MAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER || 'doroclothes@gmail.com',
          pass: process.env.MAIL_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: process.env.MAIL_USER || 'doroclothes@gmail.com',
        to: email,
        subject: "Código para restablecer tu contraseña - DORO",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #221E3A; padding: 20px; text-align: center; color: #B8A7E2;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">D'ORO</h1>
              <p style="margin: 5px 0; font-size: 12px; letter-spacing: 1px;">Tienda en línea</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #B8A7E2; text-align: center; margin-bottom: 20px;">Restablecer Contraseña</h2>
              <p style="color: #666; text-align: center; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer tu contraseña.
                Utiliza el siguiente código para completar el proceso:
              </p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">Tu código de verificación</p>
                <p style="font-size: 36px; font-weight: bold; color: #B8A7E2; margin: 0; letter-spacing: 4px;">${code}</p>
              </div>
              <p style="color: #666; text-align: center; font-size: 12px; line-height: 1.6;">
                Este código expirará en 15 minutos. Si no solicitaste este cambio, ignora este mensaje.
              </p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 11px;">
              <p style="margin: 0;">© 2026 D'ORO · Todos los derechos reservados</p>
            </div>
          </div>
        `,
      })
    } catch (error) {
      console.error('Error enviando email:', error)
      const err = new Error('Error al enviar el correo electrónico')
      err.statusCode = 500
      throw err
    }
  }
}

export const authService = new AuthService()