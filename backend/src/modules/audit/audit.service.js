import { auditRepository } from './audit.repository.js'

export class AuditService {
  async list(query) {
    const { q = '', resource, action, userId, page = 1, limit = 10 } = query

    const allLogs = await auditRepository.findAll()
    let filtered = allLogs

    if (resource) filtered = filtered.filter((log) => log.entidad === resource)
    if (action) filtered = filtered.filter((log) => log.accion === action)
    if (userId) filtered = filtered.filter((log) => log.userId === userId)

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((log) => {
        const usuario = log.user ? `${log.user.nombre} ${log.user.apellido}` : ''
        return (
          String(log.accion || '').toLowerCase().includes(term) ||
          String(log.entidad || '').toLowerCase().includes(term) ||
          String(log.entidadId || '').toLowerCase().includes(term) ||
          usuario.toLowerCase().includes(term) ||
          JSON.stringify(log.detalles || {}).toLowerCase().includes(term)
        )
      })
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit).map((log) => this.sanitizeAudit(log))

    return { items, total, page, limit }
  }

  async getById(id) {
    const log = await auditRepository.findById(id)
    if (!log) {
      const error = new Error('Registro de auditoría no encontrado')
      error.statusCode = 404
      throw error
    }
    return this.sanitizeAudit(log)
  }

  async create(payload) {
    const created = await auditRepository.create({
      action: payload.action,
      resource: payload.resource,
      resourceId: payload.resourceId,
      details: payload.details,
      userId: payload.userId
    })
    return this.sanitizeAudit(created)
  }

  sanitizeAudit(log) {
    return {
      id: log.id,
      action: log.accion || '',
      resource: log.entidad || '',
      resourceId: log.entidadId || '',
      details: log.detalles || {},
      userId: log.userId || '',
      usuario: log.user ? `${log.user.nombre} ${log.user.apellido}` : '',
      createdAt: log.createdAt || null
    }
  }
}

export const auditService = new AuditService()