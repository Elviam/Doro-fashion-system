import { auditRepository } from './audit.repository.js'

const ZONA_HORARIA_MEXICO = 'America/Mexico_City'
const partesFechaMexico = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA_MEXICO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function desfaseHorarioMexico(fecha) {
  const partes = Object.fromEntries(partesFechaMexico.formatToParts(fecha).map(({ type, value }) => [type, value]))
  const horaLocalComoUtc = Date.UTC(partes.year, Number(partes.month) - 1, partes.day, partes.hour, partes.minute, partes.second)
  return horaLocalComoUtc - fecha.getTime()
}

function inicioDelDiaMexico(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const medianocheUtc = new Date(Date.UTC(anio, mes - 1, dia))
  const conDesfaseInicial = new Date(medianocheUtc.getTime() - desfaseHorarioMexico(medianocheUtc))
  return new Date(medianocheUtc.getTime() - desfaseHorarioMexico(conDesfaseInicial))
}

function siguienteFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const siguienteDia = new Date(Date.UTC(anio, mes - 1, dia + 1))
  return `${siguienteDia.getUTCFullYear()}-${String(siguienteDia.getUTCMonth() + 1).padStart(2, '0')}-${String(siguienteDia.getUTCDate()).padStart(2, '0')}`
}

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
      if (from) where.createdAt.gte = inicioDelDiaMexico(from)
      if (to) where.createdAt.lt = inicioDelDiaMexico(siguienteFecha(to))
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
