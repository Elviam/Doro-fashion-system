import { prisma } from '../../lib/prisma.js'

export class ProductsRepository {
  async findAll() {
    return prisma.product.findMany({
      include: { variants: true, supplier: true },
      orderBy: { nombre: 'asc' }
    })
  }

  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      include: { variants: true, supplier: true }
    })
  }

  async findBySku(sku) {
    return prisma.product.findUnique({
      where: { sku },
      include: { variants: true, supplier: true }
    })
  }

  async findSupplierById(supplierId) {
    return prisma.supplier.findUnique({ where: { id: supplierId } })
  }

  // Creates a product together with its initial variants in one write.
  async create({ variantes, ...data }) {
    return prisma.product.create({
      data: {
        ...data,
        variants: { create: variantes }
      },
      include: { variants: true, supplier: true }
    })
  }

  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      include: { variants: true, supplier: true }
    })
  }

  // Replaces the full variant set (delete-all + recreate) inside a
  // transaction, so a partial failure never leaves mismatched rows.
  async replaceVariants(productId, variantes) {
    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.productVariant.createMany({
        data: variantes.map((v) => ({ ...v, productId }))
      })
    ])
    return this.findById(productId)
  }

  async remove(id) {
    await prisma.product.delete({ where: { id } })
    return true
  }
}

export const productsRepository = new ProductsRepository()