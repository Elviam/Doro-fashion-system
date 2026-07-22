import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/doro_test'
process.env.DIRECT_URL ??= process.env.DATABASE_URL

const { RecepcionesService } = await import('../src/modules/recepciones/recepciones.service.js')

function makeReception(estado = 'ENVIADA') {
  return {
    id: 'rec-1', folio: 'RCP-001', origen: 'REABASTECIMIENTO', estado,
    items: [
      { id: 'item-1', productId: 'prod-1', talla: 'M', cantidad: 5, costoUnitario: 100, product: { nombre: 'Blusa', sku: 'BLU-M' } },
      { id: 'item-2', productId: 'prod-2', talla: 'L', cantidad: 2, costoUnitario: 150, product: { nombre: 'Pantalón', sku: 'PAN-L' } },
    ],
  }
}

function createTransactionPrisma(current, calls) {
  const tx = {
    reception: {
      findUnique: async () => current,
      update: async ({ data }) => ({ ...current, ...data }),
    },
    receptionItem: { update: async (input) => { calls.itemUpdates.push(input); return input } },
    productVariant: {
      findUnique: async () => ({ stock: 4 }),
      upsert: async (input) => { calls.variantUpserts.push(input); return { stock: 4 + input.create.stock } },
    },
    product: { update: async (input) => { calls.productUpdates.push(input); return input } },
    inventoryMovement: { create: async ({ data }) => { calls.movements.push(data); return { id: `mov-${calls.movements.length}`, ...data } } },
  }
  return { $transaction: async (callback) => callback(tx) }
}

test('enviar cambia un pedido BORRADOR de reabastecimiento a ENVIADA', async () => {
  const reception = makeReception('BORRADOR')
  const updates = []
  const service = new RecepcionesService({
    repository: { findById: async () => reception, update: async (_id, data) => { updates.push(data); return { ...reception, ...data } } },
    prismaClient: {}, auditLogger: async () => {},
  })

  const result = await service.enviar(reception.id, { id: 'admin-1' })

  assert.equal(updates[0].estado, 'ENVIADA')
  assert.equal(updates[0].sentBy, 'admin-1')
  assert.equal(result.item.status, 'ENVIADA')
})

test('crear pedido permite guardarlo en BORRADOR sin proveedor', async () => {
  let supplierConsultado = false
  let datosCreados
  const repository = {
    findByFolio: async () => null,
    findSupplierById: async () => { supplierConsultado = true; return null },
    findProductById: async () => ({ id: 'prod-1', sku: 'BLU-001', nombre: 'Blusa', imagenes: [] }),
    create: async (data) => {
      datosCreados = data
      return {
        id: 'rec-sin-proveedor', ...data, createdAt: new Date(), items: data.items.map((item, index) => ({
          id: `item-${index}`, ...item, product: { sku: 'BLU-001', nombre: 'Blusa', imagenes: [] },
        })),
      }
    },
  }
  const service = new RecepcionesService({ repository, prismaClient: {}, auditLogger: async () => {} })

  const pedido = await service.create({
    origen: 'REABASTECIMIENTO', folio: 'RCP-050', fecha: '2026-07-16T00:00:00.000Z', supplierId: null,
    items: [{ productId: 'prod-1', talla: 'M', cantidad: 2, costoUnitario: 120 }],
  }, { usuario: 'admin' })

  assert.equal(supplierConsultado, false)
  assert.equal(datosCreados.supplierId, null)
  assert.equal(datosCreados.estado, 'BORRADOR')
  assert.equal(pedido.status, 'BORRADOR')
})

test('enviar rechaza un pedido que no está en BORRADOR', async () => {
  const service = new RecepcionesService({
    repository: { findById: async () => makeReception('CONFIRMADA') }, prismaClient: {}, auditLogger: async () => {},
  })

  await assert.rejects(() => service.enviar('rec-1', { id: 'admin-1' }), (error) => error.statusCode === 400)
})

test('confirmación parcial actualiza stock, omite movimientos cero y reporta faltantes', async () => {
  const reception = makeReception()
  const calls = { itemUpdates: [], variantUpserts: [], productUpdates: [], movements: [] }
  const service = new RecepcionesService({
    repository: { findById: async () => reception },
    prismaClient: createTransactionPrisma(reception, calls),
    auditLogger: async () => {},
  })
  service.attachAuditUsers = async (items) => items
  service.sanitizeRecepcion = (item) => ({
    ...item,
    items: item.items.map((line) => ({
      ...line, productNombre: line.product.nombre, cantidadRecibida: line.id === 'item-1' ? 3 : 0,
    })),
  })
  service.sanitizeMovement = (movement) => movement

  const result = await service.confirm('rec-1', [
    { id: 'item-1', cantidadRecibida: 3, costoUnitarioReal: 115 },
    { id: 'item-2', cantidadRecibida: 0, costoUnitarioReal: 150 },
  ], 'FAC-100', undefined, { id: 'bodega-1' })

  assert.equal(calls.itemUpdates.length, 2)
  assert.equal(calls.variantUpserts.length, 1)
  assert.equal(calls.movements.length, 1)
  assert.equal(calls.movements[0].cantidad, 3)
  assert.equal(calls.itemUpdates[0].data.costoUnitarioReal, 115)
  assert.equal(calls.productUpdates.length, 0)
  assert.equal(result.itemsFaltantes.length, 2)
  assert.deepEqual(result.itemsFaltantes.map((item) => item.cantidadRecibida), [3, 0])
})

test('confirmación rechaza recibir más unidades de las pedidas', async () => {
  const reception = makeReception()
  const service = new RecepcionesService({
    repository: { findById: async () => reception },
    prismaClient: { $transaction: async () => { throw new Error('No debe iniciar transacción') } },
    auditLogger: async () => {},
  })

  await assert.rejects(
    () => service.confirm('rec-1', [
      { id: 'item-1', cantidadRecibida: 6 },
      { id: 'item-2', cantidadRecibida: 2 },
    ], undefined, undefined, { id: 'bodega-1' }),
    (error) => error.statusCode === 400,
  )
})
