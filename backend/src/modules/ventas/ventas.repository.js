import { prisma } from '../../lib/prisma.js'

export class VentasRepository {
  async list({ where = {}, summaryWhere = {}, skip = 0, take = 10 } = {}) {
    const [items, total, estados] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        include: { items: true, cliente: true, shippingEvents: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' }, skip, take,
      }),
      prisma.sale.count({ where }),
      prisma.sale.groupBy({ by: ['estado'], where: summaryWhere, _count: { _all: true } }),
    ])
    return { items, total, estados }
  }

  async findAll() {
    return prisma.sale.findMany({
      include: { items: true, cliente: true, shippingEvents: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: { items: true, cliente: true, shippingEvents: { orderBy: { createdAt: 'asc' } } }
    })
  }

  async create({ items, ...data }) {
    return prisma.sale.create({
      data: { ...data, items: { create: items } },
      include: { items: true, cliente: true, shippingEvents: { orderBy: { createdAt: 'asc' } } }
    })
  }

  async update(id, data) {
    return prisma.sale.update({
      where: { id },
      data,
      include: { items: true, cliente: true, shippingEvents: { orderBy: { createdAt: 'asc' } } }
    })
  }
}

export const ventasRepository = new VentasRepository()
