import { productsRepository } from './products.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { TALLAS_POR_CATEGORIA } from './products.constants.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

// La unidad de medida ya no la captura el usuario: todo el catálogo
// de D'oro son piezas (no hay calzado ni productos por par/caja).
function inferUnidad() {
  return 'Pieza'
}

// Genera un SKU corto, legible y sin colisiones cuando el cliente
// no proporciona uno, cumpliendo con la promesa de la interfaz de
// generar el SKU automáticamente.
async function generateUniqueSku(categoria) {
  const prefix = String(categoria || 'PROD').slice(0, 3).toUpperCase()

  let sku
  let exists = true

  while (exists) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    sku = `${prefix}-${suffix}`
    exists = await productsRepository.findBySku(sku)
  }

  return sku
}

function normalizeSku(value) {
  return String(value || '').trim().toUpperCase()
}

// Cada producto debe tener al menos una variante. Si el cliente no envía
// tallas, se utiliza una única variante llamada "Única", usando el campo
// `stock` de nivel superior heredado para mantener la compatibilidad con
// versiones anteriores.
function normalizeVariantes(inventario, fallbackStock = 0, categoria) {
  if (Array.isArray(inventario) && inventario.length > 0) {
    const tallas = inventario.map((v) => v.talla)
    const duplicadas = tallas.filter((t, i) => tallas.indexOf(t) !== i)

    if (duplicadas.length > 0) {
      const error = new Error(`Talla(s) duplicada(s) en el inventario: ${[...new Set(duplicadas)].join(', ')}`)
      error.statusCode = 400
      throw error
    }

    return inventario.map((v) => ({ talla: v.talla, stock: Number(v.stock ?? 0) }))
  }

  const tallaPredeterminada = TALLAS_POR_CATEGORIA[categoria]?.[0]
  if (!tallaPredeterminada) {
    const error = new Error('La categoría del producto debe tener al menos una talla válida')
    error.statusCode = 400
    throw error
  }

  return [{ talla: tallaPredeterminada, stock: Number(fallbackStock ?? 0) }]
}

function computeTotalStock(variants = []) {
  return variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
}

const CAMPOS_NUMERICOS_AUDITORIA = new Set([
  'precioCompra', 'precioVenta', 'stockMinimo', 'stockIdeal', 'stockMaximo'
])

function normalizarValorAuditoria(campo, valor) {
  if (valor === null || valor === undefined) return null
  if (CAMPOS_NUMERICOS_AUDITORIA.has(campo)) return Number(valor)
  if (Array.isArray(valor)) return valor.map((item) => normalizarValorAuditoria(campo, item))
  if (typeof valor?.toNumber === 'function') return valor.toNumber()
  return valor
}

function sonIgualesParaAuditoria(campo, anterior, nuevo) {
  return JSON.stringify(normalizarValorAuditoria(campo, anterior)) === JSON.stringify(normalizarValorAuditoria(campo, nuevo))
}

function construirCambiosProducto(anterior, datosActualizados, inventarioNuevo) {
  const campos = Object.keys(datosActualizados).filter((campo) => campo !== 'updatedAt' && campo !== 'unidad')
  const cambios = campos
    .map((campo) => ({ campo, antes: normalizarValorAuditoria(campo, anterior[campo]), despues: normalizarValorAuditoria(campo, datosActualizados[campo]) }))
    .filter(({ campo, antes, despues }) => !sonIgualesParaAuditoria(campo, antes, despues))

  if (inventarioNuevo !== undefined && !sonIgualesParaAuditoria('inventario', anterior.variants, inventarioNuevo)) {
    cambios.push({ campo: 'inventario', antes: anterior.variants || [], despues: inventarioNuevo })
  }

  return cambios
}

export class ProductsService {
  async list(query, currentUser = null) {
    const { q = '', activo, page = 1, limit = 10 } = query

    const allProducts = await productsRepository.findAll()
    let filtered = allProducts

    if (q) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((product) => (
        String(product.sku || '').toLowerCase().includes(term) ||
        String(product.nombre || '').toLowerCase().includes(term) ||
        String(product.descripcion || '').toLowerCase().includes(term) ||
        String(product.categoria || '').toLowerCase().includes(term)
      ))
    }

    if (typeof activo === 'boolean') {
      filtered = filtered.filter((product) => (product.activo ?? true) === activo)
    }

