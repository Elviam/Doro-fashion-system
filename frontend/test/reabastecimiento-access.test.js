import test from 'node:test'
import assert from 'node:assert/strict'
import { getRoleCode, hasAnyPermission, hasPermission, normalizeAuthenticatedUser } from '../src/utils/accessControl.js'
import { hasPageAccess } from '../src/utils/permissionMapper.js'

const admin = { role: 'ADMIN', accountType: 'STAFF', permissions: [] }
const bodeguero = { role: 'BODEGUERO', accountType: 'STAFF', permissions: ['inventory:read', 'fulfillment:read', 'recepciones:read'] }

test('ADMIN has presentation access to all replenishment sections despite stale permissions', () => {
  assert.equal(getRoleCode(admin), 'ADMIN')
  assert.equal(hasPermission(admin, 'reabastecimiento:read'), true)
  assert.equal(hasAnyPermission(admin, ['pedidos_proveedor:create', 'pedidos_proveedor:send']), true)
  assert.equal(hasPageAccess(admin, 'reabastecimiento'), true)
  assert.equal(hasPageAccess(admin, 'generarPedidoProveedor'), true)
  assert.equal(hasPageAccess(admin, 'pedidosProveedor'), true)
})

test('BODEGUERO uses only dynamic permissions for replenishment navigation', () => {
  assert.equal(hasAnyPermission(bodeguero, ['reabastecimiento:read', 'pedidos_proveedor:create', 'pedidos_proveedor:send']), false)
  assert.equal(hasPageAccess(bodeguero, 'reabastecimiento'), false)
  assert.equal(hasPageAccess(bodeguero, 'generarPedidoProveedor'), false)
  assert.equal(hasPageAccess(bodeguero, 'pedidosProveedor'), false)
})

test('BODEGUERO with create permission sees only Generate supplier order', () => {
  const withCreate = { ...bodeguero, permissions: [...bodeguero.permissions, 'pedidos_proveedor:create'] }
  assert.equal(hasPageAccess(withCreate, 'reabastecimiento'), false)
  assert.equal(hasPageAccess(withCreate, 'generarPedidoProveedor'), true)
  assert.equal(hasPageAccess(withCreate, 'pedidosProveedor'), false)
})

test('session normalization retains current staff role and permissions from auth me', () => {
  const user = normalizeAuthenticatedUser({ role: { codigo: 'admin' }, permissions: ['reabastecimiento:read'], accountType: 'STAFF', isPrimaryAdmin: true })
  assert.equal(user.role, 'ADMIN')
  assert.deepEqual(user.permissions, ['reabastecimiento:read'])
  assert.equal(user.accountType, 'STAFF')
  assert.equal(user.isPrimaryAdmin, true)
})

test('ADMIN secondary and legacy role spelling retain global page and action access', () => {
  const secondaryAdmin = { role: { codigo: 'administrador' }, accountType: 'staff', permissions: ['recepciones:create'] }
  assert.equal(hasPageAccess(secondaryAdmin, 'reabastecimiento'), true)
  assert.equal(hasPageAccess(secondaryAdmin, 'generarPedidoProveedor'), true)
  assert.equal(hasPageAccess(secondaryAdmin, 'pedidosProveedor'), true)
  assert.equal(hasPermission(secondaryAdmin, 'pedidos_proveedor:send'), true)
})
