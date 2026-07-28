import bcrypt from 'bcryptjs'
import { usersRepository } from './users.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { assertPersonnelAdmin, isAdministrativePermission } from '../../services/authorization.service.js'

const PERSONNEL_ROLES = new Set(['ADMIN', 'BODEGUERO'])

export class UsersService {
  async list(query, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    const { q = '', activo, page = 1, limit = 10 } = query
    let users = (await usersRepository.findAll()).filter((user) => PERSONNEL_ROLES.has(user.role))
    if (q) {
      const term = q.trim().toLowerCase()
      users = users.filter((user) => [user.nombre, user.apellido, user.email, user.usuario]
        .some((value) => String(value || '').toLowerCase().includes(term)))
    }
    if (typeof activo === 'boolean') users = users.filter((user) => (user.activo ?? true) === activo)
    users.sort((a, b) => `${a.nombre} ${a.apellido || ''}`.localeCompare(`${b.nombre} ${b.apellido || ''}`))
    const total = users.length
    return { items: users.slice((page - 1) * limit, page * limit).map((user) => this.sanitizeUser(user)), total, page, limit }
  }

  async getById(id, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    const user = await this.getPersonnelUser(id)
    return this.sanitizeUser(user)
  }

  async create(payload, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    if (await usersRepository.findByUsuario(payload.usuario)) return this.conflict('El usuario ya existe')
    if (await usersRepository.findByEmail(payload.email)) return this.conflict('El email ya existe')

    const role = await this.getPersonnelRole(payload.roleId)
    if (role.codigo === 'ADMIN' && !currentUser.isPrimaryAdmin) this.forbidden('Solo el administrador principal puede crear administradores')
    const overrides = await this.validateOverrides({ role, payload, currentUser })
    const created = await usersRepository.create({
      nombre: payload.nombre, apellido: payload.apellido, email: payload.email, usuario: payload.usuario,
      passwordHash: await bcrypt.hash(payload.password, 10), roleId: role.id, activo: payload.activo ?? true,
      isPrimaryAdmin: false, ...overrides
    })
    const item = this.sanitizeUser(created)
    await this.audit(role.codigo === 'ADMIN' ? 'CREATE_SECONDARY_ADMIN' : 'CREATE', created.id, {
      target: this.auditTarget(item), initialRole: item.role, grantedPermissions: item.grantedPermissions, revokedPermissions: item.revokedPermissions
    }, currentUser)
    return item
  }

  async update(id, payload, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    const target = await this.getPersonnelUser(id)
    this.assertMayManageTarget(target, currentUser, payload)
    if (payload.usuario && payload.usuario !== target.usuario) {
      const duplicate = await usersRepository.findByUsuario(payload.usuario)
      if (duplicate && duplicate.id !== id) return this.conflict('El usuario ya existe')
    }
    if (payload.email && payload.email !== target.email) {
      const duplicate = await usersRepository.findByEmail(payload.email)
      if (duplicate && duplicate.id !== id) return this.conflict('El email ya existe')
    }

    const role = payload.roleId === undefined ? await usersRepository.findRoleById(target.roleId) : await this.getPersonnelRole(payload.roleId)
    if (role.codigo === 'ADMIN' && target.role !== 'ADMIN' && !currentUser.isPrimaryAdmin) this.forbidden('Solo el administrador principal puede asignar el rol ADMIN')
    const overrides = await this.validateOverrides({ role, payload, currentUser, targetId: id, keepExisting: target })
    const data = {}
    for (const field of ['nombre', 'apellido', 'email', 'usuario', 'activo']) if (payload[field] !== undefined) data[field] = payload[field]
    if (payload.roleId !== undefined) data.roleId = role.id
    if (payload.password) data.passwordHash = await bcrypt.hash(payload.password, 10)
    Object.assign(data, overrides)
    const updated = await usersRepository.update(id, data)
    const item = this.sanitizeUser(updated)
    await this.audit(payload.roleId !== undefined && payload.roleId !== target.roleId ? 'CHANGE_ROLE' : 'UPDATE', id, {
      target: this.auditTarget(item), changedFields: Object.keys(payload).filter((field) => field !== 'password'),
      previousRole: target.role, newRole: item.role, grantedPermissions: item.grantedPermissions, revokedPermissions: item.revokedPermissions
    }, currentUser)
    return item
  }

  async toggleActive(id, activo, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    const target = await this.getPersonnelUser(id)
    this.assertMayManageTarget(target, currentUser, { activo })
    const updated = await usersRepository.update(id, { activo })
    const item = this.sanitizeUser(updated)
    await this.audit(activo ? 'ACTIVATE' : 'DEACTIVATE', id, { target: this.auditTarget(item), previousActive: target.activo, active: item.activo }, currentUser)
    return item
  }

