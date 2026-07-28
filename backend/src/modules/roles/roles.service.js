import { rolesRepository } from './roles.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

const INTERNAL_ROLES = new Set(['ADMIN', 'BODEGUERO'])
const fixedRoleError = () => Object.assign(new Error('Los roles internos de personal son fijos: ADMIN y BODEGUERO'), { statusCode: 403 })

export class RolesService {
  async list({ q = '', page = 1, limit = 10 }) {
    let roles = (await rolesRepository.findAll()).filter((role) => INTERNAL_ROLES.has(role.codigo))
    if (q) { const term = q.trim().toLowerCase(); roles = roles.filter((role) => `${role.codigo} ${role.nombre} ${role.descripcion || ''}`.toLowerCase().includes(term)) }
    roles.sort((a, b) => a.codigo.localeCompare(b.codigo))
    return { items: roles.slice((page - 1) * limit, page * limit).map((role) => this.sanitizeRole(role)), total: roles.length, page, limit }
  }

  async getById(id) {
    const role = await rolesRepository.findById(id)
    if (!role || !INTERNAL_ROLES.has(role.codigo)) { const error = new Error('Rol interno no encontrado'); error.statusCode = 404; throw error }
    return this.sanitizeRole(role)
  }

  async create() { throw fixedRoleError() }
  async remove() { throw fixedRoleError() }

  async update(id, payload, currentUser = null) {
    const role = await rolesRepository.findById(id)
    if (!role || !INTERNAL_ROLES.has(role.codigo)) { const error = new Error('El rol tÃ©cnico CLIENTE no se administra desde Personal'); error.statusCode = 403; throw error }
    if (Object.keys(payload).some((field) => field !== 'descripcion')) throw fixedRoleError()
    const updated = await rolesRepository.update(id, { descripcion: payload.descripcion ?? null })
    const item = this.sanitizeRole(updated)
    await logAuditEvent({ action: 'UPDATE', resource: 'roles', resourceId: id, details: { role: role.codigo, previousDescription: role.descripcion || null, newDescription: item.descripcion || null }, currentUser })
    return item
  }

  sanitizeRole(role) { return { id: role.id, codigo: role.codigo, nombre: role.nombre, descripcion: role.descripcion || '', permissions: role.permissions || [], createdAt: role.createdAt || null, updatedAt: role.updatedAt || null } }
}

export const rolesService = new RolesService()
