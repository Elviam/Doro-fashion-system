import { ventasRepository } from './ventas.repository.js'
import { clientsRepository } from '../clients/clients.repository.js'
import { logAuditEvent } from '../../utils/audit.js'
import { prisma } from '../../lib/prisma.js'
import { fulfillmentService } from '../fulfillment/fulfillment.service.js'

const ENVIO_GRATIS_DESDE = 799
const COSTO_ENVIO = 99
const TRANSICIONES_PERMITIDAS = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['CANCELADO'],
  ENVIADO: [],
  CANCELADO: [],
}

function normalizarTelefono(valor) {
  const telefono = String(valor || '').replace(/\D/g, '')
  if (!/^\d{8,15}$/.test(telefono)) {
    const error = new Error('El teléfono debe tener entre 8 y 15 dígitos')
    error.statusCode = 400
    throw error
  }
  return telefono
}

function telefonoValido(valor) {
  return /^\d{8,15}$/.test(String(valor || '').replace(/\D/g, ''))
}

// Busca un cliente existente por su correo electrónico o crea uno nuevo
// a partir de la información proporcionada en el checkout. De esta forma,
// cada venta queda asociada a un registro real de `Client` (nunca como
// datos embebidos), siguiendo el modelo de datos normalizado de la tienda.
function formatShippingAddress(address) {
  const number = [address.calle, address.numeroExterior].filter(Boolean).join(' ')
  const interior = address.numeroInterior ? ` Int. ${address.numeroInterior}` : ''
  return [
    `${number}${interior}`,
    address.colonia,
    `${address.ciudad}, ${address.estado}`,
    `CP ${address.cp}`,
    address.pais || 'México',
  ].filter(Boolean).join(', ')
}

function shippingAddressData(address) {
  return {
    shippingCountry: address.pais || 'México',
    shippingState: address.estado,
    shippingCity: address.ciudad,
    shippingNeighborhood: address.colonia,
    shippingPostalCode: address.cp,
    shippingStreet: address.calle,
    shippingExteriorNumber: address.numeroExterior,
    shippingInteriorNumber: address.numeroInterior || null,
    shippingReferences: address.referencias || null,
    shippingPhone: address.telefono,
  }
}

async function resolveCheckoutClient(clienteInfo, currentUser) {
  const email = String(clienteInfo.email).trim().toLowerCase()
  const direccion = formatShippingAddress(clienteInfo)

  const client = await clientsRepository.findById(currentUser.sub)
  if (!client || client.activo === false || client.email.toLowerCase() !== email) {
    const error = new Error('Cliente no autorizado para realizar esta compra')
    error.statusCode = 403
    throw error
  }
  const defaultAddress = {
    nombre: clienteInfo.nombre.trim(),
    email,
    direccion,
    ...(!telefonoValido(client.telefono) ? { telefono: clienteInfo.telefono } : {}),
  }
  return clientsRepository.update(client.id, defaultAddress)
}

export class VentasService {
  async getMyVentas(currentUser) {
    if (!currentUser) {
      const error = new Error('Usuario no autenticado')
      error.statusCode = 401
      throw error
    }

    if (currentUser.accountType !== 'CLIENT') {
      const error = new Error('No se pudo identificar al usuario')
      error.statusCode = 401
      throw error
    }

    await fulfillmentService.completeSimulatedDeliveries()
    const all = await ventasRepository.findAll()
    const myVentas = all
      .filter((v) => v.clientId === currentUser.sub)
      .map((v) => this.sanitize(v))

    return { items: myVentas, total: myVentas.length }
  }

