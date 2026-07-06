import { prisma } from '../../lib/prisma.js'

export class SuppliersRepository {
  async findAll() {
    return prisma.supplier.findMany({ orderBy: { nombre: 'asc' } })
  }

  async findById(id) {
    return prisma.supplier.findUnique({ where: { id } })
  }

  async findByEmail(email) {
    return prisma.supplier.findFirst({ where: { email } })
  }

  async findByRfc(rfc) {
    return prisma.supplier.findFirst({ where: { rfc } })
  }

  async create(data) {
    return prisma.supplier.create({ data })
  }

  async update(id, data) {
    return prisma.supplier.update({ where: { id }, data })
  }

  async remove(id) {
    await prisma.supplier.delete({ where: { id } })
    return true
  }
}

export const suppliersRepository = new SuppliersRepository() 