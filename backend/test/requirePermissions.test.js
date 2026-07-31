import test from 'node:test'
import assert from 'node:assert/strict'
import { requireAnyPermission, requirePermissions, requirePrimaryAdmin, requireClientAccount, requireStaffAccount } from '../src/middlewares/requirePermissions.js'

function execute(middleware, user) {
  return new Promise((resolve) => {
    const req = { user }
    const res = { statusCode: null, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; resolve({ next: false, res: this }) } }
    middleware(req, res, () => resolve({ next: true, res }))
  })
}

test('requirePermissions devuelve 401 sin sesión autenticada', async () => {
  const result = await execute(requirePermissions(['recepciones:read']), null)
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 401)
})

test('requirePermissions devuelve 403 si falta el permiso', async () => {
  const result = await execute(requirePermissions(['recepciones:confirm']), { accountType: 'STAFF', permissions: ['recepciones:read'] })
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 403)
})

test('requirePermissions permite continuar con el permiso exacto', async () => {
  const result = await execute(requirePermissions(['recepciones:confirm']), { accountType: 'STAFF', permissions: ['recepciones:read', 'recepciones:confirm'] })
  assert.equal(result.next, true)
})

test('POST /api/recepciones permite al ADMIN principal autenticado aunque permissions este vacio', async () => {
  const result = await execute(requirePermissions(['pedidos_proveedor:create']), {
    accountType: 'STAFF', role: 'ADMIN', isPrimaryAdmin: true, permissions: [],
  })
  assert.equal(result.next, true)
  assert.notEqual(result.res.statusCode, 403)
})

test('ADMIN secundario y ADMIN con permisos desactualizados conservan acceso global', async () => {
  for (const user of [
    { accountType: 'STAFF', role: 'ADMIN', isPrimaryAdmin: false, permissions: [] },
    { accountType: 'STAFF', role: { codigo: 'administrador' }, permissions: ['recepciones:create'] },
  ]) {
    const result = await execute(requirePermissions(['reabastecimiento:read', 'pedidos_proveedor:send']), user)
    assert.equal(result.next, true)
  }
})

test('BODEGUERO conserva permisos efectivos y no obtiene acceso global', async () => {
  const allowed = await execute(requirePermissions(['pedidos_proveedor:create']), {
    accountType: 'STAFF', role: 'BODEGUERO', permissions: ['pedidos_proveedor:create'],
  })
  const denied = await execute(requirePermissions(['pedidos_proveedor:send']), {
    accountType: 'STAFF', role: 'BODEGUERO', permissions: ['pedidos_proveedor:create'],
  })
  assert.equal(allowed.next, true)
  assert.equal(denied.res.statusCode, 403)
})

test('los permisos legados de recepciones no autorizan Reabastecimiento', async () => {
  const result = await execute(requirePermissions(['pedidos_proveedor:create']), {
    accountType: 'STAFF', role: 'BODEGUERO', permissions: ['recepciones:create'],
  })
  assert.equal(result.res.statusCode, 403)
})

test('requireAnyPermission respeta el acceso global de ADMIN', async () => {
  const result = await execute(requireAnyPermission(['pedidos_proveedor:send', 'recepciones:cancel']), {
    accountType: 'STAFF', role: 'ADMIN', permissions: [],
  })
  assert.equal(result.next, true)
})

test('un administrador secundario no supera la invariante de administrador principal', async () => {
  const result = await execute(requirePrimaryAdmin, { accountType: 'STAFF', role: 'ADMIN', isPrimaryAdmin: false })
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 403)
})

test('las rutas de cliente rechazan a cuentas internas', async () => {
  const result = await execute(requireClientAccount, { accountType: 'STAFF', role: 'BODEGUERO' })
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 403)
})

test('las rutas de personal rechazan un JWT de cliente', async () => {
  const result = await execute(requireStaffAccount, { accountType: 'CLIENT', role: 'CLIENTE' })
  assert.equal(result.next, false)
  assert.equal(result.res.statusCode, 403)
})
