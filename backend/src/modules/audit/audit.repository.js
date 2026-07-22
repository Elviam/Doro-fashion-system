import { prisma } from '../../lib/prisma.js'

export class AuditRepository {
  async findPage(where, { skip, take }) {
    const [items, total, actionGroups] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ['accion'], where, _count: { _all: true } }),
    ])
    return { items, total, actionGroups }
  }

  async findById(id) {
    return prisma.auditLog.findUnique({ where: { id }, include: { user: true } })
  }

  async findActors() {
    const users = await prisma.user.findMany({
      // Los clientes también son usuarios de autenticación, pero no pueden
      // operar el panel. Este filtro representa únicamente al personal.
      where: { role: { codigo: { in: ['ADMIN', 'BODEGUERO'] } } },
      select: { id: true, nombre: true, apellido: true, usuario: true, role: { select: { nombre: true } } },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    })
    return users.map((user) => ({
      id: user.id,
      nombre: `${user.nombre} ${user.apellido || ''}`.trim(),
      usuario: user.usuario,
      rol: user.role.nombre,
    }))
  }

  async create({ action, resource, resourceId, details, userId }) {
    return prisma.auditLog.create({ data: { accion: action, entidad: resource || null, entidadId: resourceId || null, detalles: details || {}, userId: userId || null }, include: { user: true } })
  }
}

export const auditRepository = new AuditRepository()
