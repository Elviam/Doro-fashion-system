import { prisma } from '../../lib/prisma.js'

export class ClientsRepository {
  async findAll() {
    return prisma.client.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { sales: true } },
        sales: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }

  async findById(id) {
    return prisma.client.findUnique({ where: { id } })
  }

  async findByEmail(email) {
    return prisma.client.findUnique({ where: { email } })
  }

  async findByUserId(userId) {
    return prisma.client.findUnique({ where: { userId } })
  }

  async findByRfc(rfc) {
    return prisma.client.findFirst({ where: { rfc } })
  }

  async create(data) {
    return prisma.client.create({ data })
  }

  async update(id, data) {
    return prisma.client.update({ where: { id }, data })
  }

  async remove(id) {
    await prisma.client.delete({ where: { id } })
    return true
  }
}

export const clientsRepository = new ClientsRepository()
