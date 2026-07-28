import { inventoryRepository } from './inventory.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { prisma } from '../../lib/prisma.js'

export class InventoryService {
  async summary(currentUser = null) {
    const products = await inventoryRepository.findAllProducts()
    const activeProducts = products.filter((product) => product.activo !== false)
    const unitsAvailable = activeProducts.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0), 0)
    const lowStock = activeProducts.filter((product) => product.variants.some((variant) => Number(variant.stock || 0) <= Number(product.stockMinimo || 0))).length
    const exhausted = activeProducts.filter((product) => product.variants.length > 0 && product.variants.every((variant) => Number(variant.stock || 0) === 0)).length
    const summary = { unidadesDisponibles: unitsAvailable, productosStockBajo: lowStock, productosAgotados: exhausted }
    if (currentUser?.role === 'ADMIN') {
      summary.valorInventarioCosto = activeProducts.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + Number(variant.stock || 0) * Number(product.precioCompra || 0), 0), 0)
      summary.valorPotencialVenta = activeProducts.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + Number(variant.stock || 0) * Number(product.precioVenta || 0), 0), 0)
    }
    return summary
  }
  async list(query) {
    const {
      q = '',
      activo,
      lowStock,
      page = 1,
      limit = 10
    } = query

    const allProducts = await inventoryRepository.findAllProducts()

    let filtered = allProducts

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((product) => {
        return (
          String(product.sku || '').toLowerCase().includes(term) ||
          String(product.nombre || '').toLowerCase().includes(term) ||
          String(product.descripcion || '').toLowerCase().includes(term) ||
          String(product.categoria || '').toLowerCase().includes(term) ||
          String(product.marca || '').toLowerCase().includes(term) ||
          String(product.modelo || '').toLowerCase().includes(term)
        )
      })
    }

    if (typeof activo === 'boolean') {
      filtered = filtered.filter((product) => (product.activo ?? true) === activo)
    }

    if (typeof lowStock === 'boolean' && lowStock) {
      filtered = filtered.filter((product) => {
        const stockMinimo = Number(product.stockMinimo ?? 0)
        return (product.variants || []).some((variant) => Number(variant.stock || 0) <= stockMinimo)
      })
    }

    filtered.sort((a, b) => {
      const aName = String(a.nombre || '').toLowerCase()
      const bName = String(b.nombre || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((product) => this.sanitizeInventoryItem(product))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getByProductId(productId) {
    const product = await inventoryRepository.findProductById(productId)

    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeInventoryItem(product)
  }

  async adjust(productId, payload, currentUser = null) {
    const product = await inventoryRepository.findProductById(productId)
    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    const ajustesAplicados = await prisma.$transaction(async (tx) => {
      const existentes = new Map(product.variants.map((variant) => [variant.talla, variant.stock]))
      const cambios = payload.ajustes
        .map(({ talla, cantidadNueva }) => ({
          talla,
          cantidadAnterior: Number(existentes.get(talla) || 0),
          cantidadNueva: Number(cantidadNueva)
        }))
        .filter((ajuste) => ajuste.cantidadAnterior !== ajuste.cantidadNueva)

      for (const ajuste of cambios) {
        await tx.productVariant.upsert({
          where: { productId_talla: { productId, talla: ajuste.talla } },
          create: { productId, talla: ajuste.talla, stock: ajuste.cantidadNueva },
          update: { stock: ajuste.cantidadNueva }
        })

        await tx.inventoryMovement.create({
          data: {
            productId,
            tipo: ajuste.cantidadNueva > ajuste.cantidadAnterior ? 'ENTRADA' : 'SALIDA',
            cantidad: Math.abs(ajuste.cantidadNueva - ajuste.cantidadAnterior),
            motivo: `${payload.motivo}${payload.notas ? `: ${payload.notas}` : ''} (${ajuste.talla})`
          }
        })
      }

      return cambios
    })

    const updatedProduct = await inventoryRepository.findProductById(productId)

    await logAuditEvent({
      action: 'ADJUST',
      resource: 'inventory',
      resourceId: product.id,
      details: {
        sku: product.sku || '',
        nombre: product.nombre || '',
        ajustes: ajustesAplicados,
        motivo: payload.motivo,
        notas: payload.notas || '',
        evidencia: payload.evidencia || []
      },
      currentUser
    })

    return {
      message: 'Inventario ajustado correctamente',
      item: this.sanitizeInventoryItem(updatedProduct),
      ajustes: ajustesAplicados
    }
  }

  async listMovements(query) {
    const {
      q = '',
      productId,
      tipo,
      page = 1,
      limit = 10
    } = query

    const allMovements = await inventoryRepository.findAllMovements()

    let filtered = allMovements

    if (productId) {
      filtered = filtered.filter((movement) => movement.productId === productId)
    }

    if (tipo) {
      filtered = filtered.filter((movement) => movement.tipo === tipo)
    }

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((movement) => {
        return (
          String(movement.sku || '').toLowerCase().includes(term) ||
          String(movement.productNombre || '').toLowerCase().includes(term) ||
          String(movement.motivo || '').toLowerCase().includes(term) ||
          String(movement.usuario || '').toLowerCase().includes(term) ||
          String(movement.referencia || '').toLowerCase().includes(term)
        )
      })
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()
      return bDate - aDate
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((movement) => this.sanitizeMovement(movement))

    return {
      items,
      total,
      page,
      limit
    }
  }

  sanitizeInventoryItem(product) {
    const inventario = (product.variants || []).map((variant) => ({
      talla: variant.talla,
      stock: Number(variant.stock || 0)
    }))
    const stock = inventario.reduce((total, variant) => total + variant.stock, 0)
    const stockMinimo = Number(product.stockMinimo ?? 0)

    return {
      id: product.id,
      productId: product.id,
      sku: product.sku || '',
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      unidad: product.unidad || '',
      marca: product.marca || '',
      modelo: product.modelo || '',
      imagenes: product.imagenes || [],
      inventario,
      stockIdeal: Number(product.stockIdeal || 0),
      stockMaximo: Number(product.stockMaximo || 0),
      stock,
      stockMinimo,
      lowStock: inventario.some((variant) => variant.stock <= stockMinimo),
      activo: product.activo ?? true,
      updatedAt: product.updatedAt || null
    }
  }

  sanitizeMovement(movement) {
    return {
      id: movement.id,
      productId: movement.productId || '',
      sku: movement.sku || '',
      productNombre: movement.productNombre || '',
      tipo: movement.tipo || '',
      cantidad: Number(movement.cantidad || 0),
      stockAnterior: Number(movement.stockAnterior || 0),
      stockNuevo: Number(movement.stockNuevo || 0),
      motivo: movement.motivo || '',
      referencia: movement.referencia || '',
      userId: movement.userId || '',
      usuario: movement.usuario || '',
      createdAt: movement.createdAt || null
    }
  }
}

export const inventoryService = new InventoryService()
