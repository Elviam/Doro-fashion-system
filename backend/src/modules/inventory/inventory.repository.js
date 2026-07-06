import { prisma } from '../../lib/prisma.js'

export class InventoryRepository {
  async findVariant(productId, talla) {
    return prisma.productVariant.findUnique({
      where: { productId_talla: { productId, talla } }
    })
  }

  // Atomically increments/decrements a variant's stock (delta can be negative).
  async adjustVariantStock(productId, talla, delta) {
    return prisma.productVariant.update({
      where: { productId_talla: { productId, talla } },
      data: { stock: { increment: delta } }
    })
  }

  async createMovement(data) {
    return prisma.inventoryMovement.create({ data })
  }

  async findAllMovements() {
    return prisma.inventoryMovement.findMany({
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export const inventoryRepository = new InventoryRepository()