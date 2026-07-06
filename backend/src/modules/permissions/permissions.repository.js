import { prisma } from '../../lib/prisma.js'

export class PermissionsRepository {
  async findAll() {
    return prisma.permission.findMany({
      orderBy: { code: 'asc' }
    })
  }

  async findById(id) {
    return prisma.permission.findUnique({ where: { id } })
  }

  async findByCode(code) {
    return prisma.permission.findUnique({ where: { code } })
  }

  async create(data) {
    return prisma.permission.create({ data })
  }

  // Reemplaza al patrón Firestore doc(id).set(data, { merge: true }).
  // Como en Postgres el id es un cuid autogenerado, "upsert por id" solo
  // tiene sentido si ya conoces el id. Para seeds por `code` (que es lo que
  // usaban tus scripts), usa upsertByCode en su lugar.
  async createWithId(id, data) {
    return prisma.permission.upsert({
      where: { id },
      update: data,
      create: { id, ...data }
    })
  }

  async upsertByCode(code, data) {
    return prisma.permission.upsert({
      where: { code },
      update: data,
      create: { code, ...data }
    })
  }

  async update(id, data) {
    return prisma.permission.update({ where: { id }, data })
  }

  async remove(id) {
    await prisma.permission.delete({ where: { id } })
    return true
  }
}

export const permissionsRepository = new PermissionsRepository()