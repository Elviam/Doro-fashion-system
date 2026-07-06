import { prisma } from '../../lib/prisma.js'

export class DashboardRepository {
  async getUsers()               { return prisma.user.findMany() }
  async getClients()             { return prisma.client.findMany() }
  async getSuppliers()           { return prisma.supplier.findMany() }
  async getProducts()            { return prisma.product.findMany() }
  async getRecepciones()         { return prisma.reception.findMany({ include: { supplier: true } }) }
  async getInventoryMovements()  { return prisma.inventoryMovement.findMany({ include: { product: true } }) }
  async getAuditLogs()           { return prisma.auditLog.findMany({ include: { user: true } }) }
}

export const dashboardRepository = new DashboardRepository()