    filtered.sort((a, b) =>
      String(a.nombre || '').toLowerCase().localeCompare(String(b.nombre || '').toLowerCase())
    )

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit).map((p) => this.sanitizeProduct(p, { includeFinancial: currentUser?.role === 'ADMIN' }))

    return { items, total, page, limit }
  }

  async getById(id, currentUser = null) {
    const product = await productsRepository.findById(id)
    if (!product) {
      const error = new Error('Producto no encontrado')
      error.statusCode = 404
      throw error
    }
    return this.sanitizeProduct(product, { includeFinancial: currentUser?.role === 'ADMIN' })
  }

  async create(payload, currentUser = null) {
    const normalizedSku = payload.sku
      ? normalizeSku(payload.sku)
      : await generateUniqueSku(payload.categoria)

    const existingBySku = await productsRepository.findBySku(normalizedSku)
    if (existingBySku) {
      const error = new Error('El SKU del producto ya existe')
      error.statusCode = 409
      throw error
    }

    if (payload.supplierId) {
      const supplier = await productsRepository.findSupplierById(payload.supplierId)
      if (!supplier) {
        const error = new Error('El proveedor especificado no existe')
        error.statusCode = 404
        throw error
      }
    }

    const variantes = normalizeVariantes(payload.inventario, payload.stock, payload.categoria)

   const data = {
      sku: normalizedSku,
      nombre: payload.nombre.trim(),
      descripcion: normalizeOptionalText(payload.descripcion) || '',
      categoria: payload.categoria,
      departamento: payload.departamento,
      unidad: inferUnidad(),
      supplierId: payload.supplierId || null,
      precioCompra: Number(payload.precioCompra ?? 0),
      precioVenta: Number(payload.precioVenta ?? 0),
      stockMinimo: Number(payload.stockMinimo),
      stockIdeal: Number(payload.stockIdeal ?? 0),
      stockMaximo: Number(payload.stockMaximo ?? 0),
      imagenes: Array.isArray(payload.imagenes) ? payload.imagenes : [],
      activo: payload.activo ?? true,
      variantes
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
        descripcion: sanitized.descripcion,
        categoria: sanitized.categoria,
        departamento: sanitized.departamento,
        precioCompra: sanitized.precioCompra,
        precioVenta: sanitized.precioVenta,
        stockMinimo: sanitized.stockMinimo,
        stockIdeal: sanitized.stockIdeal,
        stockMaximo: sanitized.stockMaximo,
        activo: sanitized.activo,
        imagenes: sanitized.imagenes
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

    if (payload.supplierId) {
      const supplier = await productsRepository.findSupplierById(payload.supplierId)
      if (!supplier) {
        const error = new Error('El proveedor especificado no existe')
        error.statusCode = 404
        throw error
      }
    }

    const categoriaFinal = payload.categoria ?? currentProduct.categoria
    const inventarioAValidar = payload.inventario ?? (
      payload.categoria !== undefined ? currentProduct.variants : null
    )

    if (inventarioAValidar) {
      const tallasValidas = TALLAS_POR_CATEGORIA[categoriaFinal] || []
      const tallasInvalidas = inventarioAValidar
        .map((variante) => variante.talla)
        .filter((talla) => !tallasValidas.includes(talla))

      if (tallasInvalidas.length > 0) {
        const error = new Error(`Las tallas ${[...new Set(tallasInvalidas)].join(', ')} no son válidas para la categoría ${categoriaFinal}`)
        error.statusCode = 400
        throw error
      }
    }

    const data = { updatedAt: new Date() }

    if (payload.sku !== undefined) data.sku = normalizeSku(payload.sku)
    if (payload.nombre !== undefined) data.nombre = payload.nombre.trim()
    if (payload.descripcion !== undefined) data.descripcion = normalizeOptionalText(payload.descripcion) || ''
    if (payload.categoria !== undefined) {
      data.categoria = payload.categoria
      data.unidad = inferUnidad()
    }
    if (payload.departamento !== undefined) data.departamento = payload.departamento
    if (payload.supplierId !== undefined) data.supplierId = payload.supplierId || null
    if (payload.precioCompra !== undefined) data.precioCompra = Number(payload.precioCompra)
    if (payload.precioVenta !== undefined) data.precioVenta = Number(payload.precioVenta)
    if (payload.imagenes !== undefined) data.imagenes = Array.isArray(payload.imagenes) ? payload.imagenes : []
    if (payload.stockMinimo !== undefined) data.stockMinimo = Number(payload.stockMinimo)
    if (payload.stockIdeal !== undefined) data.stockIdeal = Number(payload.stockIdeal)
    if (payload.stockMaximo !== undefined) data.stockMaximo = Number(payload.stockMaximo)
    if (payload.activo !== undefined) data.activo = payload.activo
    // Saving the edit form acknowledges the latest purchase-cost review,
    // even when the administrator keeps the same sale price.
    if (currentProduct.pendingPriceReview) data.pendingPriceReview = false
    const cambios = construirCambiosProducto(currentProduct, data, payload.inventario)
    if (cambios.length === 0) return this.sanitizeProduct(currentProduct)
    await productsRepository.update(id, data)

    if (payload.inventario !== undefined) {
      const variantes = normalizeVariantes(payload.inventario, 0, categoriaFinal)
      await productsRepository.replaceVariants(id, variantes)
    }

    const updated = await productsRepository.findById(id)
    const sanitized = this.sanitizeProduct(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'products',
      resourceId: updated.id,
      details: {
        cambios,
        sku: sanitized.sku,
        nombre: sanitized.nombre,
        activo: sanitized.activo,
        categoria: sanitized.categoria,
        departamento: sanitized.departamento,
        imagenes: sanitized.imagenes
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

    const updated = await productsRepository.update(id, { activo, updatedAt: new Date() })
    const sanitized = this.sanitizeProduct(updated)

    await logAuditEvent({
      action: 'TOGGLE_ACTIVE',
      resource: 'products',
      resourceId: updated.id,
      details: { sku: sanitized.sku, nombre: sanitized.nombre, activo: sanitized.activo },
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

    const productoEliminado = this.sanitizeProduct(currentProduct)
    const dependencias = await productsRepository.getDeletionDependencies(id)
    if (dependencias.ventas > 0 || dependencias.recepciones > 0) {
      const error = new Error('No se puede eliminar un producto con ventas o recepciones registradas. Puedes desactivarlo para retirarlo del catálogo.')
      error.statusCode = 409
      throw error
    }

    await productsRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'products',
      resourceId: id,
      details: {
        sku: productoEliminado.sku,
        nombre: productoEliminado.nombre,
        descripcion: productoEliminado.descripcion,
        categoria: productoEliminado.categoria,
        departamento: productoEliminado.departamento,
        precioCompra: productoEliminado.precioCompra,
        precioVenta: productoEliminado.precioVenta,
        stock: productoEliminado.stock,
        stockMinimo: productoEliminado.stockMinimo,
        stockIdeal: productoEliminado.stockIdeal,
        stockMaximo: productoEliminado.stockMaximo,
        activo: productoEliminado.activo,
        // El producto deja de existir, por lo que la auditoría necesita su propia
        // copia de las referencias visuales para poder identificarlo después.
        imagenes: [...(productoEliminado.imagenes || [])],
        inventario: productoEliminado.inventario
      },
      currentUser
    })

    return { success: true }
  }

  sanitizeProduct(product, { includeFinancial = true } = {}) {
    const inventario = (product.variants || []).map((v) => ({
      id: v.id,
      talla: v.talla,
      stock: Number(v.stock || 0)
    }))

    return {
      id: product.id,
      sku: product.sku || '',
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria || '',
      departamento: product.departamento || '',
      unidad: product.unidad || '',
      ...(includeFinancial ? { supplierId: product.supplierId || '', supplierNombre: product.supplier?.nombre || '' } : {}),
      ...(includeFinancial ? {
        precioCompra: Number(product.precioCompra || 0),
        precioCompraAnterior: product.precioCompraAnterior === null || product.precioCompraAnterior === undefined
          ? null
          : Number(product.precioCompraAnterior),
        pendingPriceReview: product.pendingPriceReview ?? false,
        purchasePriceChangedAt: product.purchasePriceChangedAt || null,
      } : {}),
      precioVenta: Number(product.precioVenta || 0),
      stock: computeTotalStock(product.variants || []),
      stockMinimo: Number(product.stockMinimo ?? 0),
      stockIdeal: Number(product.stockIdeal || 0),
      stockMaximo: Number(product.stockMaximo || 0),
      imagenes: product.imagenes || [],
      inventario,
      activo: product.activo ?? true,
      createdAt: product.createdAt || null,
      updatedAt: product.updatedAt || null
    }
  }
}

export const productsService = new ProductsService()
