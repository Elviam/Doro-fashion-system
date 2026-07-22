import { prisma } from '../../lib/prisma.js'

const ESTADOS_CONFIRMADOS = ['PAGADO', 'ENVIADO']

function inicioDelDia(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (days - 1))
  return date
}

function stockTotal(product) {
  return product.variants.reduce((total, variant) => total + Number(variant.stock || 0), 0)
}

export class DashboardService {
  async summary(days = 30) {
    const desde = inicioDelDia(days)
    const duracionPeriodo = days * 24 * 60 * 60 * 1000
    const desdePeriodoAnterior = new Date(desde.getTime() - duracionPeriodo)
    const ahora = new Date()
    const [sales, recentSales, products] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: desdePeriodoAnterior } },
        include: { items: { include: { product: true } }, cliente: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sale.findMany({
        include: { cliente: true }, orderBy: { createdAt: 'desc' }, take: 6,
      }),
      prisma.product.findMany({ include: { variants: true }, where: { activo: true } }),
    ])

    const ventasPeriodo = sales.filter((sale) => sale.createdAt >= desde)
    const ventasPeriodoAnterior = sales.filter((sale) => sale.createdAt >= desdePeriodoAnterior && sale.createdAt < desde)
    const confirmadas = ventasPeriodo.filter((sale) => ESTADOS_CONFIRMADOS.includes(sale.estado))
    const confirmadasAnteriores = ventasPeriodoAnterior.filter((sale) => ESTADOS_CONFIRMADOS.includes(sale.estado))
    const ingresos = confirmadas.reduce((total, sale) => total + Number(sale.total), 0)
    const ingresosAnteriores = confirmadasAnteriores.reduce((total, sale) => total + Number(sale.total), 0)
    const pedidosPorEnviar = ventasPeriodo.filter((sale) => sale.estado === 'PAGADO').length
    const canceladas = ventasPeriodo.filter((sale) => sale.estado === 'CANCELADO').length
    const unidadesVendidas = confirmadas.reduce((total, sale) => total + sale.items.reduce((subtotal, item) => subtotal + item.cantidad, 0), 0)
    const costoVentas = confirmadas.reduce((total, sale) => total + sale.items.reduce((subtotal, item) => subtotal + item.cantidad * Number(item.product?.precioCompra || 0), 0), 0)
    const utilidad = ingresos - costoVentas
    const clientesDelPeriodo = new Map(confirmadas.map((sale) => [sale.clientId, sale.cliente]))
    const clientesNuevos = [...clientesDelPeriodo.values()].filter((client) => client.createdAt >= desde).length
    const clientesRecurrentes = Math.max(0, clientesDelPeriodo.size - clientesNuevos)
    const pedidosPendientes = ventasPeriodo.filter((sale) => !['CANCELADO', 'ENVIADO'].includes(sale.estado) && sale.fulfillmentStatus !== 'COMPLETADO').length
    const pedidosAtrasados = ventasPeriodo.filter((sale) => {
      const sinResolver = !['CANCELADO', 'ENVIADO'].includes(sale.estado) && sale.fulfillmentStatus !== 'COMPLETADO'
      return sinResolver && ahora.getTime() - sale.createdAt.getTime() >= 48 * 60 * 60 * 1000
    }).length
    const productsById = new Map()
    const ventasPorVariante = new Map()
    for (const sale of confirmadas) {
      for (const item of sale.items) {
        const current = productsById.get(item.productId) || { id: item.productId, nombre: item.nombreProducto, unidades: 0, ingreso: 0 }
        current.unidades += item.cantidad
        current.ingreso += item.cantidad * Number(item.precioUnitario)
        productsById.set(item.productId, current)
        const variantKey = `${item.productId}-${item.talla}`
        ventasPorVariante.set(variantKey, (ventasPorVariante.get(variantKey) || 0) + item.cantidad)
      }
    }

    const bajoStock = products.flatMap((product) => {
      const minimo = Number(product.stockMinimo ?? 0)
      const ideal = Number(product.stockIdeal ?? 0)
      return product.variants.filter((variant) => Number(variant.stock || 0) <= minimo).map((variant) => ({
        id: `${product.id}-${variant.id}`, productoId: product.id, sku: product.sku, nombre: product.nombre,
        talla: variant.talla, stock: Number(variant.stock || 0), minimo, ideal,
        deficit: Math.max(0, ideal - Number(variant.stock || 0)),
        unidadesVendidas: ventasPorVariante.get(`${product.id}-${variant.talla}`) || 0,
      }))
    }).sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || b.deficit - a.deficit).slice(0, 7)

    const unidadesInventario = products.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + variant.stock, 0), 0)
    const valorInventario = products.reduce((total, product) => total + product.variants.reduce((sum, variant) => sum + variant.stock * Number(product.precioCompra || 0), 0), 0)

    const buckets = Array.from({ length: days }, (_, index) => {
      const date = new Date(desde)
      date.setDate(desde.getDate() + index)
      return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }), monto: 0, ventas: 0 }
    })
    const bucketByDate = new Map(buckets.map((bucket) => [bucket.key, bucket]))
    for (const sale of confirmadas) {
      const bucket = bucketByDate.get(new Date(sale.createdAt).toISOString().slice(0, 10))
      if (bucket) {
        bucket.monto += Number(sale.total)
        bucket.ventas += 1
      }
    }

    return {
      periodDays: days,
      metrics: {
        ingresos, ingresosAnteriores, variacionIngresos: ingresosAnteriores ? ((ingresos - ingresosAnteriores) / ingresosAnteriores) * 100 : null,
        pedidosConfirmados: confirmadas.length, pedidosPorEnviar, canceladas, bajoStock: bajoStock.length,
        ticketPromedio: confirmadas.length ? ingresos / confirmadas.length : 0, unidadesVendidas,
        costoVentas, utilidad, margen: ingresos ? (utilidad / ingresos) * 100 : 0,
        clientesNuevos, clientesRecurrentes, clientesTotales: clientesDelPeriodo.size,
        pedidosPendientes, pedidosAtrasados, unidadesInventario, valorInventario,
      },
      salesTrend: buckets,
      lowStockProducts: bajoStock,
      topProductos: [...productsById.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5),
      recentSales: recentSales.map((sale) => ({ id: sale.id, numeroPedido: sale.numeroPedido, cliente: sale.cliente?.nombre || 'Cliente', total: Number(sale.total), estado: sale.estado, createdAt: sale.createdAt })),
    }
  }

  async recentActivity(limit = 10) {
    const auditLogs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: Number(limit) })
    return { items: auditLogs.map((item) => ({ id: item.id, action: item.accion || '', resource: item.entidad || '', resourceId: item.entidadId || '', details: item.detalles || {}, userId: item.userId || '', usuario: item.user ? `${item.user.nombre} ${item.user.apellido || ''}`.trim() : '', createdAt: item.createdAt || null })), total: auditLogs.length, limit: Number(limit) }
  }
}

export const dashboardService = new DashboardService()
