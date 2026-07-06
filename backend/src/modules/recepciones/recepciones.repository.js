import { prisma } from '../../lib/prisma.js'

export class RecepcionesRepository {
  async findAll() {
    return prisma.reception.findMany({
      include: { items: { include: { product: true } }, supplier: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id) {
    return prisma.reception.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, supplier: true }
    })
  }

  async findByFolio(folio) {
    return prisma.reception.findUnique({ where: { folio } })
  }

  async create({ items, ...data }) {
    return prisma.reception.create({
      data: { ...data, items: { create: items } },
      include: { items: { include: { product: true } }, supplier: true }
    })
  }

  // If `items` is provided, replaces the full item set inside a
  // transaction (delete-all + recreate), same pattern used for
  // ProductVariant — avoids partial mismatches on failure.
  async update(id, { items, ...data }) {
    if (items) {
      await prisma.$transaction([
        prisma.receptionItem.deleteMany({ where: { receptionId: id } }),
        prisma.reception.update({ where: { id }, data }),
        prisma.receptionItem.createMany({
          data: items.map((item) => ({ ...item, receptionId: id }))
        })
      ])
    } else {
      await prisma.reception.update({ where: { id }, data })
    }
    return this.findById(id)
  }

  async remove(id) {
    await prisma.reception.delete({ where: { id } })
    return true
  }

  async findSupplierById(id) {
    return prisma.supplier.findUnique({ where: { id } })
  }

  async findProductById(id) {
    return prisma.product.findUnique({ where: { id }, include: { variants: true } })
  }

  // Receiving goods can introduce a talla that doesn't have a variant
  // row yet (e.g. a new size for an existing product) — create it on
  // the fly instead of failing.
  async findOrCreateVariant(productId, talla) {
    const existing = await prisma.productVariant.findUnique({
      where: { productId_talla: { productId, talla: talla || 'Única' } }
    })
    if (existing) return existing

    return prisma.productVariant.create({
      data: { productId, talla: talla || 'Única', stock: 0 }
    })
  }

  async incrementVariantStock(variantId, delta) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } }
    })
  }

  async updateProductCosto(productId, precioCompra) {
    return prisma.product.update({ where: { id: productId }, data: { precioCompra } })
  }

  async createInventoryMovement(data) {
    return prisma.inventoryMovement.create({ data })
  }
}

export const recepcionesRepository = new RecepcionesRepository()