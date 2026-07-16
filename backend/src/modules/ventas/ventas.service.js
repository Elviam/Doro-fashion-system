import { ventasRepository } from './ventas.repository.js'
import { clientsRepository } from '../clients/clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { prisma } from '../../lib/prisma.js'

const ENVIO_GRATIS_DESDE = 999
const COSTO_ENVIO = 99
const TRANSICIONES_PERMITIDAS = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENVIADO', 'CANCELADO'],
  ENVIADO: [],
  CANCELADO: [],
}

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
    const items = await this.buildTrustedItems(payload.items)
    // The order belongs to the authenticated account, never to a value that
    // can be altered in the checkout form. This keeps the purchase history
    // tied to the correct client profile.
    if (!currentUser?.email) {
      const error = new Error('Usuario no autenticado')
      error.statusCode = 401
      throw error
    }
    const cliente = await findOrCreateClient({
      ...payload.cliente,
      email: currentUser.email,
    })
    const subtotal = items.reduce((total, item) => total + item.cantidad * item.precioUnitario, 0)
    const envio = subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO

    const data = {
      numeroPedido: `PED-${Date.now()}`,
      clientId: cliente.id,
      metodoPago: payload.metodoPago,
      subtotal,
      envio,
      total: subtotal + envio,
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
    const { ventaAnterior, updated } = await prisma.$transaction(async (tx) => {
      const venta = await tx.sale.findUnique({
        where: { id },
        include: { items: true, cliente: true },
      })
      if (!venta) {
        const error = new Error('Venta no encontrada')
        error.statusCode = 404
        throw error
      }
      if (!TRANSICIONES_PERMITIDAS[venta.estado]?.includes(estado)) {
        const error = new Error(`No se puede cambiar una venta ${venta.estado} a ${estado}`)
        error.statusCode = 400
        throw error
      }

      if (estado === 'PAGADO') {
        for (const item of venta.items) {
          const resultado = await tx.productVariant.updateMany({
            where: { productId: item.productId, talla: item.talla, stock: { gte: item.cantidad } },
            data: { stock: { decrement: item.cantidad } },
          })
          if (resultado.count !== 1) {
            const error = new Error(`No hay stock suficiente para ${item.nombreProducto} en talla ${item.talla}`)
            error.statusCode = 409
            throw error
          }
          await tx.inventoryMovement.create({
            data: { productId: item.productId, tipo: 'SALIDA', cantidad: item.cantidad, motivo: `VENTA ${venta.numeroPedido} - Talla ${item.talla}` },
          })
        }
      }

      if (estado === 'CANCELADO' && venta.estado === 'PAGADO') {
        for (const item of venta.items) {
          await tx.productVariant.update({
            where: { productId_talla: { productId: item.productId, talla: item.talla } },
            data: { stock: { increment: item.cantidad } },
          })
          await tx.inventoryMovement.create({
            data: { productId: item.productId, tipo: 'ENTRADA', cantidad: item.cantidad, motivo: `CANCELACION VENTA ${venta.numeroPedido} - Talla ${item.talla}` },
          })
        }
      }

      const actualizada = await tx.sale.update({
        where: { id }, data: { estado }, include: { items: true, cliente: true },
      })
      return { ventaAnterior: venta, updated: actualizada }
    })
    const sanitized = this.sanitize(updated)

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'ventas',
      resourceId: id,
      details: {
        estadoAnterior: ventaAnterior.estado,
        estadoNuevo: estado,
        cliente: sanitized.cliente.nombre,
      },
      currentUser,
    })

    return sanitized
  }

  // Obtiene datos confiables del catálogo y verifica disponibilidad antes de crear una venta.
  async buildTrustedItems(requestedItems) {
    const cantidadesPorVariante = new Map()
    for (const item of requestedItems) {
      const key = `${item.productoId}:${item.talla}`
      const previous = cantidadesPorVariante.get(key)
      cantidadesPorVariante.set(key, {
        productoId: item.productoId,
        talla: item.talla,
        cantidad: (previous?.cantidad || 0) + item.cantidad,
      })
    }

    const productIds = [...new Set(requestedItems.map((item) => item.productoId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, activo: true },
      include: { variants: true },
    })
    const productsById = new Map(products.map((product) => [product.id, product]))

    return [...cantidadesPorVariante.values()].map((item) => {
      const product = productsById.get(item.productoId)
      if (!product) {
        const error = new Error('Uno de los productos ya no esta disponible')
        error.statusCode = 400
        throw error
      }
      const variant = product.variants.find((v) => v.talla === item.talla)
      if (!variant) {
        const error = new Error(`La talla ${item.talla} no esta disponible para ${product.nombre}`)
        error.statusCode = 400
        throw error
      }
      if (variant.stock < item.cantidad) {
        const error = new Error(`No hay stock suficiente para ${product.nombre} en talla ${item.talla}`)
        error.statusCode = 409
        throw error
      }
      return {
        productId: product.id,
        nombreProducto: product.nombre,
        imagenProducto: product.imagenes[0] || null,
        talla: variant.talla,
        cantidad: item.cantidad,
        precioUnitario: Number(product.precioVenta),
      }
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