  async remove(id, currentUser = null) {
    assertPersonnelAdmin(currentUser)
    const target = await this.getPersonnelUser(id)
    this.assertMayManageTarget(target, currentUser, { remove: true })
    if (await usersRepository.hasHistoricalRelations(id)) {
      const updated = await usersRepository.update(id, { activo: false })
      await this.audit('DEACTIVATE', id, { target: this.auditTarget(updated), reason: 'historical_relations', previousActive: target.activo, active: false }, currentUser)
      return { success: true, deactivated: true, item: this.sanitizeUser(updated) }
    }
    await usersRepository.remove(id)
    await this.audit('DELETE', id, { target: this.auditTarget(target) }, currentUser)
    return { success: true }
  }

  async getPersonnelUser(id) {
    const user = await usersRepository.findById(id)
    if (!user || !PERSONNEL_ROLES.has(user.role)) {
      const error = new Error('Cuenta interna no encontrada')
      error.statusCode = 404
      throw error
    }
    return user
  }

  async getPersonnelRole(roleId) {
    const role = await usersRepository.findRoleById(roleId)
    if (!role || !PERSONNEL_ROLES.has(role.codigo)) {
      const error = new Error('Selecciona un rol vÃ¡lido para el personal')
      error.statusCode = 400
      throw error
    }
    return role
  }

  async validateOverrides({ role, payload, currentUser, targetId, keepExisting }) {
    const changesOverrides = payload.revokedPermissions !== undefined || payload.grantedPermissions !== undefined || payload.roleId !== undefined
    if (!changesOverrides) return {}
    if (role.codigo === 'ADMIN') {
      if (payload.revokedPermissions?.length || payload.grantedPermissions?.length) this.forbidden('Los administradores heredan todos los permisos y no admiten permisos individuales')
      return { revokedPermissions: [], grantedPermissions: [] }
    }
    if (targetId && targetId === (currentUser.id || currentUser.sub)) this.forbidden('No puedes modificar tus propios permisos')
    const revokedPermissions = [...new Set(payload.revokedPermissions ?? (keepExisting?.revokedPermissions || []))]
    const grantedPermissions = [...new Set(payload.grantedPermissions ?? (keepExisting?.grantedPermissions || []))]
    if (revokedPermissions.some((code) => !role.permissions.includes(code))) {
      const error = new Error('Solo puedes retirar permisos base del bodeguero')
      error.statusCode = 400
      throw error
    }
    const known = await usersRepository.findPermissionCodes(grantedPermissions)
    if (known.length !== grantedPermissions.length) {
      const error = new Error('Uno o mÃ¡s permisos no existen')
      error.statusCode = 400
      throw error
    }
    if (grantedPermissions.some(isAdministrativePermission)) this.forbidden('No puedes conceder permisos administrativos individuales a un bodeguero')
    return {
      revokedPermissions: revokedPermissions.filter((code) => !grantedPermissions.includes(code)),
      grantedPermissions: grantedPermissions.filter((code) => !role.permissions.includes(code))
    }
  }

  assertMayManageTarget(target, actor, payload = {}) {
    const ownAccount = target.id === (actor?.id || actor?.sub)
    const sensitive = payload.remove || payload.activo !== undefined || payload.roleId !== undefined || payload.revokedPermissions !== undefined || payload.grantedPermissions !== undefined
    if (ownAccount && Object.keys(payload).length > 0) this.forbidden('No puedes modificar tu propia cuenta desde Personal')
    if (target.isPrimaryAdmin && sensitive) this.forbidden('El administrador principal es una cuenta protegida')
    if (target.role === 'ADMIN' && !actor?.isPrimaryAdmin && !ownAccount) this.forbidden('Un administrador secundario no puede administrar cuentas ADMIN')
  }

  sanitizeUser(user) {
    return {
      id: user.id, nombre: user.nombre || '', apellido: user.apellido || '', email: user.email || '', usuario: user.usuario || '',
      role: user.role || null, roleId: user.roleId || null, isPrimaryAdmin: user.isPrimaryAdmin === true,
      permissions: user.permissions || [], revokedPermissions: user.revokedPermissions || [], grantedPermissions: user.grantedPermissions || [],
      activo: user.activo ?? true, createdAt: user.createdAt || null, updatedAt: user.updatedAt || null
    }
  }

  auditTarget(user) { return { id: user.id, usuario: user.usuario, email: user.email, role: user.role, isPrimaryAdmin: user.isPrimaryAdmin === true } }
  audit(action, resourceId, details, currentUser) { return logAuditEvent({ action, resource: 'users', resourceId, details, currentUser }) }
  conflict(message) { const error = new Error(message); error.statusCode = 409; throw error }
  forbidden(message) { const error = new Error(message); error.statusCode = 403; throw error }
}

export const usersService = new UsersService()
