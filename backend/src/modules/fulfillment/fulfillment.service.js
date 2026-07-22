import { prisma } from '../../lib/prisma.js'
import { logAuditEvent } from '../../utils/audit.js'

const DELIVERY_SIMULATION_MS = 30_000

function formatShippingAddress(order) {
  if (!order.shippingStreet) return order.cliente?.direccion || ''
  const street = [order.shippingStreet, order.shippingExteriorNumber].filter(Boolean).join(' ')
  const interior = order.shippingInteriorNumber ? ` Int. ${order.shippingInteriorNumber}` : ''
  return [
    `${street}${interior}`,
    order.shippingNeighborhood,
    `${order.shippingCity || ''}, ${order.shippingState || ''}`.replace(/^, |, $/g, ''),
    order.shippingPostalCode ? `CP ${order.shippingPostalCode}` : '',
    order.shippingCountry || 'México',
  ].filter(Boolean).join(', ')
}

export class FulfillmentService {
  constructor() {
    this.deliveryTimers = new Map()
  }

  async list() {
    const recentShippingDate = new Date()
    recentShippingDate.setDate(recentShippingDate.getDate() - 10)
    const orders = await prisma.sale.findMany({
      where: {
        OR: [
          { estado: 'PAGADO' },
          { estado: 'ENVIADO', shippedAt: { gte: recentShippingDate } },
        ]
      },
      include: { cliente: true, items: { include: { product: { select: { sku: true } } } } },
      orderBy: { createdAt: 'asc' }
    })

    return { items: orders.map((order) => this.sanitize(order)), total: orders.length }
  }

