import bcrypt from 'bcryptjs'
import { usersRepository } from './users.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

export class UsersService {
  async list(query) {
    const {
      q = '',
      activo,
      page = 1,
      limit = 10
    } = query

    const allUsers = await usersRepository.findAll()

    let filtered = allUsers

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((user) => {
        const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim().toLowerCase()

        return (
          String(user.nombre || '').toLowerCase().includes(term) ||
          String(user.apellido || '').toLowerCase().includes(term) ||
          String(user.email || '').toLowerCase().includes(term) ||
          String(user.usuario || '').toLowerCase().includes(term) ||
          fullName.includes(term)
        )
      })
    }

    if (typeof activo === 'boolean') {
      filtered = filtered.filter((user) => (user.activo ?? true) === activo)
    }

    filtered.sort((a, b) => {
      const aName = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase()
      const bName = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((user) => this.sanitizeUser(user))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const user = await usersRepository.findById(id)

    if (!user) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeUser(user)
  }

  async create(payload, currentUser = null) {
    const existingByUsuario = await usersRepository.findByUsuario(payload.usuario)

    if (existingByUsuario) {
      const error = new Error('El usuario ya existe')
      error.statusCode = 409
      throw error
    }

    const existingByEmail = await usersRepository.findByEmail(payload.email)

    if (existingByEmail) {
      const error = new Error('El email ya existe')
      error.statusCode = 409
      throw error
    }

    const role = await this.getPersonnelRole(payload.roleId)
    const revokedPermissions = await this.validateRevokedPermissions({
      revokedPermissions: payload.revokedPermissions,
      role,
      currentUser
    })
    const grantedPermissions = await this.validateGrantedPermissions({
      grantedPermissions: payload.grantedPermissions,
      role,
      currentUser
    })
    const passwordHash = await bcrypt.hash(payload.password, 10)

    const data = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      usuario: payload.usuario,
      passwordHash,
      roleId: role.id,
      revokedPermissions: revokedPermissions.filter((code) => !grantedPermissions.includes(code)),
      grantedPermissions,
      activo: payload.activo ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await usersRepository.create(data)
    const sanitized = this.sanitizeUser(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: created.id,
      details: {
        usuario: sanitized.usuario,
        email: sanitized.email,
        role: sanitized.role,
        roleId: sanitized.roleId,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.usuario && payload.usuario !== currentUserRecord.usuario) {
      const existingByUsuario = await usersRepository.findByUsuario(payload.usuario)

      if (existingByUsuario && existingByUsuario.id !== id) {
        const error = new Error('El usuario ya existe')
        error.statusCode = 409
        throw error
      }
    }

    if (payload.email && payload.email !== currentUserRecord.email) {
      const existingByEmail = await usersRepository.findByEmail(payload.email)

      if (existingByEmail && existingByEmail.id !== id) {
        const error = new Error('El email ya existe')
        error.statusCode = 409
        throw error
      }
    }

    const selectedRoleId = payload.roleId ?? currentUserRecord.roleId
    if (payload.roleId !== undefined && id === (currentUser?.id || currentUser?.sub) && payload.roleId !== currentUserRecord.roleId) {
      const error = new Error('No puedes cambiar el rol de tu propia cuenta')
      error.statusCode = 400
      throw error
    }
    const selectedRole = payload.roleId !== undefined
      ? await this.getPersonnelRole(selectedRoleId)
      : null
    const revokedPermissions = payload.revokedPermissions !== undefined
      ? await this.validateRevokedPermissions({
          targetUserId: id,
          revokedPermissions: payload.revokedPermissions,
          role: selectedRole || await usersRepository.findRoleById(selectedRoleId),
          currentUser
        })
      : undefined
    const grantedPermissions = payload.grantedPermissions !== undefined
      ? await this.validateGrantedPermissions({
          targetUserId: id,
          grantedPermissions: payload.grantedPermissions,
          role: selectedRole || await usersRepository.findRoleById(selectedRoleId),
          currentUser
        })
      : undefined

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.nombre !== undefined) data.nombre = payload.nombre
    if (payload.apellido !== undefined) data.apellido = payload.apellido
    if (payload.email !== undefined) data.email = payload.email
    if (payload.usuario !== undefined) data.usuario = payload.usuario
    if (payload.roleId !== undefined) data.roleId = selectedRole.id
    if (revokedPermissions !== undefined || payload.roleId !== undefined) data.revokedPermissions = (revokedPermissions || []).filter((code) => !(grantedPermissions || []).includes(code))
    if (grantedPermissions !== undefined || payload.roleId !== undefined) data.grantedPermissions = grantedPermissions || []
    if (payload.activo !== undefined) data.activo = payload.activo

    if (payload.password) {
      data.passwordHash = await bcrypt.hash(payload.password, 10)
    }

    const updated = await usersRepository.update(id, data)
    const sanitized = this.sanitizeUser(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        usuario: sanitized.usuario,
        email: sanitized.email,
        role: sanitized.role,
        roleId: sanitized.roleId,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async toggleActive(id, activo, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    const updated = await usersRepository.update(id, {
      activo,
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeUser(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'users',
      resourceId: updated.id,
      details: {
        usuario: sanitized.usuario,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentUserRecord = await usersRepository.findById(id)

    if (!currentUserRecord) {
      const error = new Error('Usuario no encontrado')
      error.statusCode = 404
      throw error
    }

    await usersRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: id,
      details: {
        usuario: currentUserRecord.usuario || '',
        email: currentUserRecord.email || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      usuario: user.usuario || '',
      role: user.role || null,
      roleId: user.roleId || null,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      revokedPermissions: Array.isArray(user.revokedPermissions) ? user.revokedPermissions : [],
      grantedPermissions: Array.isArray(user.grantedPermissions) ? user.grantedPermissions : [],
      activo: user.activo ?? true,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null
    }
  }

  async getPersonnelRole(roleId) {
    const role = await usersRepository.findRoleById(roleId)

    if (!role || !['ADMIN', 'BODEGUERO'].includes(role.codigo)) {
      const error = new Error('Selecciona un rol válido para el personal')
      error.statusCode = 400
      throw error
    }

    return role
  }

  async validateRevokedPermissions({ targetUserId, revokedPermissions, role, currentUser }) {
    if (currentUser?.role !== 'ADMIN') {
      const error = new Error('Solo un administrador puede modificar permisos individuales')
      error.statusCode = 403
      throw error
    }

    if (targetUserId && targetUserId === (currentUser.id || currentUser.sub)) {
      const error = new Error('No puedes modificar tus propios permisos')
      error.statusCode = 400
      throw error
    }

    if (!role) {
      const error = new Error('No se encontró el rol del integrante')
      error.statusCode = 400
      throw error
    }

    const uniquePermissions = [...new Set(revokedPermissions || [])]
    const invalidPermissions = uniquePermissions.filter((code) => !role.permissions.includes(code))

    if (invalidPermissions.length > 0) {
      const error = new Error('Solo puedes retirar permisos incluidos en el rol seleccionado')
      error.statusCode = 400
      throw error
    }

    return uniquePermissions
  }

  async validateGrantedPermissions({ targetUserId, grantedPermissions, role, currentUser }) {
    if (currentUser?.role !== 'ADMIN') {
      const error = new Error('Solo un administrador puede otorgar permisos individuales')
      error.statusCode = 403
      throw error
    }

    if (targetUserId && targetUserId === (currentUser.id || currentUser.sub)) {
      const error = new Error('No puedes modificar tus propios permisos')
      error.statusCode = 400
      throw error
    }

    const uniquePermissions = [...new Set(grantedPermissions || [])]
    const existingPermissions = await usersRepository.findPermissionCodes(uniquePermissions)
    const invalidPermissions = uniquePermissions.filter((code) => !existingPermissions.includes(code))

    if (invalidPermissions.length > 0) {
      const error = new Error('Uno o más permisos no existen')
      error.statusCode = 400
      throw error
    }

    return uniquePermissions.filter((code) => !role?.permissions?.includes(code))
  }
}

export const usersService = new UsersService()
