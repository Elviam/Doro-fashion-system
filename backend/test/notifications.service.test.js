import test from 'node:test'
import assert from 'node:assert/strict'

const [{ NotificationsService }, { prisma }, authorization] = await Promise.all([
  import('../src/modules/notifications/notifications.service.js'),
  import('../src/lib/prisma.js'),
  import('../src/services/authorization.service.js'),
])

function stubNotificationsData(t, { pendingOrders = 0, products = [], priceReviews = [], receptions = [], onReceptionQuery } = {}) {
  const original = {
    saleCount: prisma.sale.count,
    receptionFindMany: prisma.reception.findMany,
    productFindMany: prisma.product.findMany,
  }
  t.after(() => {
    prisma.sale.count = original.saleCount
    prisma.reception.findMany = original.receptionFindMany
    prisma.product.findMany = original.productFindMany
  })
  prisma.sale.count = async () => pendingOrders
  prisma.reception.findMany = async (query) => {
    onReceptionQuery?.(query)
    return receptions
  }
  let productCall = 0
  prisma.product.findMany = async () => (++productCall === 1 ? products : priceReviews)
}

test('authorization normalizes role and permission shapes and keeps ADMIN global', () => {
  const admin = { role: { codigo: 'admin' }, permissions: [] }
  const warehouse = { role: { name: 'bodeguero' }, permissions: [{ code: 'FULFILLMENT:READ' }, { permission: { codigo: 'recepciones:read' } }] }
  assert.equal(authorization.getRoleCode(admin), 'ADMIN')
  assert.equal(authorization.hasPermission(admin, 'products:read'), true)
  assert.deepEqual(authorization.normalizeAuthenticatedUser(warehouse).permissions, ['fulfillment:read', 'recepciones:read'])
  assert.equal(authorization.hasPermission(warehouse, 'fulfillment:read'), true)
})

test('ADMIN with empty or outdated permissions receives only administrative notifications', async (t) => {
  stubNotificationsData(t, {
    products: [{ id: 'product-1', nombre: 'Vestido', stockMinimo: 3, updatedAt: null, variants: [{ id: 'variant-1', talla: 'M', stock: 3 }] }],
    priceReviews: [{ id: 'product-2', nombre: 'Blusa', purchasePriceChangedAt: null }],
    receptions: [{ id: 'reception-1', supplier: { nombre: 'Proveedor' }, createdAt: null }],
  })
  const result = await new NotificationsService().getNotifications({ role: { code: 'ADMIN' }, permissions: [] })
  assert.equal(result.total, result.items.length)
  assert.deepEqual(result.items.map((item) => item.tipo).sort(), ['revision_precio_venta', 'stock_bajo'])
  assert.ok(result.items.every((item) => item.createdAt === null))
})

test('secondary ADMIN retains the same global notification access', async (t) => {
  stubNotificationsData(t, { products: [{ id: 'p', nombre: 'Pantalón', stockMinimo: 2, variants: [{ id: 'v', talla: 'CH', stock: 1 }] }] })
  const result = await new NotificationsService().getNotifications({ role: 'ADMIN', isPrimaryAdmin: false, permissions: ['stale:permission'] })
  assert.equal(result.total, 1)
  assert.equal(result.items[0].tipo, 'stock_bajo')
})

test('warehouse receives one identifiable notification per sent supplier order', async (t) => {
  let receptionQuery
  stubNotificationsData(t, {
    pendingOrders: 2,
    receptions: [
      { id: 'rec-1', folio: 'RCP-001', supplier: { nombre: 'Proveedor A' }, sentAt: new Date('2026-07-28T10:00:00Z') },
      { id: 'rec-2', folio: 'RCP-002', supplier: { nombre: 'Proveedor B' }, sentAt: new Date('2026-07-29T10:00:00Z') },
    ],
    onReceptionQuery: (query) => { receptionQuery = query },
  })
  const result = await new NotificationsService().getNotifications({ role: { codigo: 'BODEGUERO' }, permissions: [{ code: 'fulfillment:read' }, { codigo: 'recepciones:read' }] })
  assert.equal(result.total, 3)
  assert.deepEqual(receptionQuery.where, { estado: 'ENVIADA', origen: 'REABASTECIMIENTO' })
  assert.deepEqual(result.items.filter((item) => item.tipo === 'pedido_pendiente_recepcion').map((item) => [item.id, item.titulo, item.mensaje]), [
    ['recepcion-rec-2', 'Pedido disponible para recepción', 'RCP-002 · Proveedor B'],
    ['recepcion-rec-1', 'Pedido disponible para recepción', 'RCP-001 · Proveedor A'],
  ])
  assert.equal(new Set(result.items.map((item) => item.id)).size, result.items.length)
})

test('reloading the same pending event is idempotent and never adds an active duplicate', async (t) => {
  stubNotificationsData(t, {
    receptions: [{ id: 'rec-1', folio: 'RCP-001', supplier: { nombre: 'Proveedor' }, createdAt: null }],
  })
  const service = new NotificationsService()
  const user = { role: 'BODEGUERO', permissions: ['recepciones:read'] }

  const first = await service.getNotifications(user)
  const second = await service.getNotifications(user)

  assert.deepEqual(second.items, first.items)
  assert.deepEqual(first.items.map((item) => item.id), ['recepcion-rec-1'])
})

test('warehouse without a functional permission receives no category it cannot access', async (t) => {
  stubNotificationsData(t, { receptions: [{ id: 'rec-1', folio: 'RCP-001', supplier: null, createdAt: null }] })
  const result = await new NotificationsService().getNotifications({ role: 'BODEGUERO', permissions: ['recepciones:read'] })
  assert.equal(result.total, 1)
  assert.equal(result.items[0].tipo, 'pedido_pendiente_recepcion')
})

test('resolved receptions are omitted while another sent order remains visible', async (t) => {
  stubNotificationsData(t, {
    // This is the database result after rec-confirmed and rec-canceled changed
    // state, so only the independently pending order satisfies the query.
    receptions: [{ id: 'rec-pending', folio: 'RCP-003', supplier: { nombre: 'Proveedor' }, createdAt: null }],
  })
  const result = await new NotificationsService().getNotifications({ role: 'BODEGUERO', permissions: ['recepciones:read'] })
  assert.deepEqual(result.items.map((item) => item.id), ['recepcion-rec-pending'])
})

test('warehouse notifications disappear when no actionable work remains', async (t) => {
  stubNotificationsData(t)
  const result = await new NotificationsService().getNotifications({ role: 'BODEGUERO', permissions: ['fulfillment:read', 'recepciones:read'] })
  assert.equal(result.total, 0)
  assert.deepEqual(result.items, [])
})
