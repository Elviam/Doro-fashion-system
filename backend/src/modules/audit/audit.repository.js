import { prisma } from '../../lib/prisma.js'

export class AuditRepository {
  async findAll() {
    return prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: { user: true }
    })
  }

  async create({ action, resource, resourceId, details, userId }) {
    return prisma.auditLog.create({
      data: {
        accion: action,
        entidad: resource || null,
        entidadId: resourceId || null,
        detalles: details || {},
        userId: userId || null
      },
      include: { user: true }
    })
  }
}

export const auditRepository = new AuditRepository()