  async list(query) {
    const { estado = '', metodoPago = '', email = '', clienteId = '', q = '', desde, hasta } = query
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 10)
    const summaryWhere = {}
    if (clienteId) summaryWhere.clientId = clienteId
    if (email) summaryWhere.cliente = { email }
    if (metodoPago) summaryWhere.metodoPago = metodoPago
    if (q) {
      const search = [
        { id: { contains: q, mode: 'insensitive' } },
        { numeroPedido: { contains: q, mode: 'insensitive' } },
        { cliente: { nombre: { contains: q, mode: 'insensitive' } } },
        { cliente: { email: { contains: q, mode: 'insensitive' } } },
      ]
      summaryWhere.OR = search
    }
    if (desde || hasta) {
      const createdAt = {
        ...(desde ? { gte: new Date(`${desde}T00:00:00.000`) } : {}),
        ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}),
      }
      summaryWhere.createdAt = createdAt
    }
    const where = { ...summaryWhere, ...(estado ? { estado } : {}) }
    await fulfillmentService.completeSimulatedDeliveries()
    const result = await ventasRepository.list({ where, summaryWhere, skip: (page - 1) * limit, take: limit })
    const total = result.total
    const items = result.items.map((v) => this.sanitize(v))

    return { items, total, page, limit, estados: Object.fromEntries(result.estados.map((item) => [item.estado, item._count._all])) }
  }

  async getById(id) {
    await fulfillmentService.completeSimulatedDeliveries()
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
    if (!currentUser?.email || !currentUser?.sub) {
      const error = new Error('Usuario no autenticado')
      error.statusCode = 401
      throw error
    }

    if (currentUser.accountType !== 'CLIENT' || currentUser.role !== 'CLIENTE') {
      const error = new Error('Solo una cuenta de cliente puede realizar compras en la tienda')
      error.statusCode = 403
      throw error
    }

    const clienteInfo = {
      ...payload.cliente,
      email: currentUser.email,
      telefono: normalizarTelefono(payload.cliente.telefono),
    }
    const cliente = await resolveCheckoutClient(clienteInfo, currentUser)
    const subtotal = items.reduce((total, item) => total + item.cantidad * item.precioUnitario, 0)
    const envio = subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO

    const data = {
      // Folio compacto y legible; conserva el prefijo para búsquedas y referencias.
      numeroPedido: `PED-${Date.now().toString(36).toUpperCase()}`,
      clientId: cliente.id,
      metodoPago: payload.metodoPago,
      subtotal,
      envio,
      total: subtotal + envio,
      estado: 'PENDIENTE',
      ...shippingAddressData(clienteInfo),
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

  async updateEstado(id, estado, currentUser = null, motivoCancelacion = null) {
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
        where: { id }, data: {
          estado,
          cancellationReason: estado === 'CANCELADO' ? motivoCancelacion : null,
          ...(estado === 'CANCELADO' ? { fulfillmentStatus: 'CANCELADO', shippingStatus: 'CANCELADO' } : {}),
        }, include: { items: true, cliente: true },
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
        ...(estado === 'CANCELADO' ? { motivoCancelacion } : {}),
        cliente: sanitized.cliente.nombre,
      },
      currentUser,
    })

    return sanitized
  }

  async simulatePayment(id, currentUser = null) {
    if (!currentUser?.sub || currentUser.role !== 'CLIENTE') {
      const error = new Error('Solo el cliente dueño del pedido puede confirmar el pago simulado')
      error.statusCode = 403
      throw error
    }

    const venta = await ventasRepository.findById(id)
    if (!venta) {
      const error = new Error('Pedido no encontrado')
      error.statusCode = 404
      throw error
    }
    const clientId = venta.clientId ?? venta.cliente?.id
    if (clientId !== currentUser.sub) {
      const error = new Error('No tienes acceso a este pedido')
      error.statusCode = 403
      throw error
    }
    if (venta.estado !== 'PENDIENTE') {
      const error = new Error('Este pedido ya fue procesado')
      error.statusCode = 400
      throw error
    }
    if (!['tarjeta', 'oxxo'].includes(venta.metodoPago)) {
      const error = new Error('Este método de pago no está disponible para simulación')
      error.statusCode = 400
      throw error
    }

    return this.updateEstado(id, 'PAGADO', currentUser)
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
        direccion: formatShippingAddress({
          calle: venta.shippingStreet,
          numeroExterior: venta.shippingExteriorNumber,
          numeroInterior: venta.shippingInteriorNumber,
          colonia: venta.shippingNeighborhood,
          ciudad: venta.shippingCity,
          estado: venta.shippingState,
          cp: venta.shippingPostalCode,
          pais: venta.shippingCountry,
        }) || venta.cliente.direccion || '',
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
      motivoCancelacion: venta.cancellationReason || '',
      estadoPreparacion: venta.fulfillmentStatus || 'PENDIENTE',
      direccionEntrega: {
        pais: venta.shippingCountry || 'México', estado: venta.shippingState || '', ciudad: venta.shippingCity || '',
        colonia: venta.shippingNeighborhood || '', calle: venta.shippingStreet || '', numeroExterior: venta.shippingExteriorNumber || '',
        numeroInterior: venta.shippingInteriorNumber || '', cp: venta.shippingPostalCode || '', referencias: venta.shippingReferences || '', telefono: venta.shippingPhone || '',
      },
      guiaEnvio: venta.shippingGuide || '',
      estadoEnvio: venta.shippingStatus || 'PENDIENTE',
      paqueteria: venta.shippingCarrier || "D'ORO Envíos (simulado)",
      enviadoAt: venta.shippedAt || null,
      entregadoAt: venta.deliveredAt || null,
      eventosEnvio: (venta.shippingEvents || []).map((event) => ({
        estado: event.estado,
        descripcion: event.descripcion,
        createdAt: event.createdAt,
      })),
      createdAt: venta.createdAt || null,
      updatedAt: venta.updatedAt || null,
    }
  }
}

export const ventasService = new VentasService()
