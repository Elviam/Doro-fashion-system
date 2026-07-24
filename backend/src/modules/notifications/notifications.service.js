import { prisma } from '../../lib/prisma.js'

export class NotificationsService {
  async getNotifications(user = {}) {
    const notifications = []

    const userPermissions = user.permissions ?? []

    const canReadProducts    = userPermissions.includes('products:read')
    const canReadRecepciones = userPermissions.includes('recepciones:read')

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
      if (user.role === 'ADMIN') {
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

    // ── Recepciones pendientes ─────────────────────────────────────────
    if (canReadRecepciones) {
      const recepciones = await prisma.reception.findMany({
        where: { estado: 'ENVIADA' },
        include: { supplier: true },
      })

      recepciones.forEach((r) => {
        notifications.push({
          id:     `recepcion-${r.id}`,
          tipo:   'recepcion_enviada',
          titulo: 'Recepción enviada',
          mensaje: `${r.supplier?.nombre || 'Sin proveedor'}`,
          ruta:   '/recepciones',
          icon:   'bi-box-seam',
          nivel:  'info',
          createdAt: r.createdAt || null,
        })
      })
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
