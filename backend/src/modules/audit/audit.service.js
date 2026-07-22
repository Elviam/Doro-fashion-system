import { auditRepository } from './audit.repository.js'

export class AuditService {
  buildWhere({ q = '', resource, action, userId, resourceId, from, to }) {
    // No se muestran eventos históricos de clientes ni eventos de sistema:
    // esta vista representa únicamente la operación del personal de D'ORO.
    const where = { user: { is: { role: { is: { codigo: { in: ['ADMIN', 'BODEGUERO'] } } } } } }
    if (resource) where.entidad = resource
    if (action) where.accion = action
    if (userId) where.userId = userId
    if (resourceId) where.entidadId = resourceId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`)
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`)
    }
    if (q.trim()) {
      const term = q.trim()
      where.OR = [
        { accion: { contains: term, mode: 'insensitive' } },
        { entidad: { contains: term, mode: 'insensitive' } },
        { entidadId: { contains: term, mode: 'insensitive' } },
        { user: { is: { nombre: { contains: term, mode: 'insensitive' } } } },
        { user: { is: { usuario: { contains: term, mode: 'insensitive' } } } },
      ]
    }
    return where
  }

  async list(query) {
    // Los parámetros de URL llegan como texto en Express; no dependemos de
    // que el middleware pueda mutar req.query para entregarlos a Prisma.
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const { items, total, actionGroups } = await auditRepository.findPage(this.buildWhere(query), { skip: (page - 1) * limit, take: limit })
    return { items: items.map((log) => this.sanitizeAudit(log)), total, page, limit, summary: { total, byAction: Object.fromEntries(actionGroups.map((group) => [group.accion, group._count._all])) } }
  }

  async getById(id) {
    const log = await auditRepository.findById(id)
    if (!log) { const error = new Error('Registro de auditoría no encontrado'); error.statusCode = 404; throw error }
    return this.sanitizeAudit(log)
  }

  async getFilters() { return { users: await auditRepository.findActors() } }

  sanitizeAudit(log) {
    return { id: log.id, action: log.accion || '', resource: log.entidad || '', resourceId: log.entidadId || '', details: log.detalles || {}, userId: log.userId || '', usuario: log.user ? `${log.user.nombre} ${log.user.apellido || ''}`.trim() : '', createdAt: log.createdAt || null }
  }
}

export const auditService = new AuditService()