  async dispatch(id, currentUser) {
    const order = await prisma.sale.findUnique({ where: { id } })
    if (!order) {
      const error = new Error('Pedido no encontrado')
      error.statusCode = 404
      throw error
    }
    if (order.estado !== 'PAGADO') {
      const error = new Error('Solo se pueden preparar y enviar pedidos pagados')
      error.statusCode = 400
      throw error
    }

    const now = new Date()
    const guide = `ENV-${Date.now().toString(36).toUpperCase()}`
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        estado: 'ENVIADO',
        fulfillmentStatus: 'PREPARADO',
        preparedAt: now,
        preparedBy: currentUser?.sub || null,
        shippingGuide: guide,
        shippedAt: now,
        shippedBy: currentUser?.sub || null,
        shippingStatus: 'EN_TRANSITO',
        shippingEvents: {
          create: [
            { estado: 'ENVIADO_PAQUETERIA', descripcion: 'Pedido preparado y entregado a D’ORO Envios (simulado).' },
            { estado: 'EN_TRANSITO', descripcion: 'El paquete inició su tránsito hacia el destino (simulado).' },
          ]
        }
      },
      include: { cliente: true, items: { include: { product: { select: { sku: true } } } }, shippingEvents: { orderBy: { createdAt: 'asc' } } }
    })

    await logAuditEvent({
      action: 'UPDATE', resource: 'fulfillment', resourceId: id,
      details: { numeroPedido: updated.numeroPedido, accion: 'PREPARADO_Y_ENVIADO', guia: guide }, currentUser
    })
    this.scheduleSimulatedDelivery(id)
    return this.sanitize(updated)
  }

  scheduleSimulatedDelivery(id) {
    if (this.deliveryTimers.has(id)) return
    const timer = setTimeout(async () => {
      this.deliveryTimers.delete(id)
      try {
        await this.completeSimulatedDeliveries([id])
      } catch (error) {
        console.error('No se pudo completar la entrega simulada:', error)
      }
    }, DELIVERY_SIMULATION_MS)
    timer.unref?.()
    this.deliveryTimers.set(id, timer)
  }

  async completeSimulatedDeliveries(ids = null) {
    const cutoff = new Date(Date.now() - DELIVERY_SIMULATION_MS)
    const orders = await prisma.sale.findMany({
      where: {
        ...(ids ? { id: { in: ids } } : {}),
        estado: 'ENVIADO',
        shippingStatus: 'EN_TRANSITO',
        shippedAt: { lte: cutoff },
      },
      select: { id: true, numeroPedido: true },
    })

    await Promise.all(orders.map(async (order) => {
      const result = await prisma.sale.updateMany({
        where: { id: order.id, estado: 'ENVIADO', shippingStatus: 'EN_TRANSITO' },
        data: { shippingStatus: 'ENTREGADO', deliveredAt: new Date() },
      })
      if (result.count) {
        await prisma.shippingEvent.create({
          data: {
            saleId: order.id,
            estado: 'ENTREGADO',
            descripcion: 'Entrega marcada automáticamente por el simulador de paquetería del portafolio.'
          }
        })
      }
    }))
  }

  async updateShippingStatus(id, estadoEnvio, currentUser) {
    const order = await prisma.sale.findUnique({ where: { id } })
    if (!order || order.estado !== 'ENVIADO') {
      const error = new Error('Solo se puede actualizar el seguimiento de pedidos enviados')
      error.statusCode = 400
      throw error
    }
    const descriptions = {
      EN_TRANSITO: 'El paquete va en transito hacia el destino.',
      ENTREGADO: 'Pedido entregado al cliente.',
      INCIDENCIA: 'El envio presenta una incidencia y requiere revision.',
    }
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        shippingStatus: estadoEnvio,
        deliveredAt: estadoEnvio === 'ENTREGADO' ? new Date() : null,
        shippingEvents: { create: { estado: estadoEnvio, descripcion: descriptions[estadoEnvio] } }
      },
      include: { cliente: true, items: { include: { product: { select: { sku: true } } } }, shippingEvents: { orderBy: { createdAt: 'asc' } } }
    })
    await logAuditEvent({ action: 'UPDATE', resource: 'fulfillment', resourceId: id, details: { numeroPedido: updated.numeroPedido, estadoEnvio }, currentUser })
    return this.sanitize(updated)
  }

  sanitize(order) {
    return {
      id: order.id,
      numeroPedido: order.numeroPedido,
      estado: order.estado,
      metodoPago: order.metodoPago || '',
      subtotal: Number(order.subtotal || 0),
      envio: Number(order.envio || 0),
      total: Number(order.total || 0),
      estadoPreparacion: order.fulfillmentStatus || 'PENDIENTE',
      guiaEnvio: order.shippingGuide || '',
      estadoEnvio: order.shippingStatus || 'PENDIENTE',
      paqueteria: order.shippingCarrier || "D'ORO Envios (simulado)",
      shippedAt: order.shippedAt || null,
      deliveredAt: order.deliveredAt || null,
      shippingEvents: (order.shippingEvents || []).map((event) => ({ estado: event.estado, descripcion: event.descripcion, createdAt: event.createdAt })),
      createdAt: order.createdAt,
      preparedAt: order.preparedAt || null,
      direccionEntrega: {
        pais: order.shippingCountry || 'México',
        estado: order.shippingState || '',
        ciudad: order.shippingCity || '',
        colonia: order.shippingNeighborhood || '',
        calle: order.shippingStreet || '',
        numeroExterior: order.shippingExteriorNumber || '',
        numeroInterior: order.shippingInteriorNumber || '',
        cp: order.shippingPostalCode || '',
        referencias: order.shippingReferences || '',
        telefono: order.shippingPhone || '',
      },
      cliente: order.cliente ? { nombre: order.cliente.nombre, email: order.cliente.email, direccion: formatShippingAddress(order) } : null,
      items: (order.items || []).map((item) => ({
        id: item.id, nombre: item.nombreProducto, sku: item.product?.sku || '-', imagen: item.imagenProducto || '', talla: item.talla, cantidad: item.cantidad, precioUnitario: Number(item.precioUnitario || 0)
      }))
    }
  }
}

export const fulfillmentService = new FulfillmentService()
