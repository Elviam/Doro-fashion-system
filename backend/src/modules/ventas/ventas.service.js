import { ventasRepository } from './ventas.repository.js'
import { inventoryRepository } from '../inventory/inventory.repository.js'
import { clientsRepository } from '../clients/clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

// Busca un cliente existente por su correo electrónico o crea uno nuevo
// a partir de la información proporcionada en el checkout. De esta forma,
// cada venta queda asociada a un registro real de `Client` (nunca como
// datos embebidos), siguiendo el modelo de datos normalizado de la tienda.
async function findOrCreateClient(clienteInfo) {
  const email = String(clienteInfo.email).trim().toLowerCase()
  const existing = await clientsRepository.findByEmail(email)
  if (existing) return existing

  return clientsRepository.create({
    nombre: clienteInfo.nombre.trim(),
    email,
    direccion: `${clienteInfo.calle}, CP ${clienteInfo.cp}, ${clienteInfo.ciudad}`,
  })
}

export class VentasService {
  async getMyVentas(currentUser) {
    if (!currentUser) {
      const error = new Error('Usuario no autenticado')
      error.statusCode = 401
      throw error
    }

    const clientEmail = currentUser.email
    if (!clientEmail) {
      const error = new Error('No se pudo identificar al usuario')
      error.statusCode = 401
      throw error
    }

    const all = await ventasRepository.findAll()
    const myVentas = all
      .filter((v) => v.cliente?.email === clientEmail)
      .map((v) => this.sanitize(v))

    return { items: myVentas, total: myVentas.length }
  }

  async list(query) {
    const { estado = '', email = '', clienteId = '', page = 1, limit = 10 } = query

    const all = await ventasRepository.findAll()
    let filtered = all

    if (estado) filtered = filtered.filter((v) => v.estado === estado)

    if (clienteId || email) {
      filtered = filtered.filter((v) =>
        (clienteId && v.clientId === clienteId) ||
        (email && v.cliente?.email === email)
      )
    }

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit).map((v) => this.sanitize(v))

    return { items, total, page, limit }
  }

  async getById(id) {
    const venta = await ventasRepository.findById(id)
    if (!venta) {
      const error = new Error('Venta no encontrada')
      error.statusCode = 404
      throw error
    }
    return this.sanitize(venta)
  }

  async create(payload, currentUser = null) {
    const cliente = await findOrCreateClient(payload.cliente)

    const items = payload.items.map((item) => ({
      productId: item.productoId,
      nombreProducto: item.nombre,
      imagenProducto: item.imagen || null,
      talla: item.talla,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    }))

    const data = {
      numeroPedido: payload.numeroPedido || `PED-${Date.now()}`,
      clientId: cliente.id,
      metodoPago: payload.metodoPago,
      subtotal: payload.subtotal,
      envio: payload.envio,
      total: payload.total,
      estado: 'PENDIENTE',
      items,
    }

    const created = await ventasRepository.create(data)
    const sanitized = this.sanitize(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'ventas',
      resourceId: created.id,
      details: {
        cliente: sanitized.cliente.nombre,
        total: sanitized.total,
        items: sanitized.items.length,
      },
      currentUser,
    })

    return sanitized
  }

  async updateEstado(id, estado, currentUser = null) {
    const venta = await ventasRepository.findById(id)
    if (!venta) {
      const error = new Error('Venta no encontrada')
      error.statusCode = 404
      throw error
    }

    const updated = await ventasRepository.update(id, { estado })
    const sanitized = this.sanitize(updated)

    // Descuenta el stock de los productos cuando una venta se marca como pagada.
    if (estado === 'PAGADO' && venta.estado !== 'PAGADO') {
      for (const item of venta.items) {
        await this.applyStockChange(item, -item.cantidad, currentUser, 'VENTA')
      }
    }
    // Restaura el stock de los productos si una venta previamente pagada
    // es cancelada.
    if (estado === 'CANCELADO' && venta.estado === 'PAGADO') {
      for (const item of venta.items) {
        await this.applyStockChange(item, item.cantidad, currentUser, 'CANCELACION_VENTA')
      }
    }

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'ventas',
      resourceId: id,
      details: {
        estadoAnterior: venta.estado,
        estadoNuevo: estado,
        cliente: sanitized.cliente.nombre,
      },
      currentUser,
    })

    return sanitized
  }

 // Ajusta el stock de una `ProductVariant` y registra el movimiento
// correspondiente para mantener un historial de auditoría.
  async applyStockChange(item, delta, currentUser, motivo) {
    const variant = await inventoryRepository.findVariant(item.productId, item.talla)
    if (!variant) return

    await inventoryRepository.adjustVariantStock(item.productId, item.talla, delta)
    await inventoryRepository.createMovement({
      productId: item.productId,
      tipo: delta > 0 ? 'ENTRADA' : 'SALIDA',
      cantidad: Math.abs(delta),
      motivo,
    })
  }

  sanitize(venta) {
    return {
      id: venta.id,
      numeroPedido: venta.numeroPedido || '',
      clienteId: venta.clientId || '',
      cliente: venta.cliente ? {
        nombre: venta.cliente.nombre,
        email: venta.cliente.email,
        direccion: venta.cliente.direccion || '',
      } : null,
      metodoPago: venta.metodoPago || '',
      items: (venta.items || []).map((item) => ({
        productoId: item.productId,
        nombre: item.nombreProducto,
        imagen: item.imagenProducto || '',
        talla: item.talla,
        cantidad: item.cantidad,
        precioUnitario: Number(item.precioUnitario || 0),
      })),
      subtotal: Number(venta.subtotal || 0),
      envio: Number(venta.envio || 0),
      total: Number(venta.total || 0),
      estado: venta.estado || 'PENDIENTE',
      createdAt: venta.createdAt || null,
      updatedAt: venta.updatedAt || null,
    }
  }
}

export const ventasService = new VentasService()