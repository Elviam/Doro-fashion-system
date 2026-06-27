import { productsRepository } from './products.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function normalizeSku(value) {
  return String(value || '').trim().toUpperCase()
}

export class ProductsService {
  async list(query) {
    const {
      q = '',
      activo,
      page = 1,
      limit = 10
    } = query

    const allProducts = await productsRepository.findAll()

    let filtered = allProducts

    if (q) {
      const term = q.trim().toLowerCase()

      filtered = filtered.filter((product) => {
        return (
          String(product.sku || '').toLowerCase().includes(term) ||
          String(product.nombre || '').toLowerCase().includes(term) ||
          String(product.descripcion || '').toLowerCase().includes(term) ||
          String(product.categoria || '').toLowerCase().includes(term) ||
          String(product.unidad || '').toLowerCase().includes(term) ||
          String(product.marca || '').toLowerCase().includes(term) ||
          String(product.modelo || '').toLowerCase().includes(term)
        )
      })
    }

    if (typeof activo === 'boolean') {
      filtered = filtered.filter((product) => (product.activo ?? true) === activo)
    }

    filtered.sort((a, b) => {
      const aName = String(a.nombre || '').toLowerCase()
      const bName = String(b.nombre || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    const total = filtered.length
    const start = (page - 1) * limit
    const end = start + limit
    const items = filtered.slice(start, end).map((product) => this.sanitizeProduct(product))

    return {
      items,
      total,
      page,
      limit
    }
  }

  async getById(id) {
    const product = await productsRepository.findById(id)

    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    return this.sanitizeProduct(product)
  }

  async create(payload, currentUser = null) {
    const normalizedSku = normalizeSku(payload.sku)

    const existingBySku = await productsRepository.findBySku(normalizedSku)

    if (existingBySku) {
      const error = new Error('El SKU del producto ya existe')
      error.statusCode = 409
      throw error
    }

    const data = {
      sku: normalizedSku,
      nombre: payload.nombre.trim(),
      descripcion: normalizeOptionalText(payload.descripcion) || '',
      categoria: normalizeOptionalText(payload.categoria) || '',
      departamento: normalizeOptionalText(payload.departamento) || '',
      unidad: normalizeOptionalText(payload.unidad) || '',
      marca: normalizeOptionalText(payload.marca) || '',
      modelo: normalizeOptionalText(payload.modelo) || '',
      supplierId: normalizeOptionalText(payload.supplierId) || '',
      supplierNombre: normalizeOptionalText(payload.supplierNombre) || '',
      precioCompra: Number(payload.precioCompra ?? 0),
      precioVenta: Number(payload.precioVenta ?? 0),
      stock: Number(payload.stock ?? 0),
      stockMinimo: Number(payload.stockMinimo ?? 0),
      imagen: payload.imagen || null,
      inventario: Array.isArray(payload.inventario) ? payload.inventario : [],
      activo: payload.activo ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const created = await productsRepository.create(data)
    const sanitized = this.sanitizeProduct(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'products',
      resourceId: created.id,
      details: {
        sku: sanitized.sku,
        nombre: sanitized.nombre,
        stock: sanitized.stock,
        stockMinimo: sanitized.stockMinimo,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const currentProduct = await productsRepository.findById(id)

    if (!currentProduct) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    if (payload.sku !== undefined) {
      const normalizedSku = normalizeSku(payload.sku)

      if (normalizedSku && normalizedSku !== String(currentProduct.sku || '').toUpperCase()) {
        const existingBySku = await productsRepository.findBySku(normalizedSku)

        if (existingBySku && existingBySku.id !== id) {
          const error = new Error('El SKU del producto ya existe')
          error.statusCode = 409
          throw error
        }
      }
    }

    const data = {
      updatedAt: new Date().toISOString()
    }

    if (payload.sku !== undefined) data.sku = normalizeSku(payload.sku)
    if (payload.nombre !== undefined) data.nombre = payload.nombre.trim()
    if (payload.descripcion !== undefined) data.descripcion = normalizeOptionalText(payload.descripcion) || ''
    if (payload.categoria !== undefined) data.categoria = normalizeOptionalText(payload.categoria) || ''
    if (payload.departamento !== undefined) data.departamento = normalizeOptionalText(payload.departamento) || ''
    if (payload.unidad !== undefined) data.unidad = normalizeOptionalText(payload.unidad) || ''
    if (payload.marca !== undefined) data.marca = normalizeOptionalText(payload.marca) || ''
    if (payload.modelo !== undefined) data.modelo = normalizeOptionalText(payload.modelo) || ''
    if (payload.supplierId !== undefined) data.supplierId = normalizeOptionalText(payload.supplierId) || ''
    if (payload.supplierNombre !== undefined) data.supplierNombre = normalizeOptionalText(payload.supplierNombre) || ''
    if (payload.precioCompra !== undefined) data.precioCompra = Number(payload.precioCompra)
    if (payload.precioVenta !== undefined) data.precioVenta = Number(payload.precioVenta)
    if (payload.imagen !== undefined) data.imagen = payload.imagen || null
    if (payload.inventario !== undefined) data.inventario = Array.isArray(payload.inventario) ? payload.inventario : []
    if (payload.stock !== undefined) data.stock = Number(payload.stock)
    if (payload.stockMinimo !== undefined) data.stockMinimo = Number(payload.stockMinimo)
    if (payload.activo !== undefined) data.activo = payload.activo

    const updated = await productsRepository.update(id, data)
    const sanitized = this.sanitizeProduct(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'products',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        sku: sanitized.sku,
        nombre: sanitized.nombre,
        stock: sanitized.stock,
        stockMinimo: sanitized.stockMinimo,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async toggleActive(id, activo, currentUser = null) {
    const currentProduct = await productsRepository.findById(id)

    if (!currentProduct) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    const updated = await productsRepository.update(id, {
      activo,
      updatedAt: new Date().toISOString()
    })

    const sanitized = this.sanitizeProduct(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'products',
      resourceId: updated.id,
      details: {
        sku: sanitized.sku,
        nombre: sanitized.nombre,
        activo: sanitized.activo
      },
      currentUser
    })

    return sanitized
  }

  async remove(id, currentUser = null) {
    const currentProduct = await productsRepository.findById(id)

    if (!currentProduct) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }

    await productsRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'products',
      resourceId: id,
      details: {
        sku: currentProduct.sku || '',
        nombre: currentProduct.nombre || ''
      },
      currentUser
    })

    return {
      success: true
    }
  }

  sanitizeProduct(product) {
    return {
      id: product.id,
      sku: product.sku || '',
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      departamento: product.departamento || '',
      unidad: product.unidad || '',
      marca: product.marca || '',
      modelo: product.modelo || '',
      supplierId: product.supplierId || '',
      supplierNombre: product.supplierNombre || '',
      precioCompra: Number(product.precioCompra || 0),
      precioVenta: Number(product.precioVenta || 0),
      stock: Number(product.stock || 0),
      stockMinimo: Number(product.stockMinimo || 0),
      imagen: product.imagen || null,
      inventario: Array.isArray(product.inventario) ? product.inventario : [],
      activo: product.activo ?? true,
      createdAt: product.createdAt || null,
      updatedAt: product.updatedAt || null
    }
  }
}

export const productsService = new ProductsService()