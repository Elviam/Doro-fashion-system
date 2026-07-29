import { recepcionesRepository } from './recepciones.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { prisma } from '../../lib/prisma.js'

function normalizeOptionalText(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? '' : trimmed
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function formatUserName(user) {
  if (!user) return ''
  return [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.usuario || ''
}

function assertNotSupplierOrder(recepcion) {
  if (recepcion.origen === 'REABASTECIMIENTO') {
    const error = new Error('Los pedidos a proveedor solo admiten las acciones configuradas para ese módulo')
    error.statusCode = 403
    throw error
  }
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
  constructor({ repository = recepcionesRepository, prismaClient = prisma, auditLogger = logAuditEvent } = {}) {
    this.repository = repository
    this.prisma = prismaClient
    this.auditLogger = auditLogger
  }

  async getNextFolio() {
    const all = await this.repository.findAll()
    const numeros = all
      .map((r) => {
        const match = String(r.folio || '').match(/^RCP-(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n) => n > 0)

    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1
    return `RCP-${String(siguiente).padStart(3, '0')}`
  }

  async list(query, currentUser = null) {
    const { q = '', status, origen, fechaDesde, page = 1, limit = 10 } = query

    const all = await recepcionesRepository.findAll()
    let filtered = all

    if (status) filtered = filtered.filter((r) => r.estado === status)
    if (origen) filtered = filtered.filter((r) => r.origen === origen)

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
    const pageItems = filtered.slice(start, start + limit)
    const includeFinancial = currentUser?.role !== 'BODEGUERO'
    const items = (await this.attachAuditUsers(pageItems)).map((r) => this.sanitizeRecepcion(r, { includeFinancial }))

    return { items, total, page, limit }
  }

  async getById(id, currentUser = null) {
    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }
    const [recepcionWithUser] = await this.attachAuditUsers([recepcion])
    return this.sanitizeRecepcion(recepcionWithUser, { includeFinancial: currentUser?.role !== 'BODEGUERO' })
  }

  async create(payload, currentUser = null) {
    const folio = payload.folio?.trim() || await this.getNextFolio()

    const existingByFolio = await this.repository.findByFolio(folio)
    if (existingByFolio) {
      const error = new Error('El folio de la recepción ya existe')
      error.statusCode = 409
      throw error
    }

    let supplier = null
    if (payload.supplierId) {
      supplier = await this.repository.findSupplierById(payload.supplierId)
      if (!supplier) {
        const error = new Error('Proveedor no encontrado')
        error.statusCode = 404
        throw error
      }
    }

    const dedupedItems = dedupeItems(payload.items)
    let total = 0

    for (const item of dedupedItems) {
      const product = await this.repository.findProductById(item.productId)
      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productId}`)
        error.statusCode = 404
        throw error
      }
      total += round2(item.cantidad * item.costoUnitario)
    }

    const data = {
      supplierId: supplier?.id || null,
      facturaProveedor: normalizeOptionalText(payload.facturaProveedor) || null,
      fecha: new Date(payload.fecha),
      folio,
      comentarios: normalizeOptionalText(payload.comentarios) || null,
      estado: 'BORRADOR',
      origen: payload.origen,
      total: round2(total),
      createdBy: currentUser?.usuario || null,
      items: dedupedItems,
    }

    const created = await this.repository.create(data)
    const sanitized = this.sanitizeRecepcion(created)

    await this.auditLogger({
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
    assertNotSupplierOrder(current)

    if (current.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes editar recepciones en borrador')
      error.statusCode = 400
      throw error
    }

    if (Object.keys(payload).some((field) => !['folio', 'comentarios'].includes(field))) {
      const error = new Error('Solo puedes editar el folio y los comentarios de una recepción en borrador')
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

  async enviar(id, currentUser = null) {
    const recepcion = await this.repository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.origen !== 'REABASTECIMIENTO') {
      const error = new Error('Solo los pedidos de reabastecimiento pueden enviarse al bodeguero')
      error.statusCode = 400
      throw error
    }

    if (recepcion.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes enviar pedidos en estado BORRADOR')
      error.statusCode = 400
      throw error
    }

    const updated = await this.repository.update(id, {
      estado: 'ENVIADA',
      sentAt: new Date(),
      sentBy: currentUser?.id ?? currentUser?.sub ?? null,
    })

    await this.auditLogger({
      action: 'SEND',
      resource: 'recepciones',
      resourceId: updated.id,
      details: { folio: updated.folio || '', origen: updated.origen || '' },
      currentUser,
    })

    return { message: 'Pedido enviado al bodeguero', item: this.sanitizeRecepcion(updated) }
  }

  async confirm(id, receivedItems, facturaProveedor, facturaUrl, currentUser = null) {
    const recepcion = await this.repository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }

    if (recepcion.estado !== 'ENVIADA') {
      const error = new Error('Solo puedes confirmar recepciones en estado ENVIADA')
      error.statusCode = 400
      throw error
    }

    const expectedIds = new Set(recepcion.items.map((item) => item.id))
    const receivedIds = new Set()

    for (const item of receivedItems) {
      if (!expectedIds.has(item.id)) {
        const error = new Error('Todas las partidas deben pertenecer a la recepción')
        error.statusCode = 400
        throw error
      }
      if (receivedIds.has(item.id)) {
        const error = new Error('No puedes enviar una partida más de una vez')
        error.statusCode = 400
        throw error
      }
      receivedIds.add(item.id)

      const original = recepcion.items.find((receptionItem) => receptionItem.id === item.id)
      if (item.cantidadRecibida > original.cantidad) {
        const error = new Error('La cantidad recibida no puede exceder la cantidad pedida')
        error.statusCode = 400
        throw error
      }
      if (item.costoUnitarioReal !== undefined && item.costoUnitarioReal !== null && Number(item.costoUnitarioReal) < 0) {
        const error = new Error('El costo unitario real no puede ser negativo')
        error.statusCode = 400
        throw error
      }
    }

    if (receivedIds.size !== expectedIds.size) {
      const error = new Error('Debes registrar la cantidad recibida de todas las partidas')
      error.statusCode = 400
      throw error
    }

    const quantitiesByItemId = new Map(receivedItems.map((item) => [item.id, item.cantidadRecibida]))
    const realCostsByItemId = new Map(receivedItems.map((item) => [item.id, item.costoUnitarioReal]))
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.reception.findUnique({
        where: { id },
        include: { items: { include: { product: true } }, supplier: true }
      })

      if (!current) {
        const error = new Error('Recepción no encontrada')
        error.statusCode = 404
        throw error
      }
      if (current.estado !== 'ENVIADA') {
        const error = new Error('La recepción ya no está disponible para confirmar')
        error.statusCode = 400
        throw error
      }

      const movements = []
      const receivedCostsByProduct = new Map()
      for (const item of current.items) {
        const cantidadRecibida = quantitiesByItemId.get(item.id)
        const costoUnitarioReal = realCostsByItemId.get(item.id)
        await tx.receptionItem.update({
          where: { id: item.id },
          data: {
            cantidadRecibida,
            ...(costoUnitarioReal !== undefined && { costoUnitarioReal }),
          }
        })

        if (cantidadRecibida === 0) continue

        // If no actual cost was entered, the originally ordered cost is the
        // effective received cost.
        receivedCostsByProduct.set(item.productId, {
          product: item.product,
          costoNuevo: Number(costoUnitarioReal ?? item.costoUnitario),
        })

        const talla = item.talla || 'Única'
        const variantBefore = await tx.productVariant.findUnique({
          where: { productId_talla: { productId: item.productId, talla } }
        })
        const variant = await tx.productVariant.upsert({
          where: { productId_talla: { productId: item.productId, talla } },
          create: { productId: item.productId, talla, stock: cantidadRecibida },
          update: { stock: { increment: cantidadRecibida } }
        })

        const movement = await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            tipo: 'ENTRADA',
            cantidad: cantidadRecibida,
            motivo: `Recepción de pedido ${current.folio}`,
          }
        })

        movements.push({
          ...this.sanitizeMovement(movement),
          talla,
          stockAnterior: Number(variantBefore?.stock || 0),
          stockNuevo: Number(variant.stock || 0),
        })
      }

      const purchasePriceChanges = []
      // Confirming physical quantities is an operational action. Only an
      // ADMIN may let a reception alter product purchase prices.
      if (currentUser?.role !== 'BODEGUERO') {
        for (const [productId, { product, costoNuevo }] of receivedCostsByProduct) {
          const costoAnterior = Number(product?.precioCompra ?? 0)
          if (costoAnterior === costoNuevo) continue

          await tx.product.update({
            where: { id: productId },
            data: {
              precioCompra: costoNuevo,
              precioCompraAnterior: costoAnterior,
              pendingPriceReview: true,
              purchasePriceChangedAt: new Date(),
            },
          })
          purchasePriceChanges.push({ productId, costoAnterior, costoNuevo })
        }
      }

      const updated = await tx.reception.update({
        where: { id: current.id },
        data: {
          estado: 'CONFIRMADA',
          confirmedAt: new Date(),
          confirmedBy: currentUser?.id ?? currentUser?.sub ?? null,
          ...(facturaProveedor !== undefined && {
            facturaProveedor: normalizeOptionalText(facturaProveedor) || null,
          }),
          ...(facturaUrl !== undefined && {
            facturaUrl: normalizeOptionalText(facturaUrl) || null,
          }),
        },
        include: { items: { include: { product: true } }, supplier: true }
      })

      return { updated, movements, purchasePriceChanges }
    })

    const [updatedWithUsers] = await this.attachAuditUsers([result.updated])
    const includeFinancial = currentUser?.role !== 'BODEGUERO'
    const item = this.sanitizeRecepcion(updatedWithUsers, { includeFinancial })
    const itemsFaltantes = item.items
      .filter((item) => item.cantidadRecibida < item.cantidad)
      .map((item) => ({
        productId: item.productId,
        nombre: item.productNombre,
        talla: item.talla,
        cantidadPedida: item.cantidad,
        cantidadRecibida: item.cantidadRecibida,
      }))
    const diferenciasCosto = item.items
      .filter((linea) => linea.costoUnitarioReal !== null && linea.costoUnitarioReal !== undefined && Number(linea.costoUnitarioReal) !== Number(linea.costoUnitario))
      .map((linea) => ({
        productId: linea.productId,
        costoPedido: linea.costoUnitario,
        costoReal: linea.costoUnitarioReal,
      }))

    await this.auditLogger({
      action: 'CONFIRM',
      resource: 'recepciones',
      resourceId: result.updated.id,
      details: {
        folio: result.updated.folio || '',
        itemsCount: item.items.length,
        itemsFaltantes: itemsFaltantes.length,
        diferenciasCosto: diferenciasCosto.length,
        cambiosPrecioCompra: result.purchasePriceChanges.length,
      },
      currentUser,
    })

    return {
      message: 'Recepción confirmada correctamente',
      item,
      movements: result.movements,
      itemsFaltantes,
      diferenciasCosto: includeFinancial ? diferenciasCosto : [],
      purchasePriceChanges: result.purchasePriceChanges,
    }
  }

  async attachInvoice(id, { facturaProveedor, facturaUrl }, currentUser = null) {
    const recepcion = await this.repository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }
    if (recepcion.estado !== 'CONFIRMADA') {
      const error = new Error('Solo puedes adjuntar una factura a una recepción confirmada')
      error.statusCode = 400
      throw error
    }
    if (recepcion.facturaUrl) {
      const error = new Error('Esta recepción ya tiene una factura adjunta')
      error.statusCode = 409
      throw error
    }

    const updated = await this.repository.update(id, {
      facturaProveedor: normalizeOptionalText(facturaProveedor) || null,
      facturaUrl: normalizeOptionalText(facturaUrl),
    })

    await this.auditLogger({
      action: 'UPDATE',
      resource: 'recepciones',
      resourceId: updated.id,
      details: { folio: updated.folio || '', facturaAdjuntada: true },
      currentUser,
    })

    const [updatedWithUsers] = await this.attachAuditUsers([updated])
    return this.sanitizeRecepcion(updatedWithUsers, { includeFinancial: currentUser?.role !== 'BODEGUERO' })
  }

  async cancelar(id, currentUser = null) {
    if (currentUser?.role !== 'ADMIN') {
      const error = new Error('Solo un administrador puede cancelar recepciones')
      error.statusCode = 403
      throw error
    }

    const recepcion = await recepcionesRepository.findById(id)
    if (!recepcion) {
      const error = new Error('Recepción no encontrada')
      error.statusCode = 404
      throw error
    }
    assertNotSupplierOrder(recepcion)

    if (!['BORRADOR', 'ENVIADA'].includes(recepcion.estado)) {
      const error = new Error('Solo puedes cancelar recepciones en estado BORRADOR o ENVIADA')
      error.statusCode = 400
      throw error
    }

    const updated = await recepcionesRepository.update(recepcion.id, {
      estado: 'CANCELADA',
      canceledAt: new Date(),
      canceledBy: currentUser?.id ?? currentUser?.sub ?? null,
    })

    await this.auditLogger({
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
    assertNotSupplierOrder(recepcion)

    if (recepcion.estado !== 'BORRADOR') {
      const error = new Error('Solo puedes eliminar recepciones en borrador.')
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

  sanitizeRecepcion(recepcion, { includeFinancial = true } = {}) {
    const piezasTotales = (recepcion.items || []).reduce((sum, i) => sum + Number(i.cantidad || 0), 0)
    const confirmedByNombre = formatUserName(recepcion.confirmedByUser)
    const sentByNombre = formatUserName(recepcion.sentByUser)
    const canceledByNombre = formatUserName(recepcion.canceledByUser)
    const createdByNombre = formatUserName(recepcion.createdByUser)

    return {
      id: recepcion.id,
      supplierId: recepcion.supplierId || '',
      supplierNombre: recepcion.supplier?.nombre || '',
      facturaProveedor: recepcion.facturaProveedor || '',
      facturaUrl: recepcion.facturaUrl || '',
      fecha: recepcion.fecha || '',
      folio: recepcion.folio || '',
      comentarios: recepcion.comentarios || '',
      status: recepcion.estado || 'BORRADOR',
      origen: recepcion.origen || 'MANUAL',
      items: (recepcion.items || []).map((item) => ({
        id: item.id,
        productId: item.productId || '',
        sku: item.product?.sku || '',
        productNombre: item.product?.nombre || '',
        imagen: item.product?.imagenes?.[0] || '',
        talla: item.talla || '',
        cantidad: Number(item.cantidad || 0),
        cantidadRecibida: item.cantidadRecibida === null || item.cantidadRecibida === undefined
          ? null
          : Number(item.cantidadRecibida),
        ...(includeFinancial ? {
          costoUnitario: Number(item.costoUnitario || 0),
          costoUnitarioReal: item.costoUnitarioReal === null || item.costoUnitarioReal === undefined
            ? null
            : Number(item.costoUnitarioReal),
          subtotal: round2(Number(item.cantidad || 0) * Number(item.costoUnitario || 0)),
        } : {}),
      })),
      piezasTotales,
      ...(includeFinancial ? { total: Number(recepcion.total || 0) } : {}),
      sentAt: recepcion.sentAt || null,
      sentBy: recepcion.sentBy || '',
      sentByNombre,
      confirmedAt: recepcion.confirmedAt || null,
      confirmedBy: recepcion.confirmedBy || '',
      confirmedByNombre,
      recibidoPor: confirmedByNombre,
      canceledAt: recepcion.canceledAt || null,
      canceledBy: recepcion.canceledBy || '',
      canceledByNombre,
      createdBy: recepcion.createdBy || '',
      createdByNombre,
      createdAt: recepcion.createdAt || null,
      updatedAt: recepcion.updatedAt || null,
    }
  }

  async attachAuditUsers(recepciones) {
    const identifiers = [...new Set(
      recepciones
        .flatMap((recepcion) => [
          recepcion.confirmedBy,
          recepcion.sentBy,
          recepcion.canceledBy,
          recepcion.createdBy
        ])
        .filter(Boolean)
    )]

    if (identifiers.length === 0) return recepciones

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: identifiers } },
          { usuario: { in: identifiers } }
        ]
      },
      select: { id: true, usuario: true, nombre: true, apellido: true }
    })
    const usersByIdentifier = new Map(users.flatMap((user) => [[user.id, user], [user.usuario, user]]))

    return recepciones.map((recepcion) => ({
      ...recepcion,
      confirmedByUser: usersByIdentifier.get(recepcion.confirmedBy) || null,
      sentByUser: usersByIdentifier.get(recepcion.sentBy) || null,
      canceledByUser: usersByIdentifier.get(recepcion.canceledBy) || null,
      createdByUser: usersByIdentifier.get(recepcion.createdBy) || null
    }))
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
