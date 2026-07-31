import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/doro_test'
process.env.DIRECT_URL ??= process.env.DATABASE_URL

const [{ VentasService }, { ventasRepository }] = await Promise.all([
  import('../src/modules/ventas/ventas.service.js'),
  import('../src/modules/ventas/ventas.repository.js'),
])

function makeVenta(overrides = {}) {
  return {
    id: 'venta-1',
    clientId: 'client-a',
    cliente: { id: 'client-a', userId: 'different-user' },
    estado: 'PENDIENTE',
    metodoPago: 'tarjeta',
    ...overrides,
  }
}

function createService(t, venta) {
  const originalFindById = ventasRepository.findById
  ventasRepository.findById = async () => venta
  t.after(() => { ventasRepository.findById = originalFindById })

  const service = new VentasService()
  const updates = []
  service.updateEstado = async (...args) => {
    updates.push(args)
    return { id: args[0], estado: args[1] }
  }
  return { service, updates }
}

test('CLIENT propietario confirma pagos simulados con tarjeta y OXXO usando sale.clientId', async (t) => {
  for (const metodoPago of ['tarjeta', 'oxxo']) {
    const { service, updates } = createService(t, makeVenta({ metodoPago }))
    const result = await service.simulatePayment('venta-1', { sub: 'client-a', role: 'CLIENTE', accountType: 'CLIENT' })

    assert.equal(result.estado, 'PAGADO')
    assert.deepEqual(updates, [['venta-1', 'PAGADO', { sub: 'client-a', role: 'CLIENTE', accountType: 'CLIENT' }]])
  }
})

test('CLIENT propietario usa cliente.id solo cuando el repositorio no incluye clientId', async (t) => {
  const { service, updates } = createService(t, makeVenta({ clientId: undefined, cliente: { id: 'client-a' } }))

  await service.simulatePayment('venta-1', { sub: 'client-a', role: 'CLIENTE' })

  assert.equal(updates.length, 1)
})

test('CLIENT ajeno no puede pagar y no ejecuta la transición que descuenta stock', async (t) => {
  const { service, updates } = createService(t, makeVenta())

  await assert.rejects(
    () => service.simulatePayment('venta-1', { sub: 'client-b', role: 'CLIENTE' }),
    (error) => error.statusCode === 403,
  )
  assert.equal(updates.length, 0)
})

test('STAFF, venta inexistente y venta ya procesada conservan sus respuestas de error', async (t) => {
  const staff = createService(t, makeVenta())
  await assert.rejects(
    () => staff.service.simulatePayment('venta-1', { sub: 'staff-1', role: 'ADMIN', accountType: 'STAFF' }),
    (error) => error.statusCode === 403,
  )
  assert.equal(staff.updates.length, 0)

  const inexistente = createService(t, null)
  await assert.rejects(
    () => inexistente.service.simulatePayment('missing', { sub: 'client-a', role: 'CLIENTE' }),
    (error) => error.statusCode === 404,
  )

  const procesada = createService(t, makeVenta({ estado: 'PAGADO' }))
  await assert.rejects(
    () => procesada.service.simulatePayment('venta-1', { sub: 'client-a', role: 'CLIENTE' }),
    (error) => error.statusCode === 400,
  )
  assert.equal(procesada.updates.length, 0)
})
