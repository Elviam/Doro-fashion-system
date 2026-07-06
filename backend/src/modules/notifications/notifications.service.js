import { prisma } from '../../lib/prisma.js'

export class NotificationsService {
  async getNotifications(userPermissions = []) {
    const notifications = []

    const canReadProducts    = userPermissions.includes('products:read')
    const canReadRecepciones = userPermissions.includes('recepciones:read')

    // ── Productos con stock bajo ──────────────────────────────────────
    if (canReadProducts) {
      const productos = await prisma.product.findMany({
        where: { activo: true },
      })

      productos.forEach((p) => {
        const stock       = Number(p.stock ?? 0)
        const stockMinimo = Number(p.stockMinimo ?? 0)

        if (stockMinimo > 0 && stock <= stockMinimo) {
          notifications.push({
            id:     `stock-${p.id}`,
            tipo:   'stock_bajo',
            titulo: 'Stock bajo',
            mensaje: `${p.nombre} — ${stock} unidad${stock !== 1 ? 'es' : ''} (mín. ${stockMinimo})`,
            ruta:   '/productos',
            icon:   'bi-exclamation-triangle',
            nivel:  stock === 0 ? 'critico' : 'advertencia',
            createdAt: p.updatedAt || null,
          })
        }
      })
    }

    // ── Recepciones pendientes ─────────────────────────────────────────
    if (canReadRecepciones) {
      const recepciones = await prisma.reception.findMany({
        where: { estado: 'PENDIENTE' },
        include: { supplier: true },
      })

      recepciones.forEach((r) => {
        notifications.push({
          id:     `recepcion-${r.id}`,
          tipo:   'recepcion_pendiente',
          titulo: 'Recepción pendiente',
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