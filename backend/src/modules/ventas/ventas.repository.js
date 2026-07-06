import { prisma } from '../../lib/prisma.js'

export class VentasRepository {
  async findAll() {
    return prisma.sale.findMany({
      include: { items: true, cliente: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: { items: true, cliente: true }
    })
  }

  async create({ items, ...data }) {
    return prisma.sale.create({
      data: { ...data, items: { create: items } },
      include: { items: true, cliente: true }
    })
  }

  async update(id, data) {
    return prisma.sale.update({
      where: { id },
      data,
      include: { items: true, cliente: true }
    })
  }
}

export const ventasRepository = new VentasRepository()