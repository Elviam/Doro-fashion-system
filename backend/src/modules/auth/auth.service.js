import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { signAccessToken } from '../../config/jwt.js'
import { authRepository } from './auth.repository.js'
import { db } from '../../config/firebase.js'

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

    const passwordHash = user.passwordHash || user.password

    if (!passwordHash) {
      const error = new Error('El usuario no tiene contraseña configurada')
      error.statusCode = 500
      throw error
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash)

    if (!isValidPassword) {
      const error = new Error('Credenciales inválidas')
      error.statusCode = 401
      throw error
    }

    let userPermissions = Array.isArray(user.permissions) ? user.permissions : []
    
    if (user.roleId && userPermissions.length === 0) {
      try {
        const roleDoc = await db.collection('roles').doc(user.roleId).get()
        if (roleDoc.exists) {
          const roleData = roleDoc.data()
          userPermissions = Array.isArray(roleData.permissions) ? roleData.permissions : []
        }
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
      permissions: userPermissions
    })

    return {
      token,
      user: this.sanitizeUser(user, userPermissions)
    }
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

    let userPermissions = Array.isArray(user.permissions) ? user.permissions : []
    
    if (user.roleId && userPermissions.length === 0) {
      try {
        const roleDoc = await db.collection('roles').doc(user.roleId).get()
        if (roleDoc.exists) {
          const roleData = roleDoc.data()
          userPermissions = Array.isArray(roleData.permissions) ? roleData.permissions : []
        }
      } catch (err) {
        console.error('Error obteniendo permisos del rol:', err)
      }
    }

    return this.sanitizeUser(user, userPermissions)
  }

  sanitizeUser(user, permissions = null) {
    return {
      id: user.id,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      usuario: user.usuario || '',
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: permissions !== null 
        ? permissions 
        : (Array.isArray(user.permissions) ? user.permissions : []),
      activo: user.activo ?? true
    }
  }

  async register(payload) {
  const { nombre, rfc, email, telefono, usuario, password } = payload  // ← rfc y telefono

  // ← quita el this.
  const existingUsuario = await authRepository.findByUsuario(usuario)
  if (existingUsuario) {
    const error = new Error('El nombre de usuario ya está en uso')
    error.statusCode = 409
    error.field = 'usuario'
    throw error
  }

  const emailSnapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (!emailSnapshot.empty) {
    const error = new Error('El email ya está registrado')
    error.statusCode = 409
    error.field = 'email'
    throw error
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const now = new Date().toISOString()
  const newUserRef = db.collection('users').doc()

  const userData = {
    nombre,
    rfc,        
    telefono,   
    email,
    usuario,
    passwordHash,
    role: 'CLIENTE',
    roleId: 'CLIENTE',
    permissions: ['auth:me', 'tienda:read'],
    activo: true,
    createdAt: now,
    updatedAt: now,
  }

  await newUserRef.set(userData)

  // Crear registro en clientes
  const clientData = {
    nombre,
    rfc,
    email,
    telefono,
    roleId: 'CLIENTE',
    activo: true,
    createdAt: now,
    updatedAt: now,
  }

  const newClientRef = db.collection('clients').doc()
  await newClientRef.set(clientData)

  const newUser = { id: newUserRef.id, ...userData }

  const token = signAccessToken({
    sub: newUser.id,
    usuario: newUser.usuario,
    role: newUser.role,
    roleId: newUser.roleId,
    permissions: newUser.permissions,
  })

  return {
    token,
    user: this.sanitizeUser(newUser, newUser.permissions),
  }
}

async requestPasswordReset(payload) {
  const { usuario } = payload

  const user = await authRepository.findByUsuario(usuario)

  if (!user) {
    const error = new Error('Usuario no encontrado')
    error.statusCode = 404
    throw error
  }

  // Si no es cliente, no puede recuperar contraseña por email
  if (user.roleId !== 'CLIENTE') {
    const error = new Error('ADMIN_REQUIRED')
    error.statusCode = 403
    throw error
  }

  // Generar código de 6 dígitos
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

  // Guardar código en una colección temporal
  await db.collection('password_resets').doc(user.id).set({
    code: resetCode,
    createdAt: now,
    expiresAt: expiresAt,
    used: false
  })

  // Enviar email
  await this.sendPasswordResetEmail(user.email, resetCode)

  return {
    message: 'Se ha enviado un código a tu correo electrónico'
  }
}

async validateAndResetPassword(payload) {
  const { usuario, code, newPassword } = payload

  const user = await authRepository.findByUsuario(usuario)

  if (!user) {
    const error = new Error('Usuario no encontrado')
    error.statusCode = 404
    throw error
  }

  if (user.roleId !== 'CLIENTE') {
    const error = new Error('No autorizado para esta operación')
    error.statusCode = 403
    throw error
  }

  // Obtener el código guardado
  const resetDoc = await db.collection('password_resets').doc(user.id).get()

  if (!resetDoc.exists) {
    const error = new Error('No hay solicitud de cambio de contraseña activa')
    error.statusCode = 400
    throw error
  }

  const resetData = resetDoc.data()

  // Validar que no haya expirado
  if (new Date() > new Date(resetData.expiresAt)) {
    await db.collection('password_resets').doc(user.id).delete()
    const error = new Error('El código ha expirado')
    error.statusCode = 400
    throw error
  }

  // Validar el código
  if (resetData.code !== code) {
    const error = new Error('Código incorrecto')
    error.statusCode = 400
    throw error
  }

  if (resetData.used) {
    const error = new Error('Este código ya fue utilizado')
    error.statusCode = 400
    throw error
  }

  // Hash de la nueva contraseña
  const passwordHash = await bcrypt.hash(newPassword, 10)

  // Actualizar contraseña
  await db.collection('users').doc(user.id).update({
    passwordHash,
    updatedAt: new Date().toISOString()
  })

  // Marcar código como usado
  await db.collection('password_resets').doc(user.id).update({
    used: true
  })

  return {
    message: 'Contraseña actualizada exitosamente'
  }
}

async sendPasswordResetEmail(email, code) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER || 'auraclothes.salamanca@gmail.com',
        pass: process.env.MAIL_PASSWORD
      }
    })

    const mailOptions = {
      from: process.env.MAIL_USER || 'auraclothes.salamanca@gmail.com',
      to: email,
      subject: 'Código para restablecer tu contraseña - AURA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #221E3A; padding: 20px; text-align: center; color: #B8A7E2;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">AURA</h1>
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
            <p style="margin: 0;">© 2026 AURA · Todos los derechos reservados</p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error enviando email:', error)
    const err = new Error('Error al enviar el correo electrónico')
    err.statusCode = 500
    throw err
  }
}
}

export const authService = new AuthService()