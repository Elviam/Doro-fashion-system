import { prisma } from '../../lib/prisma.js'
import { getRoleCode, hasPermission, normalizeAuthenticatedUser } from '../../services/authorization.service.js'

export class NotificationsService {
  async getNotifications(user = {}) {
    const notifications = []

    const normalizedUser = normalizeAuthenticatedUser(user)
    const role = getRoleCode(normalizedUser)

    const canReadProducts = hasPermission(normalizedUser, 'products:read')
    const canReadRecepciones = hasPermission(normalizedUser, 'recepciones:read')
    const canPrepareOrders = hasPermission(normalizedUser, 'fulfillment:read')

    // Warehouse notifications are calculated from current operational state,
    // not stored per refresh. A reception is therefore active exactly while
    // its supplier order remains ENVIADA.
    if (role === 'BODEGUERO') {
      if (canPrepareOrders) {
        const pendingOrders = await prisma.sale.count({
          where: { estado: 'PAGADO', fulfillmentStatus: { not: 'PREPARADO' } },
        })
        if (pendingOrders > 0) {
          notifications.push({
            id: 'pedidos-pendientes-preparacion', tipo: 'pedidos_pendientes_preparacion',
            titulo: 'Pedidos pendientes de preparación',
            mensaje: pendingOrders === 1 ? 'Tienes 1 pedido pendiente de preparar.' : `Tienes ${pendingOrders} pedidos pendientes de preparar.`,
            ruta: '/preparar-pedidos', icon: 'bi-box2-heart', nivel: 'info', createdAt: null,
          })
        }
      }

      if (canReadRecepciones) {
        const pendingReceptions = await prisma.reception.findMany({
          where: { estado: 'ENVIADA', origen: 'REABASTECIMIENTO' },
          include: { supplier: true },
        })
        pendingReceptions.forEach((reception) => {
          notifications.push({
            id: `recepcion-${reception.id}`,
            tipo: 'pedido_pendiente_recepcion',
            titulo: 'Pedido disponible para recepción',
            mensaje: `${reception.folio || 'Pedido sin folio'}${reception.supplier?.nombre ? ` · ${reception.supplier.nombre}` : ''}`,
            ruta: '/recepciones', icon: 'bi-box-seam', nivel: 'info',
            createdAt: reception.sentAt || reception.createdAt || null,
          })
        })
      }
    }

    // ── Productos con stock bajo ──────────────────────────────────────
    if (canReadProducts) {
      const productos = await prisma.product.findMany({
        where: { activo: true },
        include: { variants: true },
      })

      productos.forEach((p) => {
        const stockMinimo = Number(p.stockMinimo ?? 0)
        p.variants.forEach((variant) => {
          const stock = Number(variant.stock || 0)
          if (stock > stockMinimo) return
          notifications.push({
            id:     `stock-${p.id}-${variant.id}`,
            tipo:   'stock_bajo',
            titulo: 'Stock bajo',
            mensaje: `${p.nombre} · talla ${variant.talla}: ${stock} unidad${stock !== 1 ? 'es' : ''} (mín. ${stockMinimo})`,
            ruta:   '/productos',
            icon:   'bi-exclamation-triangle',
            nivel:  stock === 0 ? 'critico' : 'advertencia',
            createdAt: p.updatedAt || null,
          })
        })
      })

      // The notification is derived from the product flag, so it disappears
      // as soon as the administrator saves the product after reviewing it.
      if (role === 'ADMIN') {
        const productsWithPendingPriceReview = await prisma.product.findMany({
          where: { pendingPriceReview: true },
          select: {
            id: true,
            nombre: true,
            purchasePriceChangedAt: true,
          },
        })

        productsWithPendingPriceReview.forEach((product) => {
          notifications.push({
            id: `revision-precio-${product.id}`,
            tipo: 'revision_precio_venta',
            titulo: 'Revisión de precio de venta',
            mensaje: `El costo de compra de "${product.nombre}" cambió. Revisa si deseas actualizar su precio de venta.`,
            ruta: `/productos?detalle=${encodeURIComponent(product.id)}`,
            icon: 'bi-exclamation-triangle',
            nivel: 'advertencia',
            createdAt: product.purchasePriceChangedAt || null,
          })
        })
      }
    }

    notifications.sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

    return {
      total: notifications.length,
      items: notifications,
    }
  }
}

export const notificationsService = new NotificationsService()
