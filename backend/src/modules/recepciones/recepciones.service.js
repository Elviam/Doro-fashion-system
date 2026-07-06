import { recepcionesRepository } from './recepciones.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

// Merges duplicate productId+talla rows into one, summing cantidad and
// weighting costoUnitario by quantity — matches "one row per product,
// quantity increases" business rule.
function dedupeItems(rawItems) {
  const merged = new Map()

  for (const item of rawItems) {
    const talla = item.talla || 'Única'
    const key = `${item.productId}::${talla}`
    const cantidad = Number(item.cantidad)
    const costoUnitario = round2(item.costoUnitario)

    if (merged.has(key)) {
      const existing = merged.get(key)
      const nuevaCantidad = existing.cantidad + cantidad
      const costoPonderado = round2(
        (existing.cantidad * existing.costoUnitario + cantidad * costoUnitario) / nuevaCantidad
      )
      merged.set(key, { ...existing, cantidad: nuevaCantidad, costoUnitario: costoPonderado })
    } else {
      merged.set(key, { productId: item.productId, talla, cantidad, costoUnitario })
    }
  }

  return [...merged.values()]
}

export class RecepcionesService {
  async getNextFolio() {
    const all = await recepcionesRepository.findAll()
    const numeros = all
      .map((r) => {
        const match = String(r.folio || '').match(/^RCP-(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => n > 0)

    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1
    return `RCP-${String(siguiente).padStart(3, '0')}`
  }

  async list(query) {
    const { q = '', status, fechaDesde, page = 1, limit = 10 } = query

    const all = await recepcionesRepository.findAll()
    let filtered = all

    if (status) filtered = filtered.filter((r) => r.estado === status)

    if (q) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((r) => (
        String(r.folio || '').toLowerCase().includes(term) ||
        String(r.facturaProveedor || '').toLowerCase().includes(term) ||
        String(r.supplier?.nombre || '').toLowerCase().includes(term) ||
        String(r.comentarios || '').toLowerCase().includes(term) ||
        r.items.some((item) => String(item.product?.sku || '').toLowerCase().includes(term))
      ))
    }

    if (fechaDesde) {
      const tiempoDesde = new Date(fechaDesde).getTime()
      filtered = filtered.filter((r) => new Date(r.createdAt || 0).getTime() >= tiempoDesde)
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit).map((r) => this.sanitizeRecepcion(r))

    return { items, total, page, limit }
  }

  async getById(id) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }
    return this.sanitizeRecepcion(recepcion)
  }

  async create(payload, currentUser = null) {
    const folio = payload.folio?.trim() || await this.getNextFolio()

    const existingByFolio = await recepcionesRepository.findByFolio(folio)
    if (existingByFolio) {
      const error = new Error('El folio de la recepción ya existe')
      error.statusCode = 409
      throw error
    }

    const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)
    if (!supplier) {
      const error = new Error('Proveedor no encontrado')
      error.statusCode = 404
      throw error
    }

    const dedupedItems = dedupeItems(payload.items)
    let total = 0

