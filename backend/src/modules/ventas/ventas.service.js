import { ventasRepository } from './ventas.repository.js'
import { inventoryRepository } from '../inventory/inventory.repository.js'
import { clientsRepository } from '../clients/clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'

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
      .filter((v) => {
        const ventaEmail = v.cliente?.email
        return ventaEmail === clientEmail
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((v) => this.sanitize(v))

    return {
      items: myVentas,
      total: myVentas.length
    }
  }

  async list(query) {
    const { estado = '', email = '', clienteId = '', page = 1, limit = 10 } = query

    const all = await ventasRepository.findAll()

    let filtered = all

    if (estado) {
      filtered = filtered.filter((v) => v.estado === estado)
    }

    if (clienteId || email) {
      filtered = filtered.filter((v) =>
        (clienteId && v.clienteId === clienteId) ||
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
    const data = {
      numeroPedido: payload.numeroPedido || '',
      clienteId:    payload.clienteId    || '',
      cliente:    payload.cliente,
      metodoPago: payload.metodoPago,
      items:      payload.items,
      subtotal:   Number(payload.subtotal),
      envio:      Number(payload.envio),
      total:      Number(payload.total),
      estado:     'pendiente',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    }

    const created = await ventasRepository.create(data)
    const sanitized = this.sanitize(created)

    await logAuditEvent({
      action: 'CREATE',
      resource: 'ventas',
      resourceId: created.id,
      details: {
        cliente: sanitized.cliente.nombre,
        total:   sanitized.total,
        items:   sanitized.items.length,
      },
      currentUser
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

    const updated = await ventasRepository.update(id, {
      estado,
      updatedAt: new Date().toISOString(),
    })

    const sanitized = this.sanitize(updated)

    // Descontar stock al pagar
    if (estado === 'pagado' && venta.estado !== 'pagado') {
      for (const item of venta.items ?? []) {
        const producto = await inventoryRepository.findProductById(item.productoId)
        if (!producto) continue
        const inventario = Array.isArray(producto.inventario) ? producto.inventario : []
        const updatedInventario = inventario.map((entry) =>
          entry.talla === item.talla
            ? { ...entry, stock: Math.max(0, entry.stock - item.cantidad) }
            : entry
        )
        const nuevoStock = updatedInventario.reduce((sum, e) => sum + (e.stock || 0), 0)
        await inventoryRepository.updateProductStock(item.productoId, {
          inventario: updatedInventario,
          stock: nuevoStock,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    // Restaurar stock si se cancela un pedido pagado
    if (estado === 'cancelado' && venta.estado === 'pagado') {
      for (const item of venta.items ?? []) {
        const producto = await inventoryRepository.findProductById(item.productoId)
        if (!producto) continue
        const inventario = Array.isArray(producto.inventario) ? producto.inventario : []
        const updatedInventario = inventario.map((entry) =>
          entry.talla === item.talla
            ? { ...entry, stock: (entry.stock || 0) + item.cantidad }
            : entry
        )
        const nuevoStock = updatedInventario.reduce((sum, e) => sum + (e.stock || 0), 0)
        await inventoryRepository.updateProductStock(item.productoId, {
          inventario: updatedInventario,
          stock: nuevoStock,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'ventas',
      resourceId: id,
      details: {
        estadoAnterior: venta.estado,
        estadoNuevo:    estado,
        cliente:        sanitized.cliente.nombre,
      },
      currentUser
    })

    return sanitized
  }

  sanitize(venta) {
    return {
      id:           venta.id,
      numeroPedido: venta.numeroPedido || '',
      clienteId:    venta.clienteId    || '',
      cliente:      venta.cliente,
      metodoPago: venta.metodoPago || '',
      items:      Array.isArray(venta.items) ? venta.items : [],
      subtotal:   Number(venta.subtotal || 0),
      envio:      Number(venta.envio || 0),
      total:      Number(venta.total || 0),
      estado:     venta.estado || 'pendiente',
      createdAt:  venta.createdAt || null,
      updatedAt:  venta.updatedAt || null,
    }
  }
}

export const ventasService = new VentasService()
