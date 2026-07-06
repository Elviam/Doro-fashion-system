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
      dashboardRepository.getUsers(),
      dashboardRepository.getClients(),
      dashboardRepository.getSuppliers(),
      dashboardRepository.getProducts(),
      dashboardRepository.getRecepciones(),
      dashboardRepository.getInventoryMovements(),
      dashboardRepository.getAuditLogs()
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
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        folio: item.id.slice(0, 8).toUpperCase(),
        supplierNombre: item.supplier?.nombre || '',
        fecha: item.createdAt || '',
        status: item.estado || 'PENDIENTE',
        total: 0,
        createdAt: item.createdAt || null
      }))

    const recentInventoryMovements = inventoryMovements
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        productId: item.productId || '',
        sku: item.product?.sku || '',
        productNombre: item.product?.nombre || '',
        tipo: item.tipo || '',
        cantidad: Number(item.cantidad || 0),
        stockAnterior: null,
        stockNuevo: null,
        motivo: item.motivo || '',
        referencia: '',
        usuario: '',
        createdAt: item.createdAt || null
      }))

    const recentAudit = auditLogs
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        action: item.accion || '',
        resource: item.entidad || '',
        resourceId: item.entidadId || '',
        usuario: item.user ? `${item.user.nombre} ${item.user.apellido}` : '',
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
    const auditLogs = await dashboardRepository.getAuditLogs()

    const items = auditLogs
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        action: item.accion || '',
        resource: item.entidad || '',
        resourceId: item.entidadId || '',
        details: item.detalles || {},
        userId: item.userId || '',
        usuario: item.user ? `${item.user.nombre} ${item.user.apellido}` : '',
        createdAt: item.createdAt || null
      }))

    return { items, total: items.length, limit }
  }
}

export const dashboardService = new DashboardService()