    for (const item of dedupedItems) {
      const product = await recepcionesRepository.findProductById(item.productId)
      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productId}`)
        error.statusCode = 404
        throw error
      }
      total += round2(item.cantidad * item.costoUnitario)
    }

    const data = {
      supplierId: supplier.id,
      facturaProveedor: normalizeOptionalText(payload.facturaProveedor) || null,
      fecha: new Date(payload.fecha),
      folio,
      comentarios: normalizeOptionalText(payload.comentarios) || null,
      estado: 'BORRADOR',
      total: round2(total),
      createdBy: currentUser?.usuario || null,
      items: dedupedItems,
    }

    const created = await recepcionesRepository.create(data)
    const sanitized = this.sanitizeRecepcion(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'recepciones',
      resourceId: created.id,
      details: {
        folio: sanitized.folio,
        facturaProveedor: sanitized.facturaProveedor,
        supplierNombre: sanitized.supplierNombre,
        status: sanitized.status,
        itemsCount: sanitized.items.length,
        total: sanitized.total,
      },
      currentUser,
    })

    return sanitized
  }

  async update(id, payload, currentUser = null) {
    const current = await recepcionesRepository.findById(id)
    if (!current) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (current.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes editar recepciones en borrador')
      error.statusCode = 400
      throw error
    }

    const data = {}

    if (payload.folio !== undefined && payload.folio !== current.folio) {
      const existingByFolio = await recepcionesRepository.findByFolio(payload.folio)
      if (existingByFolio && existingByFolio.id !== id) {
        const error = new Error('El folio de la recepción ya existe')
        error.statusCode = 409
        throw error
      }
      data.folio = payload.folio.trim()
    }

    if (payload.supplierId !== undefined) {
      const supplier = await recepcionesRepository.findSupplierById(payload.supplierId)
      if (!supplier) {
        const error = new Error('Proveedor no encontrado')
        error.statusCode = 404
        throw error
      }
      data.supplierId = supplier.id
    }

    if (payload.facturaProveedor !== undefined) {
      data.facturaProveedor = normalizeOptionalText(payload.facturaProveedor) || null
    }
    if (payload.fecha !== undefined) data.fecha = new Date(payload.fecha)
    if (payload.comentarios !== undefined) data.comentarios = normalizeOptionalText(payload.comentarios) || null

    if (payload.items !== undefined) {
      const dedupedItems = dedupeItems(payload.items)
      let total = 0

      for (const item of dedupedItems) {
        const product = await recepcionesRepository.findProductById(item.productId)
        if (!product) {
          const error = new Error(`Producto no encontrado: ${item.productId}`)
          error.statusCode = 404
          throw error
        }
        total += round2(item.cantidad * item.costoUnitario)
      }

      data.items = dedupedItems
      data.total = round2(total)
    }

    const updated = await recepcionesRepository.update(id, data)
    const sanitized = this.sanitizeRecepcion(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'recepciones',
      resourceId: updated.id,
      details: {
        changes: Object.keys(payload),
        folio: sanitized.folio,
        status: sanitized.status,
        itemsCount: sanitized.items.length,
        total: sanitized.total,
      },
      currentUser,
    })

    return sanitized
  }

  async confirm(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes confirmar recepciones en borrador')
      error.statusCode = 400
      throw error
    }

    if (!recepcion.items || recepcion.items.length === 0) {
      const error = new Error('La recepción no tiene partidas')
      error.statusCode = 400
      throw error
    }

    const movements = []

    for (const item of recepcion.items) {
      const variant = await recepcionesRepository.findOrCreateVariant(item.productId, item.talla)
      const stockAnterior = variant.stock
      const stockNuevo = stockAnterior + item.cantidad

      await recepcionesRepository.incrementVariantStock(variant.id, item.cantidad)
      await recepcionesRepository.updateProductCosto(item.productId, item.costoUnitario)

      const movement = await recepcionesRepository.createInventoryMovement({
        productId: item.productId,
        tipo: 'ENTRADA',
        cantidad: item.cantidad,
        motivo: `Recepción ${recepcion.folio}`,
      })

      movements.push({ ...this.sanitizeMovement(movement), talla: item.talla, stockAnterior, stockNuevo })
    }

    const updated = await recepcionesRepository.update(recepcion.id, {
      estado: 'CONFIRMADA',
      confirmedAt: new Date(),
      confirmedBy: currentUser?.usuario || null,
    })

    await logAuditEvent({
      action: 'CONFIRM',
      resource: 'recepciones',
      resourceId: updated.id,
      details: {
        folio: updated.folio || '',
        supplierNombre: updated.supplier?.nombre || '',
        itemsCount: updated.items.length,
        total: Number(updated.total || 0),
      },
      currentUser,
    })

    return { message: 'Recepción confirmada correctamente', item: this.sanitizeRecepcion(updated), movements }
  }

  // Reverses stock for a confirmed reception. History is preserved —
  // the row stays, just flagged CANCELADA, never deleted.
  async cancelar(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.estado !== 'CONFIRMADA') {
      const error = new Error('Solo puedes cancelar recepciones confirmadas')
      error.statusCode = 400
      throw error
    }

    for (const item of recepcion.items) {
      const variant = await recepcionesRepository.findOrCreateVariant(item.productId, item.talla)
      const stockAnterior = variant.stock
      const stockNuevo = Math.max(0, stockAnterior - item.cantidad)

      await recepcionesRepository.incrementVariantStock(variant.id, stockNuevo - stockAnterior)
      await recepcionesRepository.createInventoryMovement({
        productId: item.productId,
        tipo: 'SALIDA',
        cantidad: item.cantidad,
        motivo: `Cancelación recepción ${recepcion.folio}`,
      })
    }

    const updated = await recepcionesRepository.update(recepcion.id, {
      estado: 'CANCELADA',
      canceledAt: new Date(),
      canceledBy: currentUser?.usuario || null,
    })

    await logAuditEvent({
      action: 'CANCEL',
      resource: 'recepciones',
      resourceId: updated.id,
      details: { folio: updated.folio || '', total: Number(updated.total || 0) },
      currentUser,
    })

    return { message: 'Recepción cancelada correctamente', item: this.sanitizeRecepcion(updated) }
  }

  async remove(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes eliminar recepciones en borrador. Usa "Cancelar" para revertir una recepción confirmada.')
      error.statusCode = 400
      throw error
    }

    await recepcionesRepository.remove(id)

    await logAuditEvent({
      action: 'DELETE',
      resource: 'recepciones',
      resourceId: id,
      details: { folio: recepcion.folio || '', supplierNombre: recepcion.supplier?.nombre || '' },
      currentUser,
    })

    return { success: true }
  }

  sanitizeRecepcion(recepcion) {
    const piezasTotales = (recepcion.items || []).reduce((sum, i) => sum + Number(i.cantidad || 0), 0)

    return {
      id: recepcion.id,
      supplierId: recepcion.supplierId || '',
      supplierNombre: recepcion.supplier?.nombre || '',
      facturaProveedor: recepcion.facturaProveedor || '',
      fecha: recepcion.fecha || '',
      folio: recepcion.folio || '',
      comentarios: recepcion.comentarios || '',
      status: recepcion.estado || 'BORRADOR',
      items: (recepcion.items || []).map((item) => ({
        productId: item.productId || '',
        sku: item.product?.sku || '',
        productNombre: item.product?.nombre || '',
        imagen: item.product?.imagen || '',
        talla: item.talla || '',
        cantidad: Number(item.cantidad || 0),
        costoUnitario: Number(item.costoUnitario || 0),
        subtotal: round2(Number(item.cantidad || 0) * Number(item.costoUnitario || 0)),
      })),
      piezasTotales,
      total: Number(recepcion.total || 0),
      confirmedAt: recepcion.confirmedAt || null,
      recibidoPor: recepcion.confirmedBy || '',
      canceledAt: recepcion.canceledAt || null,
      canceledBy: recepcion.canceledBy || '',
      createdBy: recepcion.createdBy || '',
      createdAt: recepcion.createdAt || null,
      updatedAt: recepcion.updatedAt || null,
    }
  }

  sanitizeMovement(movement) {
    return {
      id: movement.id,
      productId: movement.productId || '',
      tipo: movement.tipo || '',
      cantidad: Number(movement.cantidad || 0),
      motivo: movement.motivo || '',
      createdAt: movement.createdAt || null,
    }
  }
}

export const recepcionesService = new RecepcionesService()