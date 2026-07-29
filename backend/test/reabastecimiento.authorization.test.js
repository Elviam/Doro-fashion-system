import test from 'node:test'
import assert from 'node:assert/strict'

import { requirePermissions } from '../src/middlewares/requirePermissions.js'

function run(middleware, permissions) {
  let statusCode = null
  let nextCalled = false
  middleware(
    { user: { accountType: 'STAFF', permissions } },
    { status: (code) => { statusCode = code; return { json: () => {} } } },
    () => { nextCalled = true }
  )
  return { statusCode, nextCalled }
}

test('recepciones:create no autoriza crear pedidos a proveedor', () => {
  const result = run(requirePermissions(['pedidos_proveedor:create']), ['recepciones:create'])
  assert.equal(result.statusCode, 403)
  assert.equal(result.nextCalled, false)
})

test('recepciones:read no autoriza el listado administrativo de reabastecimiento', () => {
  const result = run(requirePermissions(['reabastecimiento:read']), ['recepciones:read'])
  assert.equal(result.statusCode, 403)
  assert.equal(result.nextCalled, false)
})

test('bodeguero puede consultar pendientes y confirmar con permisos de recepcion', () => {
  assert.equal(run(requirePermissions(['recepciones:read']), ['recepciones:read', 'recepciones:confirm']).nextCalled, true)
  assert.equal(run(requirePermissions(['recepciones:confirm']), ['recepciones:read', 'recepciones:confirm']).nextCalled, true)
})

test('administrador puede crear, consultar y enviar pedidos a proveedor', () => {
  const permissions = ['reabastecimiento:read', 'pedidos_proveedor:create', 'pedidos_proveedor:send']
  assert.equal(run(requirePermissions(['pedidos_proveedor:create']), permissions).nextCalled, true)
  assert.equal(run(requirePermissions(['reabastecimiento:read']), permissions).nextCalled, true)
  assert.equal(run(requirePermissions(['pedidos_proveedor:send']), permissions).nextCalled, true)
})
