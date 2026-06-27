import { dashboardRepository } from './dashboard.repository.js'

export class DashboardService {
  async summary() {
    const [
      users,
      clients,
      suppliers,
      products,
      recepciones,
      inventoryMovements,
      auditLogs
    ] = await Promise.all([
      dashboardRepository.getCollectionItems('users'),
      dashboardRepository.getCollectionItems('clients'),
      dashboardRepository.getCollectionItems('suppliers'),
      dashboardRepository.getCollectionItems('products'),
      dashboardRepository.getCollectionItems('recepciones'),
      dashboardRepository.getCollectionItems('inventory_movements'),
      dashboardRepository.getCollectionItems('audit')
    ])

    const activeUsers = users.filter((item) => item.activo ?? true)
    const activeClients = clients.filter((item) => item.activo ?? true)
    const activeSuppliers = suppliers.filter((item) => item.activo ?? true)
    const activeProducts = products.filter((item) => item.activo ?? true)

    const lowStockProducts = activeProducts
      .filter((product) => Number(product.stock || 0) <= Number(product.stockMinimo || 0))
      .sort((a, b) => {
        const aDiff = Number(a.stock || 0) - Number(a.stockMinimo || 0)
        const bDiff = Number(b.stock || 0) - Number(b.stockMinimo || 0)
        return aDiff - bDiff
      })
      .slice(0, 10)
      .map((product) => ({
        id: product.id,
        sku: product.sku || '',
        nombre: product.nombre || '',
        stock: Number(product.stock || 0),
        stockMinimo: Number(product.stockMinimo || 0),
        lowStock: true,
        activo: product.activo ?? true
      }))

    const recepcionesRecientes = recepciones
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime()
        const bDate = new Date(b.createdAt || 0).getTime()
        return bDate - aDate
      })
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        folio: item.folio || '',
        supplierNombre: item.supplierNombre || '',
        fecha: item.fecha || '',
        status: item.status || 'DRAFT',
        total: Number(item.total || 0),
        createdAt: item.createdAt || null
      }))

    const recentInventoryMovements = inventoryMovements
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime()
        const bDate = new Date(b.createdAt || 0).getTime()
        return bDate - aDate
      })
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        productId: item.productId || '',
        sku: item.sku || '',
        productNombre: item.productNombre || '',
        tipo: item.tipo || '',
        cantidad: Number(item.cantidad || 0),
        stockAnterior: Number(item.stockAnterior || 0),
        stockNuevo: Number(item.stockNuevo || 0),
        motivo: item.motivo || '',
        referencia: item.referencia || '',
        usuario: item.usuario || '',
        createdAt: item.createdAt || null
      }))

    const recentAudit = auditLogs
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime()
        const bDate = new Date(b.createdAt || 0).getTime()
        return bDate - aDate
      })
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        action: item.action || '',
        resource: item.resource || '',
        resourceId: item.resourceId || '',
        usuario: item.usuario || '',
        createdAt: item.createdAt || null
      }))

    return {
      totals: {
        users: users.length,
        activeUsers: activeUsers.length,
        clients: clients.length,
        activeClients: activeClients.length,
        suppliers: suppliers.length,
        activeSuppliers: activeSuppliers.length,
        products: products.length,
        activeProducts: activeProducts.length,
        recepciones: recepciones.length
      },
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recepcionesRecientes,
      recentInventoryMovements,
      recentAudit
    }
  }

  async recentActivity(limit = 10) {
    const auditLogs = await dashboardRepository.getCollectionItems('audit')

    const items = auditLogs
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime()
        const bDate = new Date(b.createdAt || 0).getTime()
        return bDate - aDate
      })
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        action: item.action || '',
        resource: item.resource || '',
        resourceId: item.resourceId || '',
        details: item.details || {},
        userId: item.userId || '',
        usuario: item.usuario || '',
        createdAt: item.createdAt || null
      }))

    return {
      items,
      total: items.length,
      limit
    }
  }
}

export const dashboardService = new DashboardService()